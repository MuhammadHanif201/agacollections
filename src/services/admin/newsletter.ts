import 'server-only';
import { createRow, updateRow, type Who } from '@/lib/admin/crud';
import { str, type FormInput } from '@/lib/admin/form';
import { Carbon, Paginator, carbonize, withView, type ViewRequest } from '@/lib/admin/php';
import { connectDb } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { signedUrl } from '@/lib/signed-url';
import { NewsletterSubscriber } from '@/models/content';
import { nextId } from '@/models/Counter';
import { NewsletterCampaign, NewsletterDelivery } from '@/models/Newsletter';
import { Product } from '@/models/Product';
import campaignMail from '@/admin-views/emails/newsletter-campaign';
import { like, pageParam } from './models';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** NewsletterAdminController::index */
export async function subscriberIndexData(url: URL) {
  await connectDb();
  const statusFilter = url.searchParams.get('status');
  const search = url.searchParams.get('q');
  const f: Record<string, unknown> = {};
  if (statusFilter) f.status = statusFilter;
  if (search) f.email = like(search);
  const perPage = 25;
  const page = pageParam(url);
  const [total, rows, all, subscribed, unsubscribed] = await Promise.all([
    NewsletterSubscriber.countDocuments(f),
    NewsletterSubscriber.find(f).sort({ created_at: -1, _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
    NewsletterSubscriber.countDocuments(), NewsletterSubscriber.countDocuments({ status: 'subscribed' }), NewsletterSubscriber.countDocuments({ status: 'unsubscribed' }),
  ]);
  return { subs: Paginator.make(rows.map(carbonize), total, perPage, page).withQueryString(), stats: { total: all, subscribed, unsubscribed }, statusFilter, search };
}

/** NewsletterAdminController::export */
export async function subscribersCsv() {
  await connectDb();
  const rows = await NewsletterSubscriber.find().sort({ _id: 1 }).lean();
  let csv = 'email,status,ip,user_agent,referrer,created_at\n';
  for (const r of rows) {
    const at = r.created_at ? new Carbon(r.created_at.getTime()).timezone('Asia/Karachi').toDateTimeString() : '';
    csv += `"${r.email}",${r.status},${r.ip ?? ''},"${String(r.user_agent ?? '').replace(/"/g, '""')}","${String(r.referrer ?? '').replace(/"/g, '""')}",${at}\n`;
  }
  return csv;
}

export const campaignRules = {
  subject: 'required|string|max:255',
  body_html: 'nullable|string',
  product_id: ['nullable', 'integer', { name: 'exists', test: async (v: unknown) => !!(await Product.exists({ _id: Number(v) })) }],
  status: 'nullable|string|in:draft,sent',
};

/** NewsletterCampaignController::index */
export async function campaignIndexData(url: URL) {
  await connectDb();
  const perPage = 20;
  const page = pageParam(url);
  const [total, rows] = await Promise.all([
    NewsletterCampaign.countDocuments(),
    NewsletterCampaign.find().sort({ created_at: -1, _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  return { campaigns: Paginator.make(rows.map(carbonize), total, perPage, page) };
}

export async function campaignById(id: number) {
  await connectDb();
  return NewsletterCampaign.findById(id).lean();
}

const campaignAttrs = (input: FormInput) => {
  const out: Record<string, unknown> = {};
  for (const k of ['subject', 'body_html', 'product_id', 'status']) {
    if (!(k in input)) continue;
    out[k] = k === 'product_id' ? (str(input, k) === null ? null : Number(str(input, k))) : str(input, k);
  }
  return out;
};

export async function storeCampaign(input: FormInput, who: Who) {
  const attrs = campaignAttrs(input);
  attrs.status = attrs.status ?? 'draft';
  await createRow(NewsletterCampaign, 'newsletter_campaigns', 'App\\Models\\NewsletterCampaign', attrs, who);
}

export async function updateCampaign(before: any, input: FormInput, who: Who) {
  const attrs = campaignAttrs(input);
  if (attrs.status === 'sent') delete attrs.status;
  await updateRow(NewsletterCampaign, 'App\\Models\\NewsletterCampaign', before, attrs, who);
}

/**
 * NewsletterCampaignController::send. The PHP marked the campaign with a STATUS_SENDING
 * constant the model never defined (so the button failed); here the intended flow runs:
 * one delivery row per subscriber, the email, then the campaign is marked sent.
 */
export async function sendCampaign(before: any, origin: string, who: Who): Promise<{ error?: string; success?: string }> {
  if (before.status === 'sent') return { error: 'This campaign has already been sent.' };
  const subs = await NewsletterSubscriber.find({ status: 'subscribed' }).sort({ _id: 1 }).lean();
  const ctx: ViewRequest = { origin, path: '/', query: new URLSearchParams(), routeName: '', old: {}, hasOld: false, errors: {}, flash: {}, csrf: '', user: null, companySetting: null, stack: [], previous: undefined };
  for (const s of subs) {
    let delivery = await NewsletterDelivery.findOne({ campaign_id: before._id, subscriber_id: s._id }).lean();
    if (!delivery) {
      const now = new Date();
      await NewsletterDelivery.create({ _id: await nextId('newsletter_deliveries'), campaign_id: before._id, subscriber_id: s._id, status: 'queued', created_at: now, updated_at: now });
      delivery = await NewsletterDelivery.findOne({ campaign_id: before._id, subscriber_id: s._id }).lean();
    }
    const unsubscribeUrl = signedUrl(`/newsletter/unsubscribe/${s._id}`);
    const body = withView(ctx, () => campaignMail({ campaign: carbonize(before), unsubscribeUrl }).content.value);
    try {
      await sendMail({ to: s.email, subject: before.subject, html: body });
      await NewsletterDelivery.updateOne({ _id: delivery!._id }, { $set: { status: 'sent', sent_at: new Date(), updated_at: new Date() } });
    } catch (e) {
      await NewsletterDelivery.updateOne({ _id: delivery!._id }, { $set: { status: 'failed', error: (e as Error).message, updated_at: new Date() } });
    }
  }
  await updateRow(NewsletterCampaign, 'App\\Models\\NewsletterCampaign', before, { status: 'sent', sent_at: new Date() }, who);
  return { success: 'Campaign queued for all subscribers.' };
}
