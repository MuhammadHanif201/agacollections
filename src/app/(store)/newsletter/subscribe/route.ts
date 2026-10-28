import { resolve4, resolve6, resolveMx } from 'node:dns/promises';
import { dirty, recordAudit } from '@/lib/admin/audit';
import { headers } from 'next/headers';
import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { sendMail } from '@/lib/mail';
import { clientIp, throttle } from '@/lib/request';
import { json, readBody, rejectCrossSite, tooManyRequests } from '@/lib/route';
import { signedUrl } from '@/lib/signed-url';
import { newsletterWelcomeHtml, newsletterWelcomeText } from '@/emails/templates';
import { NewsletterSubscriber } from '@/models/content';
import { nextId } from '@/models/Counter';
import { getCompanySetting } from '@/services/settings';
import { newsletterSchema } from '@/validators/store';

/** email:dns — the domain must accept mail (MX record, else an address record) */
async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try { if ((await resolveMx(domain)).length) return true; } catch { /* fall through */ }
  try { if ((await resolve4(domain)).length) return true; } catch { /* fall through */ }
  try { if ((await resolve6(domain)).length) return true; } catch { /* fall through */ }
  return false;
}

/** NewsletterController::subscribe */
export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  if (!(await throttle('newsletter', 5))) return tooManyRequests();
  const body = await readBody(req);

  // Honeypot: a filled hidden field is probably a bot
  if (typeof body.company_name === 'string' && body.company_name.trim() !== '') {
    return json({ status: 'success', message: 'Thanks! You are subscribed.' });
  }

  const parsed = newsletterSchema.safeParse({ email: body.email });
  if (!parsed.success || !(await domainAcceptsMail(parsed.data.email.trim()))) {
    const message = parsed.success ? 'The email field must be a valid email address.' : parsed.error.issues[0].message;
    return json({ message, errors: { email: [message] } }, 422);
  }
  const email = parsed.data.email.trim().toLowerCase();

  await connectDb();
  const h = await headers();
  const meta = {
    status: 'subscribed' as const,
    ip: (await clientIp()).slice(0, 45),
    user_agent: (h.get('user-agent') ?? '').slice(0, 512),
    referrer: (h.get('referer') ?? '').slice(0, 512),
  };
  const existing = await NewsletterSubscriber.findOne({ email }).lean();
  const wasNew = !existing;
  const wasUnsubscribed = existing?.status === 'unsubscribed';
  let id: number;
  if (existing) {
    id = existing._id;
    await NewsletterSubscriber.updateOne({ _id: id }, { $set: meta });
    const d = dirty(existing as unknown as Record<string, unknown>, meta);
    if (d.changed) await recordAudit({ event: 'updated', type: 'App\\Models\\NewsletterSubscriber', id, old: d.old, new: d.new });
  } else {
    id = await nextId('newsletter_subscribers');
    await NewsletterSubscriber.create({ _id: id, email, ...meta });
    await recordAudit({ event: 'created', type: 'App\\Models\\NewsletterSubscriber', id, new: { email, ...meta, id } });
  }

  if (wasNew || wasUnsubscribed) {
    // The subscription is saved; only the welcome email may fail
    try {
      const setting = await getCompanySetting();
      const brand = setting?.name ?? '';
      const p = {
        brand,
        appUrl: env.appUrl,
        shopUrl: env.appUrl + '/shop',
        unsubscribeUrl: signedUrl(`/newsletter/unsubscribe/${id}`),
        supportEmail: Array.isArray(setting?.emails) ? setting!.emails[1] ?? '' : '',
      };
      await sendMail({ to: email, subject: `Welcome to ${brand} – You’re in! ✨`, html: newsletterWelcomeHtml(p), text: newsletterWelcomeText(p) });
    } catch (e) {
      console.warn('Newsletter welcome email failed: ' + (e as Error).message);
    }
    return json({ status: 'success', message: 'Thanks! You are subscribed.' });
  }

  return json({ status: 'info', message: 'You are already subscribed. Thank you!' });
}
