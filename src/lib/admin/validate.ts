// A port of the parts of Laravel's Validator the admin controllers use: the same rule
// names, the same "skip when empty" behaviour and the same English messages.
import type { UploadedFile } from './form';

export type Input = Record<string, unknown>;
export type CustomRule = { name: string; test: (value: unknown, attribute: string) => boolean | Promise<boolean>; message?: string };
export type Rule = string | CustomRule;
export type Rules = Record<string, string | Rule[]>;
export type Errors = Record<string, string[]>;

const IMPLICIT = new Set(['required', 'required_with', 'required_without', 'required_if', 'accepted', 'present']);

const MESSAGES: Record<string, string | Record<string, string>> = {
  after: 'The :attribute field must be a date after :date.',
  after_or_equal: 'The :attribute field must be a date after or equal to :date.',
  before_or_equal: 'The :attribute field must be a date before or equal to :date.',
  alpha_dash: 'The :attribute field must only contain letters, numbers, dashes, and underscores.',
  array: 'The :attribute field must be an array.',
  between: {
    array: 'The :attribute field must have between :min and :max items.',
    file: 'The :attribute field must be between :min and :max kilobytes.',
    numeric: 'The :attribute field must be between :min and :max.',
    string: 'The :attribute field must be between :min and :max characters.',
  },
  boolean: 'The :attribute field must be true or false.',
  confirmed: 'The :attribute field confirmation does not match.',
  date: 'The :attribute field must be a valid date.',
  distinct: 'The :attribute field has a duplicate value.',
  email: 'The :attribute field must be a valid email address.',
  exists: 'The selected :attribute is invalid.',
  file: 'The :attribute field must be a file.',
  image: 'The :attribute field must be an image.',
  in: 'The selected :attribute is invalid.',
  integer: 'The :attribute field must be an integer.',
  max: {
    array: 'The :attribute field must not have more than :max items.',
    file: 'The :attribute field must not be greater than :max kilobytes.',
    numeric: 'The :attribute field must not be greater than :max.',
    string: 'The :attribute field must not be greater than :max characters.',
  },
  mimes: 'The :attribute field must be a file of type: :values.',
  mimetypes: 'The :attribute field must be a file of type: :values.',
  min: {
    array: 'The :attribute field must have at least :min items.',
    file: 'The :attribute field must be at least :min kilobytes.',
    numeric: 'The :attribute field must be at least :min.',
    string: 'The :attribute field must be at least :min characters.',
  },
  numeric: 'The :attribute field must be a number.',
  regex: 'The :attribute field format is invalid.',
  required: 'The :attribute field is required.',
  required_if: 'The :attribute field is required when :other is :value.',
  required_with: 'The :attribute field is required when :values is present.',
  required_without: 'The :attribute field is required when :values is not present.',
  string: 'The :attribute field must be a string.',
  unique: 'The :attribute has already been taken.',
  url: 'The :attribute field must be a valid URL.',
};

const isFile = (v: unknown): v is UploadedFile => !!v && typeof v === 'object' && (v as UploadedFile).__file === true;

export function getPath(data: Input, path: string): unknown {
  let cur: unknown = data;
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

const hasPath = (data: Input, path: string) => {
  let cur: unknown = data;
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object' || !(k in (cur as object))) return false;
    cur = (cur as Record<string, unknown>)[k];
  }
  return true;
};

/** "variants.*.sku" → every matching key that exists in the input */
function expand(data: Input, pattern: string): string[] {
  if (!pattern.includes('*')) return [pattern];
  const parts = pattern.split('.');
  let paths: string[] = [''];
  for (const p of parts) {
    const next: string[] = [];
    for (const base of paths) {
      if (p === '*') {
        const v = base ? getPath(data, base) : data;
        if (v && typeof v === 'object' && !isFile(v)) for (const k of Object.keys(v)) next.push(base ? `${base}.${k}` : k);
      } else next.push(base ? `${base}.${p}` : p);
    }
    paths = next;
  }
  return paths;
}

const filled = (v: unknown) => {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (isFile(v)) return v.size > 0 || v.name !== '';
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
};

const isNumeric = (v: unknown) => (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && /^\s*[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?\s*$/i.test(v));

function parseDate(v: unknown): number | null {
  if (v instanceof Date) return v.getTime();
  if (typeof v !== 'string' || v.trim() === '') return null;
  const s = v.trim();
  if (s === 'today') { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d.getTime(); }
  if (s === 'now') return Date.now();
  if (s === 'tomorrow') { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d.getTime() + 86400000; }
  // MySQL-style and HTML date / datetime-local values, read as UTC (the app timezone)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
    const d = new Date(t);
    return d.getUTCMonth() === +m[2] - 1 ? t : null;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

function sniffExtension(f: UploadedFile): string {
  const b = f.head;
  const ext = (f.name.split('.').pop() ?? '').toLowerCase();
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'gif';
  if (b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
  const ascii = String.fromCharCode(...b.slice(0, 64));
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'webp';
  if (ascii.slice(4, 8) === 'ftyp') {
    const brand = ascii.slice(8, 12);
    if (brand.startsWith('avi')) return 'avif';
    if (brand === 'qt  ') return 'mov';
    return 'mp4';
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return 'ico';
  if (/^\s*(<\?xml[^>]*>\s*)?<svg/i.test(ascii) || (ext === 'svg' && /<svg/i.test(f.headText))) return 'svg';
  return ext;
}

export const fileExtension = sniffExtension;

export interface ValidateOptions {
  messages?: Record<string, string>;
  attributes?: Record<string, string>;
}

/** Laravel $request->validate(): returns field → messages (empty when it passes) */
export async function validate(data: Input, rules: Rules, opts: ValidateOptions = {}): Promise<Errors> {
  const errors: Errors = {};
  for (const [pattern, spec] of Object.entries(rules)) {
    const list: Rule[] = typeof spec === 'string' ? spec.split('|').filter(Boolean) : spec;
    const names = list.map((r) => (typeof r === 'string' ? r.split(':')[0] : r.name));
    const sizeType = (v: unknown) => (names.includes('numeric') || names.includes('integer') ? 'numeric' : isFile(v) ? 'file' : Array.isArray(v) || (v && typeof v === 'object') ? 'array' : 'string');

    for (const attribute of expand(data, pattern)) {
      const present = hasPath(data, attribute);
      if (names.includes('sometimes') && !present) continue;
      const value = getPath(data, attribute);
      const failed: string[] = [];

      for (const rule of list) {
        const name = typeof rule === 'string' ? rule.split(':')[0] : rule.name;
        if (name === 'nullable' || name === 'sometimes' || name === 'bail') continue;
        const params = typeof rule === 'string' && rule.includes(':') ? rule.slice(rule.indexOf(':') + 1).split(',') : [];
        const implicit = IMPLICIT.has(name);

        // Rules other than required* only run on a value that is there
        if (!implicit) {
          if (typeof value === 'string' && value.trim() === '') continue;
          if (!present) continue;
          if (value === null && names.includes('nullable')) continue;
          if (isFile(value) && value.size === 0 && value.name === '') continue;
        }

        let ok = true;
        let replace: Record<string, string> = {};
        const size = () => {
          const t = sizeType(value);
          if (t === 'numeric') return Number(value);
          if (t === 'file') return (value as UploadedFile).size / 1024;
          if (t === 'array') return Object.keys(value as object).length;
          return [...String(value ?? '')].length;
        };

        if (typeof rule !== 'string') {
          ok = await rule.test(value, attribute);
        } else switch (name) {
          case 'required': ok = filled(value); break;
          case 'required_with': ok = !params.some((p) => filled(getPath(data, p))) || filled(value); replace = { values: params.join(' / ') }; break;
          case 'required_without': ok = !params.some((p) => !filled(getPath(data, p))) || filled(value); replace = { values: params.join(' / ') }; break;
          case 'required_if': ok = String(getPath(data, params[0]) ?? '') !== params[1] || filled(value); replace = { other: params[0].replace(/_/g, ' '), value: params[1] }; break;
          case 'string': ok = typeof value === 'string'; break;
          case 'numeric': ok = isNumeric(value); break;
          case 'integer': ok = (typeof value === 'number' && Number.isInteger(value)) || (typeof value === 'string' && /^\s*[+-]?\d+\s*$/.test(value)); break;
          case 'boolean': ok = [true, false, 0, 1, '0', '1'].includes(value as never); break;
          case 'array': ok = Array.isArray(value) || (!!value && typeof value === 'object' && !isFile(value)); break;
          case 'in': ok = typeof value !== 'object' && params.includes(String(value)); break;
          case 'max': ok = size() <= Number(params[0]); replace = { max: params[0] }; break;
          case 'min': ok = size() >= Number(params[0]); replace = { min: params[0] }; break;
          case 'between': { const s = size(); ok = s >= Number(params[0]) && s <= Number(params[1]); replace = { min: params[0], max: params[1] }; break; }
          case 'email': ok = typeof value === 'string' && /^[^\s@]+@[^\s@]+$/.test(value); break;
          case 'url': {
            ok = false;
            if (typeof value === 'string' && !/\s/.test(value)) {
              try { const u = new URL(value); ok = /^[a-z][a-z0-9+.-]*:$/i.test(u.protocol) && (!!u.hostname || u.protocol === 'mailto:'); } catch { ok = false; }
            }
            break;
          }
          case 'alpha_dash': ok = typeof value === 'string' && /^[\p{L}\p{M}\p{N}_-]+$/u.test(value); break;
          case 'regex': {
            const src = typeof rule === 'string' ? rule.slice(rule.indexOf(':') + 1) : '';
            const m = src.match(/^\/(.*)\/([a-z]*)$/s);
            ok = !!m && new RegExp(m[1], m[2].replace(/[^imsu]/g, '')).test(String(value));
            break;
          }
          case 'date': ok = parseDate(value) !== null; break;
          case 'after': case 'after_or_equal': case 'before_or_equal': {
            const other = hasPath(data, params[0]) ? getPath(data, params[0]) : params[0];
            const a = parseDate(value), b = parseDate(other);
            ok = a !== null && b !== null && (name === 'after' ? a > b : name === 'after_or_equal' ? a >= b : a <= b);
            replace = { date: hasPath(data, params[0]) ? params[0].replace(/_/g, ' ') : params[0] };
            break;
          }
          case 'confirmed': ok = getPath(data, `${attribute}_confirmation`) === value; break;
          case 'distinct': {
            const parent = attribute.split('.').slice(0, -1).join('.');
            const siblings = Object.values((getPath(data, parent) as object) ?? {});
            ok = siblings.filter((s) => String(s) === String(value)).length <= 1;
            break;
          }
          case 'file': ok = isFile(value); break;
          case 'image': ok = isFile(value) && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(sniffExtension(value)); break;
          case 'mimes': {
            let allowed = params.map((p) => p.toLowerCase());
            if (allowed.includes('jpg') || allowed.includes('jpeg')) allowed = [...new Set([...allowed, 'jpg', 'jpeg'])];
            ok = isFile(value) && allowed.includes(sniffExtension(value));
            replace = { values: params.join(', ') };
            break;
          }
          default: throw new Error(`Validation rule ${name} is not supported`);
        }

        if (!ok) {
          failed.push(name);
          const label = opts.attributes?.[attribute] ?? opts.attributes?.[pattern] ?? attribute.replace(/_/g, ' ');
          const custom = opts.messages?.[`${attribute}.${name}`] ?? opts.messages?.[`${pattern}.${name}`] ?? opts.messages?.[name] ?? (typeof rule === 'string' ? undefined : rule.message);
          let msg = custom ?? (() => {
            const m = MESSAGES[name];
            return typeof m === 'string' ? m : m?.[sizeType(value)] ?? `The ${label} is invalid.`;
          })();
          msg = msg.replace(/:attribute/g, label).replace(/:Attribute/g, label.charAt(0).toUpperCase() + label.slice(1));
          for (const [k, v] of Object.entries(replace)) msg = msg.replace(new RegExp(`:${k}\\b`, 'g'), v);
          (errors[attribute] ??= []).push(msg);
          if (implicit) break; // Laravel stops checking a field once a "required" rule fails
        }
      }
    }
  }
  return errors;
}

export const firstErrors = (e: Errors) => Object.values(e).flat();
