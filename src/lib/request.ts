import 'server-only';
import { headers } from 'next/headers';
import { connectDb } from './db';
import { env } from './env';
import { RateLimit } from '@/models/Session';

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-real-ip') ?? '0.0.0.0';
}

/**
 * Fixed-window limiter, like Laravel's throttle:max,minutes. Returns false once the
 * caller has used up `max` hits in the current window.
 */
export async function hit(key: string, max: number, windowSeconds = 60): Promise<boolean> {
  await connectDb();
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds);
  const id = `${key}:${windowStart}`;
  const doc = await RateLimit.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expires_at: new Date((windowStart + 1) * windowSeconds * 1000) } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  return (doc?.count ?? 0) <= max;
}

/** throttle:max,1,name keyed by visitor IP */
export async function throttle(name: string, max: number, windowSeconds = 60): Promise<boolean> {
  return hit(`${name}:${await clientIp()}`, max, windowSeconds);
}

/**
 * JSON endpoints called by the storefront's own scripts must come from this site
 * (Server Actions check this themselves). Stands in for Laravel's CSRF token.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin) {
    // Older browsers omit Origin on same-origin GET/POST; fall back to Referer
    const ref = req.headers.get('referer');
    if (!ref) return false;
    try { return new URL(ref).host === host; } catch { return false; }
  }
  try {
    const o = new URL(origin);
    return o.host === host || o.origin === env.appUrl;
  } catch {
    return false;
  }
}
