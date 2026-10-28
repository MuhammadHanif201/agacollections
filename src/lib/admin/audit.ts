import 'server-only';
import { headers } from 'next/headers';
import { connectDb } from '@/lib/db';
import { clientIp } from '@/lib/request';
import { nextId } from '@/models/Counter';
import { Audit } from '@/models/User';
import { phpJson } from './html';

export type AuditEvent = 'created' | 'updated' | 'deleted';

/** owen-it/laravel-auditing stored values the way json_encode() printed the model attributes */
function serialize(values: Record<string, unknown>): string {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === 'created_at' || k === 'updated_at') continue; // audit.timestamps = false
    out[k] = v instanceof Date ? v.toISOString().slice(0, 19).replace('T', ' ') : v;
  }
  return Object.keys(out).length ? phpJson(out) : '[]';
}

export interface AuditInput {
  event: AuditEvent;
  type: string; // e.g. "App\\Models\\Order"
  id: number;
  old?: Record<string, unknown>;
  new?: Record<string, unknown>;
  /** the signed-in admin (web guard); shoppers are not recorded, as before */
  userId?: number | null;
  url?: string;
  /** the request, for the full URL (Request::fullUrl()) */
  req?: Request;
}

/** Diff two attribute sets like Eloquent's getDirty(): only the changed keys */
export function dirty(before: Record<string, unknown>, after: Record<string, unknown>) {
  const old: Record<string, unknown> = {};
  const now: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(after)) {
    if (k === 'updated_at' || k === 'created_at') continue;
    const a = before[k];
    const same = a instanceof Date && v instanceof Date ? a.getTime() === v.getTime() : JSON.stringify(a ?? null) === JSON.stringify(v ?? null);
    if (!same) { old[k] = a ?? null; now[k] = v ?? null; }
  }
  return { old, new: now, changed: Object.keys(now).length > 0 };
}

const numeric = (v: unknown) => (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && /^\s*[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?\s*$/i.test(v));

/**
 * Eloquent's getDirty() for columns without casts: `original` holds the values as MySQL
 * returned them (DECIMAL as "123.00", tinyint as 1/0), `attrs` the values the code set
 * (often the form's strings). Numbers are equal only when their text is equal, so
 * "4998.00" → 4998 counts as a change, as it did in the audit log. Keys follow `order`.
 */
export function laravelDirty(original: Record<string, unknown>, attrs: Record<string, unknown>, order: string[]) {
  const old: Record<string, unknown> = {};
  const now: Record<string, unknown> = {};
  for (const k of order) {
    if (!(k in attrs)) continue;
    const a = original[k] ?? null, v = attrs[k] ?? null;
    // booleans: the models cast them, so 1 and true are the same value
    const bool = typeof a === 'boolean' || typeof v === 'boolean';
    const same = a === v || (bool && [0, 1, true, false].includes(a as never) && [0, 1, true, false].includes(v as never) && Boolean(a) === Boolean(v))
      || (!bool && numeric(a) && numeric(v) && String(a) === String(v));
    if (!same) { old[k] = a; now[k] = v; }
  }
  return { old, new: now, changed: Object.keys(now).length > 0 };
}

/** How MySQL handed a value back: DECIMAL(…,2) as text with 2 decimals, booleans as 1/0 */
export const dbDecimal = (n: unknown) => (n === null || n === undefined ? null : Number(n).toFixed(2));
export const dbBool = (b: unknown) => (b === null || b === undefined ? null : b ? 1 : 0);

const fullUrl = (req: Request, host: string, proto: string) => {
  const u = new URL(req.url);
  return `${proto}://${host || u.host}${u.pathname}${u.search}`;
};

/** One audit row, as the Auditable trait wrote on created / updated / deleted */
export async function recordAudit(a: AuditInput) {
  try {
    await connectDb();
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const path = h.get('x-zq-path') ?? '';
    const now = new Date();
    await Audit.create({
      _id: await nextId('audits'),
      user_type: a.userId ? 'App\\Models\\User' : null,
      user_id: a.userId ?? null,
      event: a.event,
      auditable_type: a.type,
      auditable_id: a.id,
      old_values: serialize(a.old ?? {}),
      new_values: serialize(a.new ?? {}),
      url: a.url ?? (a.req ? fullUrl(a.req, host, proto) : host ? `${proto}://${host}${path}` : 'console'),
      ip_address: (await clientIp()).slice(0, 45),
      user_agent: (h.get('user-agent') ?? '').slice(0, 1023) || null,
      tags: null,
      created_at: now,
      updated_at: now,
    });
  } catch (e) {
    console.error('Audit write failed: ' + (e as Error).message);
  }
}
