import 'server-only';
import type { Model } from 'mongoose';
import { connectDb } from '@/lib/db';
import { nextId } from '@/models/Counter';
import { laravelDirty, recordAudit } from './audit';
import { phpJson } from './html';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Who { req: Request; adminId: number | null }

/**
 * How the audit log saw a stored row: MySQL's view of it. DECIMAL columns as "12.00",
 * booleans as 1/0, JSON columns as text, dates as "Y-m-d H:i:s", in column order.
 */
export function dbRow(doc: Record<string, any>, decimals: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k === '_id' || k === 'created_at' || k === 'updated_at') continue;
    if (decimals.includes(k)) out[k] = v === null || v === undefined ? null : Number(v).toFixed(2);
    else if (typeof v === 'boolean') out[k] = v ? 1 : 0;
    else if (v instanceof Date) out[k] = v.toISOString().slice(0, 19).replace('T', ' ');
    else if (v && typeof v === 'object') out[k] = phpJson(v);
    else out[k] = v ?? null;
  }
  return out;
}

export interface AuditShape {
  /** the values as the PHP set them, when they differ from what is stored (form text, e.g. "25") */
  typed?: Record<string, unknown>;
  /** DECIMAL columns of this table */
  decimals?: string[];
}

/**
 * Model::create(): a new row with the next id, timestamps and a "created" audit.
 * `defaults` are column defaults: stored, but not part of the audit (the model never set them).
 */
export async function createRow(model: Model<any>, sequence: string, type: string | null, attrs: Record<string, unknown>, who: Who, defaults: Record<string, unknown> = {}, shape: AuditShape = {}) {
  await connectDb();
  const id = await nextId(sequence);
  const now = new Date();
  await model.create([{ _id: id, ...defaults, ...attrs, created_at: now, updated_at: now }], { timestamps: false });
  if (type) await recordAudit({ event: 'created', type, id, new: { ...attrs, ...(shape.typed ?? {}), id }, userId: who.adminId, req: who.req });
  return id;
}

/** $model->update(): writes (and audits) only the attributes that changed, Eloquent's way */
export async function updateRow(model: Model<any>, type: string | null, before: Record<string, any>, attrs: Record<string, unknown>, who: Who, shape: AuditShape = {}) {
  await connectDb();
  const original = dbRow(before, shape.decimals);
  const typed = { ...attrs, ...(shape.typed ?? {}) };
  // existing columns keep the table's order, new ones follow
  const order = [...Object.keys(original), ...Object.keys(attrs).filter((k) => !(k in original))];
  const d = laravelDirty(original, typed, order);
  if (!d.changed) return false;
  const set = Object.fromEntries(Object.keys(d.new).map((k) => [k, attrs[k]]));
  await model.updateOne({ _id: before._id }, { $set: { ...set, updated_at: new Date() } }, { timestamps: false });
  if (type) await recordAudit({ event: 'updated', type, id: before._id, old: d.old, new: d.new, userId: who.adminId, req: who.req });
  return true;
}

/** $model->delete() with a "deleted" audit holding the old attributes */
export async function deleteRow(model: Model<any>, type: string | null, before: Record<string, any>, who: Who, shape: AuditShape = {}) {
  await connectDb();
  await model.deleteOne({ _id: before._id });
  if (type) await recordAudit({ event: 'deleted', type, id: before._id, old: { id: before._id, ...dbRow(before, shape.decimals) }, userId: who.adminId, req: who.req });
}

/** A datetime-local value saved through a datetime cast: "2026-11-01T10:00" → "2026-11-01 10:00:00" */
export function wallDate(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return `${m[1]} ${m[2] ?? '00'}:${m[3] ?? '00'}:${m[4] ?? '00'}`;
}
