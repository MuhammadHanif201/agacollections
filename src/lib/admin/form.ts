import 'server-only';

/** An uploaded file, read into memory (admin uploads are images and short videos) */
export interface UploadedFile {
  __file: true;
  name: string;
  type: string;
  size: number;
  head: Uint8Array; // first bytes, to tell the real file type like PHP's finfo
  headText: string;
  bytes: () => Promise<Buffer>;
}

export type FormValue = string | null | UploadedFile | FormValue[] | { [k: string]: FormValue };
export type FormInput = Record<string, FormValue>;

const NO_TRIM = new Set(['current_password', 'password', 'password_confirmation']);

/** "variants[0][sku]" → ["variants", "0", "sku"]; "images[]" → ["images", ""] */
function keyPath(name: string): string[] {
  const m = name.match(/^([^[]+)((?:\[[^\]]*\])*)$/);
  if (!m) return [name];
  const rest = [...m[2].matchAll(/\[([^\]]*)\]/g)].map((x) => x[1]);
  return [m[1], ...rest];
}

function assign(target: Record<string, FormValue>, path: string[], value: FormValue) {
  let cur: Record<string, FormValue> = target;
  for (let i = 0; i < path.length; i++) {
    let key = path[i];
    const last = i === path.length - 1;
    if (key === '') key = String(Object.keys(cur).length); // [] appends like PHP
    if (last) { cur[key] = value; return; }
    const next = cur[key];
    if (!next || typeof next !== 'object' || Array.isArray(next) || (next as UploadedFile).__file) cur[key] = {};
    cur = cur[key] as Record<string, FormValue>;
  }
}

async function toUpload(f: File): Promise<UploadedFile | null> {
  if (f.size === 0 && !f.name) return null; // an empty file input, PHP gives no file
  const buf = Buffer.from(await f.arrayBuffer());
  const head = new Uint8Array(buf.subarray(0, 512));
  return { __file: true, name: f.name, type: f.type, size: f.size, head, headText: buf.subarray(0, 512).toString('latin1'), bytes: async () => buf };
}

/**
 * The request body as Laravel sees it: PHP-style nested keys, strings trimmed and empty
 * strings turned into null (TrimStrings + ConvertEmptyStringsToNull), plus ?query values.
 */
export async function readForm(req: Request): Promise<FormInput> {
  const out: FormInput = {};
  const type = req.headers.get('content-type') ?? '';
  const clean = (k: string, v: string): string | null => {
    const field = keyPath(k).filter(Boolean).pop() ?? k;
    const t = NO_TRIM.has(field) ? v : v.trim();
    return t === '' ? null : t;
  };
  try {
    if (type.includes('application/json')) {
      const body = await req.json();
      const walk = (v: unknown, key: string): FormValue => {
        if (typeof v === 'string') return clean(key, v);
        if (Array.isArray(v)) return Object.fromEntries(v.map((x, i) => [String(i), walk(x, key)]));
        if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
        if (v === null || v === undefined) return null;
        return String(v);
      };
      if (body && typeof body === 'object') for (const [k, v] of Object.entries(body)) out[k] = walk(v, k);
    } else if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) {
        if (typeof v === 'string') assign(out, keyPath(k), clean(k, v));
        else assign(out, keyPath(k), await toUpload(v));
      }
    }
  } catch { /* malformed body: treated as empty */ }
  return out;
}

/** Query string with the same cleaning as form fields */
export function readQuery(req: Request): FormInput {
  const out: FormInput = {};
  for (const [k, v] of new URL(req.url).searchParams.entries()) {
    const t = v.trim();
    assign(out, keyPath(k), t === '' ? null : t);
  }
  return out;
}

/** $request->input('a.b') as a string (or null) */
export function str(input: FormInput, key: string): string | null {
  let cur: unknown = input;
  for (const k of key.split('.')) {
    if (!cur || typeof cur !== 'object') return null;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === 'string' ? cur : null;
}

/** $request->boolean() */
export const bool = (input: FormInput, key: string) => ['1', 'true', 'on', 'yes'].includes((str(input, key) ?? '').toLowerCase());

/** Values of a field sent as name[] (or name[0], name[1] …) in order */
export function list(input: FormInput, key: string): FormValue[] {
  const v = input[key];
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object' && !(v as UploadedFile).__file) return Object.values(v);
  return [v];
}

export const isUpload = (v: unknown): v is UploadedFile => !!v && typeof v === 'object' && (v as UploadedFile).__file === true;

/** Flatten nested input to "a.b.c" keys (for old() lookups on the next page) */
export function flattenOld(input: FormInput, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v === null) out[key] = '';
    else if (typeof v === 'string') out[key] = v;
    else if (isUpload(v)) continue;
    else if (typeof v === 'object') Object.assign(out, flattenOld(v as FormInput, key));
  }
  return out;
}
