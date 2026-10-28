import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

let transporter: Transporter | null = null;

/** MAIL_MAILER=log writes emails to the server log instead of sending them (Laravel's log mailer) */
const logMailer = () => process.env.MAIL_MAILER === 'log';

export function mailConfigured(): boolean {
  return logMailer() || Boolean(env.mail.host);
}

function getTransport(): Transporter {
  if (!mailConfigured()) throw new Error('Mail is not configured (MAIL_HOST is empty).');
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.encryption === 'ssl' || env.mail.port === 465,
      requireTLS: env.mail.encryption === 'tls',
      auth: env.mail.username ? { user: env.mail.username, pass: env.mail.password } : undefined,
    });
  }
  return transporter;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: { address: string; name?: string };
}

/** Send an email. Throws on failure; callers decide whether that is fatal (as the PHP did). */
export async function sendMail(msg: MailMessage) {
  if (logMailer()) {
    const body = msg.text ?? msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
    const links = [...new Set([...msg.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')))];
    console.info(`[mail] To: ${msg.to} | Subject: ${msg.subject}\n${body}${links.length ? `\nLinks: ${links.join(' ')}` : ''}`);
    return;
  }
  await getTransport().sendMail({
    from: { address: env.mail.fromAddress, name: env.mail.fromName },
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    replyTo: msg.replyTo ? { address: msg.replyTo.address, name: msg.replyTo.name ?? '' } : undefined,
  });
}
