'use server';

import { contactHtml } from '@/emails/templates';
import { env } from '@/lib/env';
import { sendMail } from '@/lib/mail';
import { throttle } from '@/lib/request';
import { getCompanySetting, primaryEmail } from '@/services/settings';
import { contactSchema, zodErrors } from '@/validators/store';

export interface ContactState {
  status: 'idle' | 'success' | 'error' | 'invalid';
  message?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string>;
  seq: number;
}

/** ClientController::send */
export async function sendContact(prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    message: String(formData.get('message') ?? ''),
  };
  const seq = prev.seq + 1;
  if (!(await throttle('contact', 5))) {
    return { status: 'error', message: 'Too many messages. Please wait a minute and try again.', values, seq };
  }
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { status: 'invalid', errors: zodErrors(parsed.error), values, seq };

  const setting = await getCompanySetting();
  const raw = setting?.emails;
  const support = raw && !Array.isArray(raw) ? raw.support : undefined;
  const to = support || primaryEmail(setting) || env.mail.fromAddress;
  try {
    await sendMail({ to, subject: parsed.data.subject, html: contactHtml(setting?.name ?? '', parsed.data) });
  } catch (e) {
    console.error('Contact form email failed: ' + (e as Error).message);
    return { status: 'error', message: 'Sorry, your message could not be sent right now. Please try again in a few minutes or message us on WhatsApp.', values, seq };
  }
  return { status: 'success', message: 'Your message has been sent successfully.', seq };
}
