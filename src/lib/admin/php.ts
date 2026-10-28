// The PHP / Laravel helpers the admin Blade views call (Carbon, collections, paginators,
// route(), old() …), so the ported views read like the originals and print the same text.
import { AsyncLocalStorage } from 'node:async_hooks';
import { numberFormat, strLimit, strTitle } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { html, phpJson, raw, type Html } from './html';
import { ROUTES } from './routes-table';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Request context (what Blade reaches through request(), old(), session(), auth()) ──
export interface ViewRequest {
  origin: string;
  path: string; // "/admin/orders"
  query: URLSearchParams;
  routeName: string;
  old: Record<string, string>;
  hasOld: boolean;
  errors: Record<string, string[]>;
  flash: Record<string, string | undefined>;
  csrf: string;
  user: any;
  companySetting: any;
  /** @push('scripts') from components, printed before the page's own scripts */
  stack: Html[];
  previous?: string; // url()->previous()
}
const store = new AsyncLocalStorage<ViewRequest>();
export const withView = <T>(ctx: ViewRequest, fn: () => T): T => store.run(ctx, fn);
const ctx = (): ViewRequest => {
  const c = store.getStore();
  if (!c) throw new Error('No admin view context');
  return c;
};

const absolute = (p: string) => ctx().origin + (p.startsWith('/') ? p : '/' + p);

/** route('admin.orders.show', $order) — absolute URL like Laravel's url generator */
export function route(name: string, params?: unknown, absoluteUrl = true): string {
  const uri = ROUTES[name];
  if (uri === undefined) throw new Error(`Route [${name}] not defined.`);
  const rest: [string, string][] = [];
  let path = uri;
  const names = [...uri.matchAll(/\{(\w+)\??\}/g)].map((m) => m[1]);
  const values: Record<string, string> = {};
  const key = (v: any) => String(v && typeof v === 'object' ? (v.getRouteKey?.() ?? v._id ?? v.id) : v);
  if (params !== undefined && params !== null) {
    if (typeof params === 'object' && !Array.isArray(params) && !('_id' in (params as object)) && !('id' in (params as object))) {
      for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
        if (names.includes(k)) values[k] = key(v);
        else if (v !== null && v !== undefined) rest.push([k, key(v)]);
      }
    } else {
      const arr = Array.isArray(params) ? params : [params];
      names.forEach((n, i) => { if (arr[i] !== undefined) values[n] = key(arr[i]); });
    }
  }
  path = path.replace(/\{(\w+)\??\}/g, (_, n: string) => (values[n] !== undefined ? encodeURIComponent(values[n]).replace(/%40/g, '@') : '')).replace(/\/+$/, '');
  const qs = rest.length ? '?' + rest.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
  const rel = '/' + path + qs;
  return absoluteUrl ? (rel === '/' ? ctx().origin : absolute(rel)) : rel;
}

/** asset(): root-relative like the old app (config app.asset_url = '/'); uploads come from the media store */
export const asset = (p: string) => {
  if (p.startsWith('storage/')) return p.length > 8 ? mediaUrl(p.slice(8)) : mediaUrl('x').replace(/\/x$/, ''); // asset('storage/') → the bare base
  return '/' + p.replace(/^\/+/, '').replace(/\/+$/, '');
};
const absoluteMedia = (p: string) => { const m = asset(p); return /^https?:/.test(m) ? m : absolute(m); };
/** url('path') → absolute URL; url() → the generator (current(), previous(), full()) */
export function url(): { current: () => string; full: () => string; previous: () => string; to: (p: string) => string };
export function url(p: string): string;
export function url(p?: string): any {
  if (p === undefined) {
    const c = ctx();
    return {
      current: () => absolute(c.path),
      full: () => absolute(c.path) + (c.query.toString() ? '?' + c.query.toString() : ''),
      previous: () => c.previous ?? ctx().origin,
      to: (x: string) => absolute(x),
    };
  }
  if (/^https?:\/\//i.test(p)) return p;
  // UrlGenerator::to() trims slashes around the path
  const path = p.replace(/^\/+|\/+$/g, '');
  return path.startsWith('storage/') ? absoluteMedia(path) : path ? absolute(path) : ctx().origin;
}
export const config = (key: string, fallback: any = null) => (key === 'app.url' ? ctx().origin : key === 'app.name' ? 'AGA Collections' : fallback);

export const old = (key: string, fallback: any = null): any => {
  const c = ctx();
  const k = key.replace(/\[(\w*)\]/g, '.$1');
  if (k in c.old) return c.old[k];
  // name[] inputs come back as a list
  const prefix = k + '.';
  const keys = Object.keys(c.old).filter((x) => x.startsWith(prefix));
  if (!keys.length) return fallback;
  const out: Record<string, any> = {};
  for (const x of keys) out[x.slice(prefix.length)] = c.old[x];
  return Object.keys(out).every((x) => /^\d+$/.test(x)) ? Object.values(out) : out;
};

/** request(): the request helper; request('key') reads a query value */
export function request(): any;
export function request(key: string, fallback?: any): any;
export function request(key?: string, fallback: any = null): any {
  const c = ctx();
  if (key !== undefined) return c.query.get(key) ?? fallback;
  return {
    all: () => Object.fromEntries(c.query),
    except: (...keys: any[]) => Object.fromEntries([...c.query].filter(([k]) => !keys.flat().includes(k))),
    only: (...keys: any[]) => Object.fromEntries([...c.query].filter(([k]) => keys.flat().includes(k))),
    hasAny: (...keys: any[]) => keys.flat().some((k: string) => c.query.has(k)),
    routeIs: (...patterns: string[]) => patterns.some((p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(c.routeName)),
    is: (...patterns: string[]) => patterns.some((p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(c.path.replace(/^\//, ''))),
    query: (k?: string, d: any = null) => (k === undefined ? Object.fromEntries(c.query) : c.query.get(k) ?? d),
    get: (k: string, d: any = null) => c.query.get(k) ?? d,
    input: (k: string, d: any = null) => c.query.get(k) ?? d,
    has: (k: string) => c.query.has(k),
    filled: (k: string) => (c.query.get(k) ?? '').trim() !== '',
    fullUrl: () => absolute(c.path) + (c.query.toString() ? '?' + c.query.toString() : ''),
    url: () => absolute(c.path),
    path: () => c.path.replace(/^\//, '') || '/',
  };
};

export const session = (key: string, fallback: any = null) => ctx().flash[key] ?? fallback;
export const csrf_token = () => ctx().csrf;
export const csrf_field = () => raw(`<input type="hidden" name="_token" value="${ctx().csrf}" autocomplete="off">`);
export const method_field = (m: string) => raw(`<input type="hidden" name="_method" value="${m}">`);
export const auth = (): any => ({ user: () => ctx().user, id: () => ctx().user?._id ?? null, check: () => !!ctx().user, guard: () => auth() });
export const Auth = { user: () => ctx().user, id: () => ctx().user?._id ?? null, check: () => !!ctx().user };
export const companySetting = () => ctx().companySetting;

/** The $errors bag */
export const errors = () => {
  const e = ctx().errors;
  return {
    any: () => Object.keys(e).length > 0,
    has: (k: string) => !!e[k]?.length,
    first: (k: string) => e[k]?.[0] ?? '',
    get: (k: string) => e[k] ?? [],
    all: () => Object.values(e).flat(),
    count: () => Object.values(e).flat().length,
    keys: () => Object.keys(e),
  };
};

// ── Carbon ────────────────────────────────────────────────────────────────
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TZ_OFFSETS: Record<string, number> = { UTC: 0, 'Asia/Karachi': 5 * 60 };

export class Carbon {
  /** wall-clock time as if it were UTC, plus the zone it belongs to */
  constructor(readonly t: number, readonly tz = 'UTC') {}
  static now() { return new Carbon(Date.now()); }
  static today() { return Carbon.now().startOfDay(); }
  static parse(v: any) {
    if (v instanceof Carbon) return v;
    if (v instanceof Date) return new Carbon(v.getTime());
    if (v === null || v === undefined || v === '') return Carbon.now();
    const s = String(v).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/);
    if (m) {
      let t = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
      if (m[7] && m[7] !== 'Z') { const sign = m[7][0] === '-' ? -1 : 1; const [hh, mm] = m[7].slice(1).replace(':', '').match(/\d{2}/g)!; t -= sign * (+hh * 60 + +mm) * 60000; }
      return new Carbon(t);
    }
    if (s === 'today') return Carbon.today();
    const d = Date.parse(s);
    return new Carbon(Number.isNaN(d) ? Date.now() : d);
  }
  private get d() { return new Date(this.t + (TZ_OFFSETS[this.tz] ?? 0) * 60000); }
  timezone(tz: string) { return new Carbon(this.t, tz); }
  timeZone(tz: string) { return this.timezone(tz); }
  setTimezone(tz: string) { return this.timezone(tz); }
  copy() { return new Carbon(this.t, this.tz); }
  format(p: string): string {
    const d = this.d;
    const pad = (n: number, l = 2) => String(n).padStart(l, '0');
    const h = d.getUTCHours();
    const off = TZ_OFFSETS[this.tz] ?? 0;
    const map: Record<string, () => string> = {
      d: () => pad(d.getUTCDate()), j: () => String(d.getUTCDate()), D: () => DAYS[d.getUTCDay()].slice(0, 3), l: () => DAYS[d.getUTCDay()],
      N: () => String(d.getUTCDay() || 7), w: () => String(d.getUTCDay()),
      S: () => { const n = d.getUTCDate(); return n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'; },
      F: () => MONTHS[d.getUTCMonth()], M: () => MONTHS[d.getUTCMonth()].slice(0, 3), m: () => pad(d.getUTCMonth() + 1), n: () => String(d.getUTCMonth() + 1),
      Y: () => String(d.getUTCFullYear()), y: () => String(d.getUTCFullYear()).slice(-2),
      a: () => (h < 12 ? 'am' : 'pm'), A: () => (h < 12 ? 'AM' : 'PM'),
      g: () => String(h % 12 || 12), G: () => String(h), h: () => pad(h % 12 || 12), H: () => pad(h),
      i: () => pad(d.getUTCMinutes()), s: () => pad(d.getUTCSeconds()), v: () => pad(d.getUTCMilliseconds(), 3), u: () => pad(d.getUTCMilliseconds() * 1000, 6),
      e: () => this.tz, T: () => (this.tz === 'UTC' ? 'UTC' : 'PKT'), P: () => `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`,
      O: () => `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}${pad(Math.abs(off) % 60)}`,
      U: () => String(Math.floor(this.t / 1000)), t: () => String(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()),
    };
    let out = '';
    for (let i = 0; i < p.length; i++) {
      const ch = p[i];
      if (ch === '\\' && i + 1 < p.length) { out += p[++i]; continue; }
      out += map[ch] ? map[ch]() : ch;
    }
    return out;
  }
  translatedFormat(p: string) { return this.format(p); }
  isoFormat(p: string) {
    return p.replace(/MMMM|MMM|MM|DD|D|YYYY|HH|hh|mm|A|h/g, (t) => ({ MMMM: 'F', MMM: 'M', MM: 'm', DD: 'd', D: 'j', YYYY: 'Y', HH: 'H', hh: 'h', mm: 'i', A: 'A', h: 'g' } as Record<string, string>)[t]).split('').map((c) => (/[FMmdjYHhiAg]/.test(c) ? this.format(c) : c)).join('');
  }
  toDateString() { return this.format('Y-m-d'); }
  toDateTimeString() { return this.format('Y-m-d H:i:s'); }
  toDayDateTimeString() { return this.format('D, M j, Y g:i A'); }
  toFormattedDateString() { return this.format('M j, Y'); }
  toIso8601String() { return this.format('Y-m-d\\TH:i:sP'); }
  toISOString() { return new Date(this.t).toISOString(); }
  toJSON() { return new Date(this.t).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z'); }
  toString() { return this.toDateTimeString(); }
  valueOf() { return this.t; }
  get timestamp() { return Math.floor(this.t / 1000); }
  getTimestamp() { return this.timestamp; }
  get year() { return this.d.getUTCFullYear(); }
  get month() { return this.d.getUTCMonth() + 1; }
  get day() { return this.d.getUTCDate(); }
  get hour() { return this.d.getUTCHours(); }
  get minute() { return this.d.getUTCMinutes(); }
  startOfDay() { const d = this.d; return new Carbon(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - (TZ_OFFSETS[this.tz] ?? 0) * 60000, this.tz); }
  endOfDay() { return new Carbon(this.startOfDay().t + 86400000 - 1, this.tz); }
  startOfMonth() { const d = this.d; return new Carbon(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - (TZ_OFFSETS[this.tz] ?? 0) * 60000, this.tz); }
  addDays(n = 1) { return new Carbon(this.t + n * 86400000, this.tz); }
  subDays(n = 1) { return this.addDays(-n); }
  addDay() { return this.addDays(1); }
  subDay() { return this.addDays(-1); }
  addHours(n = 1) { return new Carbon(this.t + n * 3600000, this.tz); }
  addMinutes(n = 1) { return new Carbon(this.t + n * 60000, this.tz); }
  subMonths(n = 1) { const d = this.d; d.setUTCMonth(d.getUTCMonth() - n); return new Carbon(d.getTime() - (TZ_OFFSETS[this.tz] ?? 0) * 60000, this.tz); }
  isPast() { return this.t < Date.now(); }
  isFuture() { return this.t > Date.now(); }
  isToday() { return Carbon.now().timezone(this.tz).toDateString() === this.toDateString(); }
  gt(o: any) { return this.t > Carbon.parse(o).t; }
  lt(o: any) { return this.t < Carbon.parse(o).t; }
  gte(o: any) { return this.t >= Carbon.parse(o).t; }
  lte(o: any) { return this.t <= Carbon.parse(o).t; }
  greaterThan(o: any) { return this.gt(o); }
  lessThan(o: any) { return this.lt(o); }
  eq(o: any) { return this.t === Carbon.parse(o).t; }
  diffInDays(o?: any, absolute = true) { const v = ((o ? Carbon.parse(o).t : Date.now()) - this.t) / 86400000; return absolute ? Math.floor(Math.abs(v)) : Math.trunc(v); }
  diffInHours(o?: any) { return Math.floor(Math.abs((o ? Carbon.parse(o).t : Date.now()) - this.t) / 3600000); }
  diffInMinutes(o?: any) { return Math.floor(Math.abs((o ? Carbon.parse(o).t : Date.now()) - this.t) / 60000); }
  diffInSeconds(o?: any) { return Math.floor(Math.abs((o ? Carbon.parse(o).t : Date.now()) - this.t) / 1000); }
  /** Carbon 2 diffForHumans() against now: "3 hours ago", "1 week ago", "2 days from now" */
  diffForHumans(): string {
    const now = Date.now();
    const future = this.t > now;
    const [a, b] = future ? [new Date(now), new Date(this.t)] : [new Date(this.t), new Date(now)];
    let years = b.getUTCFullYear() - a.getUTCFullYear();
    let months = b.getUTCMonth() - a.getUTCMonth();
    let days = b.getUTCDate() - a.getUTCDate();
    let ms = (b.getUTCHours() * 3600 + b.getUTCMinutes() * 60 + b.getUTCSeconds()) * 1000 + b.getUTCMilliseconds()
      - ((a.getUTCHours() * 3600 + a.getUTCMinutes() * 60 + a.getUTCSeconds()) * 1000 + a.getUTCMilliseconds());
    if (ms < 0) { ms += 86400000; days--; }
    if (days < 0) { days += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate(); months--; }
    if (months < 0) { months += 12; years--; }
    const hours = Math.floor(ms / 3600000), minutes = Math.floor((ms % 3600000) / 60000), seconds = Math.floor((ms % 60000) / 1000);
    const weeks = Math.floor(days / 7);
    const parts: [number, string][] = [[years, 'year'], [months, 'month'], [weeks, 'week'], [days, 'day'], [hours, 'hour'], [minutes, 'minute'], [seconds, 'second']];
    const [n, unit] = parts.find(([v]) => v > 0) ?? [1, 'second'];
    return `${n} ${unit}${n === 1 ? '' : 's'} ${future ? 'from now' : 'ago'}`;
  }
}

export const now = () => Carbon.now();
export const today = () => Carbon.today();
export const date = (p: string, ts?: number) => (ts !== undefined ? new Carbon(ts * 1000) : Carbon.now()).format(p);

/** Turn every Date in a lean document into a Carbon (Eloquent date casts) */
export function carbonize<T>(v: T): any {
  if (v instanceof Date) return new Carbon(v.getTime());
  if (Array.isArray(v)) return Collection.from(v.map(carbonize));
  if (v && typeof v === 'object' && !(v instanceof Carbon) && !(v instanceof Collection) && Object.getPrototypeOf(v) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = carbonize(x);
    if ('_id' in out && !('id' in out)) out.id = out._id;
    return out;
  }
  return v;
}

// ── Collections ───────────────────────────────────────────────────────────
const getField = (item: any, key: string) => key.split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), item);
const norm = (v: any) => (typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
const looseEq = (a: any, b: any) => (a === null || a === undefined ? b === null || b === undefined : b === null || b === undefined ? false : norm(a) === norm(b));

export class Collection<T = any> extends Array<T> {
  static from<T>(items: Iterable<T> | ArrayLike<T> | null | undefined): Collection<T> {
    const c = new Collection<T>();
    if (items) for (const it of Array.from(items as Iterable<T>)) c.push(it);
    return c;
  }
  count() { return this.length; }
  isEmpty() { return this.length === 0; }
  isNotEmpty() { return this.length > 0; }
  all() { return [...this]; }
  toArray() { return [...this]; }
  // @ts-expect-error -- Laravel collection method, not Array.prototype.values
  values() { return Collection.from(this); }
  // @ts-expect-error -- Laravel collection method, not Array.prototype.keys
  keys() { return Collection.from(this.map((_, i) => i)); }
  first(fn?: (x: T) => any): T | null {
    if (!fn) return this.length ? this[0] : null;
    return this.find((x) => fn(x)) ?? null;
  }
  last(): T | null { return this.length ? this[this.length - 1] : null; }
  take(n: number) { return Collection.from(n >= 0 ? this.slice(0, n) : this.slice(n)); }
  pluck(key: string) { return Collection.from(this.map((x) => getField(x, key))); }
  sum(key?: string | ((x: T) => number)) {
    return this.reduce((s, x) => s + Number((typeof key === 'function' ? key(x) : key ? getField(x, key) : x) ?? 0), 0);
  }
  avg(key?: string) { return this.length ? this.sum(key) / this.length : null; }
  max(key?: string) { const v = this.map((x) => Number(key ? getField(x, key) : x)); return v.length ? Math.max(...v) : null; }
  min(key?: string) { const v = this.map((x) => Number(key ? getField(x, key) : x)); return v.length ? Math.min(...v) : null; }
  where(key: string, op: any, value?: any) {
    if (arguments.length === 2) { value = op; op = '='; }
    return Collection.from(this.filter((x) => {
      const v = getField(x, key);
      switch (op) {
        case '!=': case '<>': return !looseEq(v, value);
        case '>': return v > value;
        case '<': return v < value;
        case '>=': return v >= value;
        case '<=': return v <= value;
        default: return looseEq(v, value);
      }
    }));
  }
  whereNotNull(key: string) { return Collection.from(this.filter((x) => getField(x, key) !== null && getField(x, key) !== undefined)); }
  whereNull(key: string) { return Collection.from(this.filter((x) => getField(x, key) === null || getField(x, key) === undefined)); }
  whereIn(key: string, values: any[]) { return Collection.from(this.filter((x) => values.some((v) => looseEq(getField(x, key), v)))); }
  contains(key: any, value?: any) {
    if (typeof key === 'function') return this.some((x) => key(x));
    if (arguments.length === 2) return this.some((x) => looseEq(getField(x, key), value));
    return this.some((x) => looseEq(x, key));
  }
  implode(a: string, b?: string) {
    if (b !== undefined) return this.map((x) => getField(x, a)).join(b);
    return this.join(a);
  }
  sortBy(key: string | ((x: T) => any)) {
    const f = typeof key === 'function' ? key : (x: T) => getField(x, key);
    return Collection.from([...this].sort((a, b) => { const x = f(a), y = f(b); return x < y ? -1 : x > y ? 1 : 0; }));
  }
  sortByDesc(key: string | ((x: T) => any)) { return Collection.from([...this.sortBy(key)].reverse()); }
  unique(key?: string) {
    const seen = new Set<string>();
    return Collection.from(this.filter((x) => { const k = String(key ? getField(x, key) : x); if (seen.has(k)) return false; seen.add(k); return true; }));
  }
  groupBy(key: string | ((x: T) => any)) {
    const f = typeof key === 'function' ? key : (x: T) => getField(x, key);
    const out: Record<string, Collection<T>> = {};
    for (const x of this) (out[String(f(x))] ??= new Collection<T>()).push(x);
    return out;
  }
  keyBy(key: string) { return Object.fromEntries(this.map((x) => [String(getField(x, key)), x])); }
  flatten() { return Collection.from(this.flat(Infinity) as T[]); }
  // @ts-expect-error -- Laravel collection method, not Array.prototype.filter
  filter(fn?: (x: T, i: number, a: T[]) => any): Collection<T> {
    return Collection.from(Array.prototype.filter.call(this, fn ?? ((x: T) => !!x)) as T[]);
  }
  // @ts-expect-error -- Laravel collection method, not Array.prototype.map
  map<U>(fn: (x: T, i: number, a: T[]) => U): Collection<U> {
    return Collection.from(Array.prototype.map.call(this, fn) as U[]);
  }
  each(fn: (x: T, i: number) => void) { this.forEach(fn); return this; }
}
export const collect = <T>(items?: Iterable<T> | ArrayLike<T> | null) => Collection.from(items ?? []);

// ── Paginator (LengthAwarePaginator + the bootstrap-4/5 and tailwind link views) ──
export class Paginator<T = any> extends Collection<T> {
  meta = { total: 0, perPage: 15, currentPage: 1, path: '', query: {} as Record<string, string>, onEachSide: 3, pageName: 'page', withQuery: false };
  static make<T>(items: T[], total: number, perPage: number, currentPage: number, pageName = 'page') {
    const p = new Paginator<T>();
    for (const it of items) p.push(it);
    p.meta = { total, perPage, currentPage, path: '', query: {}, onEachSide: 3, pageName, withQuery: false };
    return p;
  }
  total() { return this.meta.total; }
  perPage() { return this.meta.perPage; }
  currentPage() { return this.meta.currentPage; }
  lastPage() { return Math.max(Math.ceil(this.meta.total / this.meta.perPage), 1); }
  hasPages() { return this.currentPage() !== 1 || this.hasMorePages(); }
  hasMorePages() { return this.currentPage() < this.lastPage(); }
  onFirstPage() { return this.currentPage() <= 1; }
  onLastPage() { return !this.hasMorePages(); }
  firstItem() { return this.length ? (this.currentPage() - 1) * this.perPage() + 1 : null; }
  lastItem() { return this.length ? (this.firstItem() as number) + this.length - 1 : null; }
  withQueryString() { this.meta.withQuery = true; return this; }
  appends(q: Record<string, any>) { for (const [k, v] of Object.entries(q)) if (v !== null && v !== undefined) this.meta.query[k] = String(v); return this; }
  onEachSide(n: number) { this.meta.onEachSide = n; return this; }
  url(page: number) {
    // the request is read when the links are drawn (the view has it)
    const current = this.meta.withQuery ? Object.fromEntries([...ctx().query].filter(([k]) => k !== this.meta.pageName)) : {};
    const q = new URLSearchParams({ ...current, ...this.meta.query, [this.meta.pageName]: String(Math.max(page, 1)) });
    const path = this.meta.path || request().url();
    return path + (path.includes('?') ? '&' : '?') + q.toString().replace(/%5B/g, '[').replace(/%5D/g, ']');
  }
  previousPageUrl() { return this.currentPage() > 1 ? this.url(this.currentPage() - 1) : null; }
  nextPageUrl() { return this.hasMorePages() ? this.url(this.currentPage() + 1) : null; }
  private range(a: number, b: number) { const out: [number, string][] = []; for (let i = a; i <= b; i++) out.push([i, this.url(i)]); return out; }
  /** UrlWindow: page links with "..." gaps */
  elements(): ([number, string][] | string)[] {
    const side = this.meta.onEachSide, last = this.lastPage(), cur = this.currentPage();
    let first: [number, string][] | null = null, slider: [number, string][] | null = null, end: [number, string][] | null = null;
    if (last < side * 2 + 8) first = this.range(1, last);
    else {
      const win = side + 4;
      if (!this.hasPages()) { /* nothing */ }
      else if (cur <= win) { first = this.range(1, win + side); end = this.range(last - 1, last); }
      else if (cur > last - win) { first = this.range(1, 2); end = this.range(last - (win + (side - 1)), last); }
      else { first = this.range(1, 2); slider = this.range(cur - side, cur + side); end = this.range(last - 1, last); }
    }
    return [first, slider ? '...' : null, slider, end ? '...' : null, end].filter((x): x is [number, string][] | string => x !== null);
  }
  links(view = 'tailwind'): Html {
    if (!this.hasPages()) return html``;
    const els = this.elements();
    if (view === 'pagination::bootstrap-5') return bootstrap5(this, els);
    if (view === 'pagination::bootstrap-4') return bootstrap4(this, els);
    return tailwind(this, els);
  }
}

type Els = ([number, string][] | string)[];

function pageItems(p: Paginator, els: Els) {
  return els.map((el) => typeof el === 'string'
    ? html`<li class="page-item disabled" aria-disabled="true"><span class="page-link">${el}</span></li>\n`
    : el.map(([page, u]) => page === p.currentPage()
      ? html`<li class="page-item active" aria-current="page"><span class="page-link">${page}</span></li>\n`
      : html`<li class="page-item"><a class="page-link" href="${u}">${page}</a></li>\n`));
}

function bootstrap4(p: Paginator, els: Els) {
  return html`<nav>
        <ul class="pagination">
            ${p.onFirstPage()
    ? html`<li class="page-item disabled" aria-disabled="true" aria-label="&laquo; Previous">
                    <span class="page-link" aria-hidden="true">&lsaquo;</span>
                </li>`
    : html`<li class="page-item">
                    <a class="page-link" href="${p.previousPageUrl()}" rel="prev" aria-label="&laquo; Previous">&lsaquo;</a>
                </li>`}
            ${pageItems(p, els)}
            ${p.hasMorePages()
    ? html`<li class="page-item">
                    <a class="page-link" href="${p.nextPageUrl()}" rel="next" aria-label="Next &raquo;">&rsaquo;</a>
                </li>`
    : html`<li class="page-item disabled" aria-disabled="true" aria-label="Next &raquo;">
                    <span class="page-link" aria-hidden="true">&rsaquo;</span>
                </li>`}
        </ul>
    </nav>
`;
}

function bootstrap5(p: Paginator, els: Els) {
  return html`<nav class="d-flex justify-items-center justify-content-between">
        <div class="d-flex justify-content-between flex-fill d-sm-none">
            <ul class="pagination">
                ${p.onFirstPage()
    ? html`<li class="page-item disabled" aria-disabled="true">
                        <span class="page-link">&laquo; Previous</span>
                    </li>`
    : html`<li class="page-item">
                        <a class="page-link" href="${p.previousPageUrl()}" rel="prev">&laquo; Previous</a>
                    </li>`}
                ${p.hasMorePages()
    ? html`<li class="page-item">
                        <a class="page-link" href="${p.nextPageUrl()}" rel="next">Next &raquo;</a>
                    </li>`
    : html`<li class="page-item disabled" aria-disabled="true">
                        <span class="page-link">Next &raquo;</span>
                    </li>`}
            </ul>
        </div>

        <div class="d-none flex-sm-fill d-sm-flex align-items-sm-center justify-content-sm-between">
            <div>
                <p class="small text-muted">
                    Showing
                    <span class="fw-semibold">${p.firstItem()}</span>
                    to
                    <span class="fw-semibold">${p.lastItem()}</span>
                    of
                    <span class="fw-semibold">${p.total()}</span>
                    results
                </p>
            </div>

            <div>
                <ul class="pagination">
                    ${p.onFirstPage()
    ? html`<li class="page-item disabled" aria-disabled="true" aria-label="&laquo; Previous">
                            <span class="page-link" aria-hidden="true">&lsaquo;</span>
                        </li>`
    : html`<li class="page-item">
                            <a class="page-link" href="${p.previousPageUrl()}" rel="prev" aria-label="&laquo; Previous">&lsaquo;</a>
                        </li>`}
                    ${pageItems(p, els)}
                    ${p.hasMorePages()
    ? html`<li class="page-item">
                            <a class="page-link" href="${p.nextPageUrl()}" rel="next" aria-label="Next &raquo;">&rsaquo;</a>
                        </li>`
    : html`<li class="page-item disabled" aria-disabled="true" aria-label="Next &raquo;">
                            <span class="page-link" aria-hidden="true">&rsaquo;</span>
                        </li>`}
                </ul>
            </div>
        </div>
    </nav>
`;
}

const TW = {
  btn: 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 leading-5 rounded-md hover:text-gray-500 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:focus:border-blue-700 dark:active:bg-gray-700 dark:active:text-gray-300',
  off: 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 cursor-default leading-5 rounded-md dark:text-gray-600 dark:bg-gray-800 dark:border-gray-600',
  prevIcon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">\n                                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />\n                                </svg>',
  nextIcon: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">\n                                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />\n                                </svg>',
};

function tailwind(p: Paginator, els: Els) {
  const prevIcon = raw(TW.prevIcon), nextIcon = raw(TW.nextIcon);
  return html`<nav role="navigation" aria-label="Pagination Navigation" class="flex items-center justify-between">
        <div class="flex justify-between flex-1 sm:hidden">
            ${p.onFirstPage()
    ? html`<span class="${TW.off}">
                    &laquo; Previous
                </span>`
    : html`<a href="${p.previousPageUrl()}" class="${TW.btn}">
                    &laquo; Previous
                </a>`}

            ${p.hasMorePages()
    ? html`<a href="${p.nextPageUrl()}" class="${TW.btn.replace('px-4 py-2 text-sm', 'px-4 py-2 ml-3 text-sm')}">
                    Next &raquo;
                </a>`
    : html`<span class="${TW.off.replace('px-4 py-2 text-sm', 'px-4 py-2 ml-3 text-sm')}">
                    Next &raquo;
                </span>`}
        </div>

        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
                <p class="text-sm text-gray-700 leading-5 dark:text-gray-400">
                    Showing
                    ${p.firstItem()
    ? html`<span class="font-medium">${p.firstItem()}</span>
                        to
                        <span class="font-medium">${p.lastItem()}</span>`
    : html`${p.count()}`}
                    of
                    <span class="font-medium">${p.total()}</span>
                    results
                </p>
            </div>

            <div>
                <span class="relative z-0 inline-flex rtl:flex-row-reverse shadow-sm rounded-md">
                    ${p.onFirstPage()
    ? html`<span aria-disabled="true" aria-label="&laquo; Previous">
                            <span class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 cursor-default rounded-l-md leading-5 dark:bg-gray-800 dark:border-gray-600" aria-hidden="true">
                                ${prevIcon}
                            </span>
                        </span>`
    : html`<a href="${p.previousPageUrl()}" rel="prev" class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md leading-5 hover:text-gray-400 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150 dark:bg-gray-800 dark:border-gray-600 dark:active:bg-gray-700 dark:focus:border-blue-800" aria-label="&laquo; Previous">
                            ${prevIcon}
                        </a>`}

                    ${els.map((el) => typeof el === 'string'
    ? html`<span aria-disabled="true">
                                <span class="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-gray-700 bg-white border border-gray-300 cursor-default leading-5 dark:bg-gray-800 dark:border-gray-600">${el}</span>
                            </span>`
    : el.map(([page, u]) => page === p.currentPage()
      ? html`<span aria-current="page">
                                        <span class="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-gray-500 bg-white border border-gray-300 cursor-default leading-5 dark:bg-gray-800 dark:border-gray-600">${page}</span>
                                    </span>`
      : html`<a href="${u}" class="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-gray-700 bg-white border border-gray-300 leading-5 hover:text-gray-500 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:text-gray-300 dark:active:bg-gray-700 dark:focus:border-blue-800" aria-label="Go to page ${page}">
                                        ${page}
                                    </a>`))}

                    ${p.hasMorePages()
    ? html`<a href="${p.nextPageUrl()}" rel="next" class="relative inline-flex items-center px-2 py-2 -ml-px text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md leading-5 hover:text-gray-400 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150 dark:bg-gray-800 dark:border-gray-600 dark:active:bg-gray-700 dark:focus:border-blue-800" aria-label="Next &raquo;">
                            ${nextIcon}
                        </a>`
    : html`<span aria-disabled="true" aria-label="Next &raquo;">
                            <span class="relative inline-flex items-center px-2 py-2 -ml-px text-sm font-medium text-gray-500 bg-white border border-gray-300 cursor-default rounded-r-md leading-5 dark:bg-gray-800 dark:border-gray-600" aria-hidden="true">
                                ${nextIcon}
                            </span>
                        </span>`}
                </span>
            </div>
        </div>
    </nav>
`;
}

const LANG: Record<string, string> = {
  'pagination.previous': '&laquo; Previous',
  'pagination.next': 'Next &raquo;',
};
/** __() / trans() with the default English lines */
export const __ = (key: string, replace: Record<string, any> = {}) => {
  let s = LANG[key] ?? key;
  for (const [k, v] of Object.entries(replace)) s = s.replace(new RegExp(':' + k + '\\b', 'g'), String(v));
  return s;
};

// ── PHP functions ────────────────────────────────────────────────────────
export const number_format = (n: any, decimals = 0, dec = '.', sep = ',') => {
  const s = numberFormat(Number(n ?? 0), decimals);
  return dec === '.' && sep === ',' ? s : s.replace(/[,.]/g, (c) => (c === ',' ? sep : dec));
};
export const count = (v: any) => (v === null || v === undefined ? 0 : Array.isArray(v) ? v.length : typeof v === 'object' ? Object.keys(v).length : 1);
export const empty = (v: any) => v === null || v === undefined || v === false || v === 0 || v === '' || v === '0' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !(v instanceof Carbon) && Object.keys(v).length === 0);
export const isset = (...v: any[]) => v.every((x) => x !== null && x !== undefined);
export const is_null = (v: any) => v === null || v === undefined;
export const is_array = (v: any) => Array.isArray(v) || (!!v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype);
export const is_string = (v: any) => typeof v === 'string';
export const is_numeric = (v: any) => (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && /^\s*[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?\s*$/i.test(v));
export const strtoupper = (s: any) => String(s ?? '').toUpperCase();
export const strtolower = (s: any) => String(s ?? '').toLowerCase();
export const ucfirst = (s: any) => { const t = String(s ?? ''); return t.charAt(0).toUpperCase() + t.slice(1); };
export const lcfirst = (s: any) => { const t = String(s ?? ''); return t.charAt(0).toLowerCase() + t.slice(1); };
export const ucwords = (s: any, delims = ' \t\r\n\f\v') => String(s ?? '').replace(new RegExp(`(^|[${delims.replace(/[\]\\^-]/g, '\\$&')}])([a-z])`, 'g'), (_, a: string, b: string) => a + b.toUpperCase());
export const trim = (s: any, chars?: string) => {
  const t = String(s ?? '');
  if (!chars) return t.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');
  const c = chars.replace(/[\]\\^-]/g, '\\$&');
  return t.replace(new RegExp(`^[${c}]+|[${c}]+$`, 'g'), '');
};
export const rtrim = (s: any, chars = ' \t\n\r\0\x0B') => String(s ?? '').replace(new RegExp(`[${chars.replace(/[\]\\^-]/g, '\\$&')}]+$`), '');
export const ltrim = (s: any, chars = ' \t\n\r\0\x0B') => String(s ?? '').replace(new RegExp(`^[${chars.replace(/[\]\\^-]/g, '\\$&')}]+`), '');
export const str_replace = (search: any, rep: any, subject: any) => {
  const ss = Array.isArray(search) ? search : [search];
  let out = String(subject ?? '');
  ss.forEach((s, i) => { out = out.split(String(s)).join(String(Array.isArray(rep) ? rep[i] ?? '' : rep)); });
  return out;
};
export const substr = (s: any, start: number, len?: number) => {
  const t = String(s ?? '');
  const st = start < 0 ? Math.max(t.length + start, 0) : start;
  if (len === undefined || len === null) return t.slice(st);
  return len < 0 ? t.slice(st, t.length + len) : t.slice(st, st + len);
};
export const mb_substr = substr;
export const strlen = (s: any) => Buffer.byteLength(String(s ?? ''));
export const mb_strlen = (s: any) => [...String(s ?? '')].length;
export const strrpos = (s: any, needle: string): number | false => { const i = String(s ?? '').lastIndexOf(needle); return i < 0 ? false : i; };
export const strpos = (s: any, needle: string): number | false => { const i = String(s ?? '').indexOf(needle); return i < 0 ? false : i; };
export const str_contains = (s: any, n: string) => String(s ?? '').includes(n);
export const str_starts_with = (s: any, n: string) => String(s ?? '').startsWith(n);
export const str_pad = (s: any, len: number, pad = ' ', type: 'right' | 'left' = 'right') => (type === 'left' ? String(s).padStart(len, pad) : String(s).padEnd(len, pad));
export const STR_PAD_LEFT = 'left';
export const str_repeat = (s: string, n: number) => s.repeat(Math.max(n, 0));
export const implode = (glue: any, arr?: any) => (arr === undefined ? Object.values(glue ?? {}).join('') : Object.values(arr ?? {}).join(glue));
export const explode = (d: string, s: any) => Collection.from(String(s ?? '').split(d));
export const in_array = (v: any, arr: any, strict = false) => Object.values(arr ?? {}).some((x) => (strict ? x === v : looseEq(x, v)));
export const array_keys = (a: any) => (Array.isArray(a) ? a.map((_, i) => i) : Object.keys(a ?? {}));
export const array_values = (a: any) => Object.values(a ?? {});
export const array_sum = (a: any) => Object.values(a ?? {}).reduce((s: number, x) => s + Number(x ?? 0), 0);
export const array_filter = (a: any, fn?: (x: any) => any) => (Array.isArray(a) ? a.filter(fn ?? ((x) => !empty(x))) : Object.fromEntries(Object.entries(a ?? {}).filter(([, x]) => (fn ? fn(x) : !empty(x)))));
export const array_map = (fn: (x: any) => any, a: any) => (Array.isArray(a) ? a.map(fn) : Object.fromEntries(Object.entries(a ?? {}).map(([k, x]) => [k, fn(x)])));
export const array_slice = (a: any[], s: number, l?: number) => a.slice(s, l === undefined ? undefined : s + l);
export const array_merge = (...a: any[]) => (a.every(Array.isArray) ? a.flat() : Object.assign({}, ...a));
export const array_unique = (a: any[]) => [...new Set(a)];
export const round = (n: any, p = 0) => { const f = 10 ** p; const v = Number(n ?? 0); return Math.sign(v) * Math.round(Math.abs(v) * f + Number.EPSILON) / f; };
export const floor = (n: any) => Math.floor(Number(n ?? 0));
export const ceil = (n: any) => Math.ceil(Number(n ?? 0));
export const abs = (n: any) => Math.abs(Number(n ?? 0));
export const max = (...a: any[]) => Math.max(...(a.length === 1 && typeof a[0] === 'object' ? Object.values(a[0]) : a).map(Number));
export const min = (...a: any[]) => Math.min(...(a.length === 1 && typeof a[0] === 'object' ? Object.values(a[0]) : a).map(Number));
export const intval = (v: any) => { if (typeof v === 'boolean') return v ? 1 : 0; const n = parseInt(String(v ?? 0), 10); return Number.isNaN(n) ? 0 : n; };
export const floatval = (v: any) => { if (typeof v === 'boolean') return v ? 1 : 0; const n = parseFloat(String(v ?? 0)); return Number.isNaN(n) ? 0 : n; };
export const nl2br = (s: any) => String(s ?? '').replace(/(\r\n|\n\r|\n|\r)/g, '<br />$1');
export const strip_tags = (s: any) => String(s ?? '').replace(/<[^>]*>/g, '');
export const e = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
export const htmlspecialchars = e;
export const urlencode = (s: any) => encodeURIComponent(String(s ?? '')).replace(/%20/g, '+').replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
export const rawurlencode = (s: any) => encodeURIComponent(String(s ?? '')).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
export const sprintf = (fmt: string, ...args: any[]) => {
  let i = 0;
  return fmt.replace(/%(?:(\d+)\$)?([0 ]|'.)?(-)?(\d+)?(?:\.(\d+))?([sdfFu%])/g, (m, _pos, pad, left, width, prec, t: string) => {
    if (t === '%') return '%';
    const v = args[i++];
    let s = t === 'd' || t === 'u' ? String(Math.trunc(Number(v ?? 0))) : t === 'f' || t === 'F' ? Number(v ?? 0).toFixed(prec === undefined ? 6 : +prec) : String(v ?? '');
    const p = pad ? (pad.length === 2 ? pad[1] : pad) : ' ';
    if (width && s.length < +width) s = left ? s.padEnd(+width, p) : s.padStart(+width, p);
    return s;
  });
};
export const json_encode = (v: any, _flags = 0) => phpJson(v);
export const JSON_UNESCAPED_UNICODE = 256;
export const JSON_UNESCAPED_SLASHES = 64;
export { addslashes } from './html';
export const class_basename = (v: any) => String(typeof v === 'string' ? v : v?.constructor?.name ?? '').split(/[\\/]/).pop() ?? '';
export const method_exists = (o: any, m: string) => !!o && typeof o[m] === 'function';
export const array_search = (needle: any, arr: any) => { const e = entries(arr).find(([, v]) => looseEq(v, needle)); return e ? e[0] : false; };
export const json_decode = (s: any, _assoc = false) => { try { return typeof s === 'string' ? JSON.parse(s) : s ?? null; } catch { return null; } };
// optional($x)->y: null-safe, so `?.` stops the whole chain
export const optional = (v: any): any => v ?? null;
export const data_get = (o: any, k: string, d: any = null) => getField(o, k) ?? d;
export const filled = (v: any) => !(v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0));
export const blank = (v: any) => !filled(v);
export const str = (v: any) => String(v ?? '');

export const Str = {
  limit: (s: any, n = 100, end = '...') => strLimit(String(s ?? ''), n, end),
  title: (s: any) => strTitle(String(s ?? '')),
  upper: (s: any) => String(s ?? '').toUpperCase(),
  lower: (s: any) => String(s ?? '').toLowerCase(),
  ucfirst: (s: any) => ucfirst(s),
  slug: (s: any, sep = '-') => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/@/g, sep + 'at' + sep).replace(/[^a-z0-9\s_-]/g, '').replace(/[\s_-]+/g, sep).replace(new RegExp(`^\\${sep}+|\\${sep}+$`, 'g'), ''),
  plural: (s: string, n = 2) => (n === 1 ? s : s.endsWith('y') && !/[aeiou]y$/.test(s) ? s.slice(0, -1) + 'ies' : /(s|x|z|ch|sh)$/.test(s) ? s + 'es' : s + 's'),
  contains: (s: any, n: string | string[]) => (Array.isArray(n) ? n : [n]).some((x) => String(s ?? '').includes(x)),
  startsWith: (s: any, n: string) => String(s ?? '').startsWith(n),
  words: (s: any, n = 100, end = '...') => { const w = String(s ?? '').split(/\s+/); return w.length <= n ? String(s ?? '') : w.slice(0, n).join(' ') + end; },
  headline: (s: any) => strTitle(String(s ?? '').replace(/[_-]+/g, ' ')),
  replace: (a: string, b: string, s: any) => String(s ?? '').split(a).join(b),
  after: (s: any, n: string) => { const t = String(s ?? ''); const i = t.indexOf(n); return i < 0 ? t : t.slice(i + n.length); },
  afterLast: (s: any, n: string) => { const t = String(s ?? ''); const i = t.lastIndexOf(n); return i < 0 ? t : t.slice(i + n.length); },
  before: (s: any, n: string) => { const t = String(s ?? ''); const i = t.indexOf(n); return i < 0 ? t : t.slice(0, i); },
  squish: (s: any) => String(s ?? '').trim().replace(/\s+/g, ' '),
  mask: (s: any, c: string, i: number) => { const t = String(s ?? ''); return t.slice(0, i) + c.repeat(Math.max(t.length - i, 0)); },
};

/** @foreach ($items as $k => $v): [key, value] pairs for lists and maps */
export const entries = (v: any): [any, any][] => (v === null || v === undefined ? [] : Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v));

export interface Loop { index: number; iteration: number; first: boolean; last: boolean; count: number; remaining: number; even: boolean; odd: boolean }
/** @foreach with Blade's $loop */
export function foreach<T = any>(items: Iterable<T> | Record<string, T> | null | undefined, fn: (item: T, loop: Loop) => any): Html {
  const arr: T[] = !items ? [] : Symbol.iterator in Object(items) ? Array.from(items as Iterable<T>) : Object.values(items as Record<string, T>);
  return html`${arr.map((it, i) => fn(it, { index: i, iteration: i + 1, first: i === 0, last: i === arr.length - 1, count: arr.length, remaining: arr.length - i - 1, even: (i + 1) % 2 === 0, odd: (i + 1) % 2 === 1 }))}`;
}

// ── <x-adminside.quill-editor> (components/adminside/quill-editor.blade.php) ──
export function quillEditor(p: { id: string; label?: string; lang?: string; value?: any; placeholder?: string; rtl?: boolean; height?: string; mode?: string }): Html {
  const { id, label = '', lang = '', value = null, placeholder = '', rtl = false, height = '300px' } = p;
  const c = ctx();
  c.stack.push(html`<script>
    (function() {

        if (!window.Quill) {
            console.warn("Quill library missing for ${id}");
            return;
        }

        const quill = new Quill("#${id}", {
            theme: "snow",
            placeholder: "${placeholder}",
            modules: {
                toolbar: "#${id}-toolbar",
                clipboard: { matchVisual: false }
            }
        });

        // Fill initial content
        ${value ? html`quill.clipboard.dangerouslyPasteHTML(${raw(phpJson(value, true))});
        ` : ''}
        // Update hidden input on change
        quill.on("text-change", function() {
            document.getElementById("${id}-content").value = quill.root.innerHTML;
        });

        // Store globally if needed
        window["quill_${id}"] = quill;

    })();
</script>
`);
  return html`<div class="mb-4">

    
    <label class="form-label fw-bold mb-1" for="${id}">
        ${label} ${lang ? strtoupper(lang) : ''}
    </label>

    
    <div id="${id}-toolbar" class="mb-2 border rounded px-2 py-1 bg-light">
        <span class="ql-formats">
            <select class="ql-header">
                <option selected></option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
            </select>
            <select class="ql-font"></select>
            <select class="ql-size">
                <option value="small">Small</option>
                <option selected>Normal</option>
                <option value="large">Large</option>
                <option value="huge">Huge</option>
            </select>
        </span>
        <span class="ql-formats">
            <button class="ql-bold"></button>
            <button class="ql-italic"></button>
            <button class="ql-underline"></button>
            <button class="ql-strike"></button>
        </span>
        <span class="ql-formats">
            <button class="ql-list" value="ordered"></button>
            <button class="ql-list" value="bullet"></button>
            <button class="ql-indent" value="-1"></button>
            <button class="ql-indent" value="+1"></button>
        </span>
        <span class="ql-formats">
            <button class="ql-blockquote"></button>
            <button class="ql-code-block"></button>
        </span>
        <span class="ql-formats">
            <select class="ql-align"></select>
            <select class="ql-color"></select>
            <select class="ql-background"></select>
        </span>
        <span class="ql-formats">
            <button class="ql-link"></button>
            <button class="ql-image"></button>
            <button class="ql-video"></button>
        </span>
        <span class="ql-formats">
            <button class="ql-clean"></button>
        </span>
    </div>

    
    <div
        id="${id}"
        class="quill-body"
        style="border:1px solid #ced4da;border-radius:.375rem;background:white;min-height:${height};${rtl ? 'text-align:right;direction:rtl;' : ''}">

    </div>

    
    <input type="hidden" name="${id}" id="${id}-content" value="${value}">

</div>

`;
}
export const LengthAwarePaginator = Paginator;

// Model constants the views read (App\Models\…)
export const NewsletterCampaign = { STATUS_DRAFT: 'draft', STATUS_SENT: 'sent', statusOptions: () => ['draft', 'sent'] };
export const User = { class: 'App\\Models\\User' };
export const Customer = { class: 'App\\Models\\Customer' };
