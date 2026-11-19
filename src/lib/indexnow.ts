import 'server-only';
import { env } from '@/lib/env';

// IndexNow (Bing, Yandex and others): tells search engines at once when a page is added, changed or removed.
// The key below is published at /<key>.txt (public/), which proves the site is ours.
export const INDEXNOW_KEY = '281064d823793136b7ddfdca9e1104cd';

/** Sends these pages (paths like /product/x, or full URLs) to IndexNow. Never throws, gives up after 3 seconds. */
export async function notifyIndexNow(paths: string[]): Promise<void> {
  const base = env.appUrl.replace(/\/+$/, '');
  if (!/^https:\/\//.test(base) || /localhost|127\.0\.0\.1/.test(base)) return; // only the live site
  const urlList = [...new Set(paths.filter(Boolean).map((p) => (/^https?:\/\//.test(p) ? p : base + (p.startsWith('/') ? p : '/' + p))))];
  if (!urlList.length) return;
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(base).host, key: INDEXNOW_KEY, keyLocation: `${base}/${INDEXNOW_KEY}.txt`, urlList }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // search engines will still find the change through the sitemap
  }
}
