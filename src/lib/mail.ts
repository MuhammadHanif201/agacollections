import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

interface SmtpConfig { host: string; port: number; username: string; password: string; encryption: string }

const transports = new Map<string, Transporter>();

/** MAIL_MAILER=log writes emails to the server log instead of sending them (Laravel's log mailer) */
const logMailer = () => process.env.MAIL_MAILER === 'log';

export function mailConfigured(): boolean {
  return logMailer() || Boolean(env.mail.host) || Boolean(env.mailFallback.host);
}

function transportFor(c: SmtpConfig): Transporter {
  const key = `${c.host}:${c.port}:${c.username}`;
  let t = transports.get(key);
  if (!t) {
    t = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.encryption === 'ssl' || c.port === 465,
      requireTLS: c.encryption === 'tls',
      auth: c.username ? { user: c.username, pass: c.password } : undefined,
    });
    transports.set(key, t);
  }
  return t;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: { address: string; name?: string };
}

/**
 * Send an email. Throws on failure; callers decide whether that is fatal (as the PHP did).
 * The MAIL_* server is tried first; if it refuses or fails (for example Brevo's daily quota
 * is used up) and MAIL_FALLBACK_* is set, the same message goes out through that one.
 */
export async function sendMail(msg: MailMessage) {
  if (logMailer()) {
    const body = msg.text ?? msg.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
    const links = [...new Set([...msg.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')))];
    console.info(`[mail] To: ${msg.to} | Subject: ${msg.subject}\n${body}${links.length ? `\nLinks: ${links.join(' ')}` : ''}`);
    return;
  }
  if (!mailConfigured()) throw new Error('Mail is not configured (MAIL_HOST is empty).');

  const send = (c: SmtpConfig, fromAddress: string) => transportFor(c).sendMail({
    from: { address: fromAddress, name: env.mail.fromName },
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    replyTo: msg.replyTo ? { address: msg.replyTo.address, name: msg.replyTo.name ?? '' } : undefined,
  });

  const fb = env.mailFallback;
  if (!env.mail.host) return send(fb, fb.fromAddress);
  try {
    return await send(env.mail, env.mail.fromAddress);
  } catch (e) {
    if (!fb.host) throw e;
    console.warn(`Mail via ${env.mail.host} failed (${(e as Error).message}); sending via ${fb.host} instead`);
    return send(fb, fb.fromAddress);
  }
}
