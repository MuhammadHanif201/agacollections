// Server-rendered HTML for the admin panel. The admin pages are the Blade views ported
// one to one: plain HTML plus the same jQuery / AdminLTE scripts, so they are sent as
// documents (no React hydration that could fight with those scripts).
import { escapeHtml } from '@/lib/format';

export class Html {
  constructor(readonly value: string) {}
  toString() { return this.value; }
}

/** {!! $x !!}: insert without escaping */
export const raw = (s: unknown) => (s instanceof Html ? s : new Html(s === null || s === undefined || s === false ? '' : s === true ? '1' : String(s)));

export type Part = Html | string | number | boolean | null | undefined | Part[];

function render(v: Part): string {
  if (v === null || v === undefined || v === false) return '';
  if (v === true) return '1'; // Blade prints true as 1
  if (v instanceof Html) return v.value;
  if (Array.isArray(v)) return v.map(render).join('');
  return escapeHtml(String(v));
}

/** Blade-like template: ${x} is escaped like {{ $x }}, raw()/html`` values are not */
export function html(strings: TemplateStringsArray, ...values: Part[]): Html {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Html(out);
}

/** @foreach with an index */
export const each = <T>(items: readonly T[], fn: (item: T, i: number) => Part) =>
  new Html(items.map((it, i) => render(fn(it, i))).join(''));

/** PHP addslashes() */
export const addslashes = (s: string) => s.replace(/([\\'"])/g, '\\$1').replace(/\0/g, '\\0');

/**
 * PHP json_encode(): "/" escaped and non-ASCII as \uXXXX. With `blade` it adds the
 * JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT flags that @json uses.
 */
export function phpJson(v: unknown, blade = false): string {
  const str = (s: string) => {
    let out = '"';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const c = s.charCodeAt(i);
      if (ch === '"') out += blade ? '\\u0022' : '\\"';
      else if (ch === '\\') out += '\\\\';
      else if (ch === '/') out += '\\/';
      else if (ch === '\n') out += '\\n';
      else if (ch === '\r') out += '\\r';
      else if (ch === '\t') out += '\\t';
      else if (ch === '\b') out += '\\b';
      else if (ch === '\f') out += '\\f';
      else if (blade && ch === '<') out += '\\u003C';
      else if (blade && ch === '>') out += '\\u003E';
      else if (blade && ch === "'") out += '\\u0027';
      else if (blade && ch === '&') out += '\\u0026';
      else if (c < 0x20 || c > 0x7f) out += '\\u' + c.toString(16).padStart(4, '0');
      else out += ch;
    }
    return out + '"';
  };
  const enc = (x: unknown): string => {
    if (x === null || x === undefined) return 'null';
    if (typeof x === 'string') return str(x);
    if (typeof x === 'number') return Number.isFinite(x) ? String(x) : '0';
    if (typeof x === 'boolean') return x ? 'true' : 'false';
    if (x instanceof Date) return str(x.toISOString().replace(/\.(\d{3})Z$/, '.$1000Z'));
    if (Array.isArray(x)) return '[' + x.map(enc).join(',') + ']';
    if (typeof x === 'object') {
      return '{' + Object.entries(x as Record<string, unknown>).filter(([, val]) => val !== undefined).map(([k, val]) => str(k) + ':' + enc(val)).join(',') + '}';
    }
    return 'null';
  };
  return enc(v);
}

/** @json($x) */
export const bladeJson = (v: unknown) => raw(phpJson(v, true));

export const htmlResponse = (body: Html | string, status = 200, headers: Record<string, string> = {}) =>
  new Response(typeof body === 'string' ? body : body.value, {
    status,
    headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': 'no-cache, private', ...headers },
  });
