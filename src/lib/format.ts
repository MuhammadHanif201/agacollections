// Formatting helpers matching the PHP functions the Blade views used.

/** PHP number_format($n, $decimals): thousands with ",", decimal point "." */
export function numberFormat(value: number | string | null | undefined, decimals = 0): string {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  // PHP rounds half away from zero
  const factor = 10 ** decimals;
  const rounded = Math.sign(safe) * Math.round(Math.abs(safe) * factor + Number.EPSILON) / factor;
  const [int, frac] = Math.abs(rounded).toFixed(decimals).split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (rounded < 0 ? '-' : '') + withSep + (decimals > 0 ? '.' + frac : '');
}

/** Two letters from the company name for referral codes and SKUs ("DESIRE CLOTHING" → DC, "AGA Collections" → AC) */
export function brandInitials(name: string | null | undefined): string {
  let letters = '';
  for (const w of String(name ?? 'AGA Collections').trim().split(/\s+/)) {
    const m = w.match(/[A-Za-z]/);
    if (m) { letters += m[0].toUpperCase(); if (letters.length >= 2) break; }
  }
  if (letters === '') return 'ZQ';
  if (letters.length === 1) return letters + 'X';
  return letters;
}

/** SKU code for one word or option value: letters and digits, first 3, upper case ("Small" → SMA, "s’" → S) */
export const skuCode = (v: string) => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();

/** A real profile link (https://www.tiktok.com/@shop), not a bare site placeholder (https://facebook.com) */
export function isProfileUrl(url: string | null | undefined): boolean {
  try {
    const u = new URL(String(url ?? ''));
    return /^https?:$/.test(u.protocol) && u.pathname.replace(/\/+$/, '') !== '';
  } catch {
    return false;
  }
}

/** wa.me link that opens the chat with a first message already typed in */
export const waLink = (number: string) =>
  'https://wa.me/' + number.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hi AGA Collections, I need help with my order.');

export const ucfirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Laravel Str::title(Str::lower($s)) — mb_convert_case(MB_CASE_TITLE): a letter after any non-letter (apostrophes excepted) */
export const strTitle = (s: string) => s.toLowerCase().replace(/(^|[^\p{L}'’])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());

/** Laravel Str::plural for the simple English words used in the views */
export const plural = (word: string, count: number) => (count === 1 ? word : word + 's');

/** Laravel Str::limit */
export function strLimit(s: string, limit = 100, end = '...') {
  return [...s].length <= limit ? s : [...s].slice(0, limit).join('').trimEnd() + end;
}

/** strip_tags() */
export const stripTags = (html: string) => html.replace(/<[^>]*>/g, '');

/** Laravel e(): HTML-escape for strings placed into raw HTML */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Carbon ->format() for the patterns the views use. Dates render in UTC, the
 * Laravel app timezone, so times read exactly as they did before.
 */
export function formatDate(date: Date | string | null | undefined, pattern: string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const h24 = d.getUTCHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const pad = (n: number) => String(n).padStart(2, '0');
  const map: Record<string, string> = {
    d: pad(d.getUTCDate()),
    j: String(d.getUTCDate()),
    M: MONTHS[d.getUTCMonth()],
    F: MONTHS_LONG[d.getUTCMonth()],
    m: pad(d.getUTCMonth() + 1),
    Y: String(d.getUTCFullYear()),
    y: String(d.getUTCFullYear()).slice(-2),
    H: pad(h24),
    h: pad(h12),
    g: String(h12),
    i: pad(d.getUTCMinutes()),
    s: pad(d.getUTCSeconds()),
    A: h24 < 12 ? 'AM' : 'PM',
    a: h24 < 12 ? 'am' : 'pm',
  };
  let out = '';
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\' && i + 1 < pattern.length) { out += pattern[++i]; continue; }
    out += map[ch] ?? ch;
  }
  return out;
}

/** "YYYY-MM-DD HH:mm:ss" wall clock in a time zone (coupon / headline schedules) */
export function wallClock(tz: string, at = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}:${g('second')}`;
}

/** rtrim(rtrim(number_format($n, 2), '0'), '.') — commission rates like "8" or "7.5" */
export const rateLabel = (n: number) => n.toFixed(2).replace(/\.?0+$/, '');
