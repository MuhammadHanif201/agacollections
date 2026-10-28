import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

// URL::signedRoute / hasValidSignature: HMAC-SHA256 of the absolute URL without the
// signature parameter. Links already sent by the Laravel site carry signatures made with
// its APP_KEY; set LEGACY_APP_KEY to keep them working.

function keyBytes(key: string): Buffer {
  return key.startsWith('base64:') ? Buffer.from(key.slice(7), 'base64') : Buffer.from(key);
}

const sign = (url: string, key: string) => createHmac('sha256', keyBytes(key)).update(url).digest('hex');

export function signedUrl(path: string): string {
  const url = env.appUrl + path;
  return `${url}${url.includes('?') ? '&' : '?'}signature=${sign(url, env.appSecret)}`;
}

/** Check ?signature= on a request URL (path + other query parameters, against APP_URL) */
export function hasValidSignature(requestUrl: string): boolean {
  const u = new URL(requestUrl);
  const signature = u.searchParams.get('signature');
  if (!signature) return false;
  const rest = u.search.slice(1).split('&').filter((p) => p && p.split('=')[0] !== 'signature').join('&');
  const original = (env.appUrl + u.pathname + (rest ? '?' + rest : '')).replace(/\?$/, '');
  const expires = u.searchParams.get('expires');
  if (expires && Number(expires) * 1000 < Date.now()) return false;
  const keys = [env.appSecret, process.env.LEGACY_APP_KEY].filter((k): k is string => Boolean(k));
  return keys.some((k) => {
    const a = Buffer.from(sign(original, k));
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
