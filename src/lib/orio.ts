import 'server-only';
import { connectDb } from '@/lib/db';
import { Order, type OrderDoc } from '@/models/Order';
import { Product } from '@/models/Product';

/**
 * Orio (oms.getorio.com): order management + courier booking. Orders placed on the site are
 * sent to Orio's Open API (Developer Center → Open API → Place Order).
 *
 * Settings (Vercel → Environment Variables):
 *   ORIO_API_KEY               required; the API key from the Developer Center (never in code)
 *   ORIO_ACNO / ORIO_USER_ID   account number and user id (default: the store's account)
 *   ORIO_PLATFORM_ID / ORIO_CUSTOMER_PLATFORM_ID   optional; default 7 / 7011 (the AGA Collections custom platform)
 *   ORIO_AUTO_SEND=1           send every new order automatically (off until a test order looks right)
 */
const BASE = 'https://apis.orio.digital/api';

export const orioConfig = () => ({
  key: process.env.ORIO_API_KEY?.trim() || '',
  acno: process.env.ORIO_ACNO?.trim() || 'OR-06390',
  userId: Number(process.env.ORIO_USER_ID?.trim() || 6584),
  // the "AGA Collections" custom platform (Integrations → Platforms); Orio's platform list has no names
  platformId: Number(process.env.ORIO_PLATFORM_ID) || 7,
  customerPlatformId: Number(process.env.ORIO_CUSTOMER_PLATFORM_ID) || 7011,
  autoSend: process.env.ORIO_AUTO_SEND?.trim() === '1',
});
export const orioConfigured = () => Boolean(orioConfig().key);

export interface OrioReply { ok: boolean; status: number; json: unknown; text: string }

// The docs only say "Authorization: API key"; send it as is, and fall back to "Bearer <key>" if refused
let authStyle: 'raw' | 'bearer' = 'raw';

export async function orioPost(path: string, body: Record<string, unknown>): Promise<OrioReply> {
  const { key } = orioConfig();
  if (!key) return { ok: false, status: 0, json: null, text: 'ORIO_API_KEY is not set in Vercel.' };
  const call = async (style: 'raw' | 'bearer') => {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { Authorization: style === 'raw' ? key : `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { ok: res.ok && !replyFailed(json), status: res.status, json, text };
  };
  try {
    let r = await call(authStyle);
    if (r.status === 401 || r.status === 403) {
      const other = authStyle === 'raw' ? 'bearer' : 'raw';
      const r2 = await call(other);
      if (r2.status !== 401 && r2.status !== 403) { authStyle = other; r = r2; }
    }
    return r;
  } catch (e) {
    return { ok: false, status: 0, json: null, text: (e as Error).message };
  }
}

/** a 200 reply can still say it failed */
function replyFailed(json: unknown) {
  if (!json || typeof json !== 'object') return false;
  const j = json as Record<string, unknown>;
  return j.success === false || j.status === false || j.status === 'error' || j.status === 'failed' || j.error === true;
}

/** a readable message out of a reply */
export function replyMessage(r: OrioReply) {
  const j = (r.json ?? {}) as Record<string, unknown>;
  const m = j.message ?? j.msg ?? j.error ?? j.errors;
  const text = typeof m === 'string' ? m : m ? JSON.stringify(m) : r.text;
  return `${r.status ? `HTTP ${r.status}: ` : ''}${String(text).slice(0, 400)}`;
}

/** the first list of objects inside a reply (data, data.cities, result, …) */
function firstList(json: unknown, depth = 0): Record<string, unknown>[] {
  if (Array.isArray(json)) return json.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
  if (!json || typeof json !== 'object' || depth > 4) return [];
  for (const v of Object.values(json)) {
    const found = firstList(v, depth + 1);
    if (found.length) return found;
  }
  return [];
}
const pick = (o: Record<string, unknown>, keys: string[]) => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return undefined; };

/* ---------- countries & cities ---------- */

export interface OrioCity { id: number; name: string }
let cityCache: { at: number; list: OrioCity[] } | null = null;

export async function orioPakistanId(): Promise<{ id: number; reply: OrioReply }> {
  const { acno } = orioConfig();
  const reply = await orioPost('/countries', { acno });
  const pk = firstList(reply.json).find((c) => /pakistan/i.test(String(pick(c, ['name', 'country_name', 'title']) ?? '')));
  return { id: Number(pk && pick(pk, ['id', 'country_id'])) || 1, reply };
}

export async function orioCities(force = false): Promise<{ list: OrioCity[]; reply?: OrioReply }> {
  if (!force && cityCache && Date.now() - cityCache.at < 6 * 3600_000) return { list: cityCache.list };
  const { acno, userId } = orioConfig();
  const { id: countryId } = await orioPakistanId();
  const reply = await orioPost('/v2/cities', { acno, user_id: userId, country_id: countryId });
  const list = firstList(reply.json)
    .map((c) => ({ id: Number(pick(c, ['id', 'city_id'])), name: String(pick(c, ['name', 'city_name', 'title', 'city']) ?? '').trim() }))
    .filter((c) => c.id && c.name);
  if (list.length) cityCache = { at: Date.now(), list };
  return { list, reply };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
// short forms and spellings customers type
const ALIASES: Record<string, string> = {
  khi: 'karachi', lhr: 'lahore', isb: 'islamabad', isl: 'islamabad', rwp: 'rawalpindi', pindi: 'rawalpindi', fsd: 'faisalabad',
  lyallpur: 'faisalabad', mul: 'multan', pesh: 'peshawar', psh: 'peshawar', grw: 'gujranwala', skt: 'sialkot', hyd: 'hyderabad',
  dgkhan: 'deraghazikhan', dikhan: 'deraismailkhan', ryk: 'rahimyarkhan', bwp: 'bahawalpur', sargodah: 'sargodha',
};

/** the Orio city for what the customer typed (exact, short form, then a close match) */
export function matchCity(typed: string | null | undefined, list: OrioCity[]): OrioCity | null {
  if (!typed) return null;
  const words = typed.split(/[,\-/]/).map((w) => norm(w)).filter(Boolean);
  for (const w0 of [norm(typed), ...words]) {
    const w = ALIASES[w0] ?? w0;
    const exact = list.find((c) => norm(c.name) === w);
    if (exact) return exact;
  }
  const w = ALIASES[norm(typed)] ?? norm(typed);
  if (w.length < 4) return null;
  return list.find((c) => norm(c.name).startsWith(w) || (w.startsWith(norm(c.name)) && norm(c.name).length >= 4)) ?? null;
}

/* ---------- platform ---------- */

export interface OrioPlatform { name: string; platformId: number | null; customerPlatformId: number | null; raw: Record<string, unknown> }

export async function orioPlatforms(): Promise<{ list: OrioPlatform[]; reply: OrioReply }> {
  const { acno, userId } = orioConfig();
  const reply = await orioPost('/v2/platform/details', { acno, user_id: userId });
  const list = firstList(reply.json).map((p) => ({
    name: String(pick(p, ['shop_name', 'shopname', 'name', 'store_name', 'title']) ?? ''),
    platformId: Number(pick(p, ['platform_id'])) || null,
    customerPlatformId: Number(pick(p, ['customer_platform_id', 'id'])) || null,
    raw: p,
  }));
  return { list, reply };
}

/** the "AGA Collections" custom platform in Orio (or the ids set in Vercel) */
export async function orioStorePlatform() {
  const cfg = orioConfig();
  if (cfg.platformId && cfg.customerPlatformId) return { platformId: cfg.platformId, customerPlatformId: cfg.customerPlatformId };
  const { list } = await orioPlatforms();
  const p = list.find((x) => /aga/i.test(x.name)) ?? null;
  return { platformId: cfg.platformId ?? p?.platformId ?? null, customerPlatformId: cfg.customerPlatformId ?? p?.customerPlatformId ?? null };
}

/* ---------- sending an order ---------- */

/** couriers want the local form: +92 300 1234567 / 923001234567 → 03001234567 */
export function localPhone(raw: string | null | undefined) {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('92') && d.length === 12) return '0' + d.slice(2);
  if (d.startsWith('3') && d.length === 10) return '0' + d;
  return d;
}

/**
 * One Orio order for one site order. Each piece is its own line (quantity 1), so the amount is
 * clear whether Orio reads it per piece or per line; a coupon discount is spread over the
 * lines so the lines + shipping always add up to what the customer pays (the COD amount).
 */
export async function orioPayload(order: OrderDoc, cityId: number, platform: { platformId: number | null; customerPlatformId: number | null }) {
  const { acno, userId } = orioConfig();
  const products = await Product.find({ _id: { $in: order.items.map((i) => i.product_id) } }).select('name').lean();
  const names = new Map(products.map((p) => [p._id, p.name]));
  const pieces: { product_name: string; quantity: number; amount: number }[] = [];
  for (const it of order.items) {
    const name = `${names.get(it.product_id) ?? `Product #${it.product_id}`}${it.variant_label ? ` (${it.variant_label})` : ''}`;
    for (let n = 0; n < Math.max(1, Number(it.quantity) || 1); n++) pieces.push({ product_name: name, quantity: 1, amount: Number(it.price) || 0 });
  }
  const shipping = Math.round(Number(order.shipping) || 0);
  const goods = Math.max(0, Math.round(Number(order.total) || 0) - shipping);
  const listed = pieces.reduce((a, p) => a + p.amount, 0);
  if (listed > 0 && listed !== goods) {
    let left = goods;
    pieces.forEach((p, i) => {
      p.amount = i === pieces.length - 1 ? left : Math.round((p.amount / listed) * goods);
      left -= p.amount;
    });
  }
  const isCod = (order.payment_method ?? 'cod') === 'cod';
  return {
    acno,
    user_id: userId,
    orders: [{
      consignee_name: order.shipping_name ?? '',
      consignee_address: [order.shipping_address, order.shipping_villa].filter(Boolean).join(', '),
      consignee_email: order.shipping_email ?? '',
      consignee_contact: localPhone(order.shipping_phone),
      destination_city_id: cityId,
      order_ref: `#AGA-${order._id}`,
      ...(platform.platformId ? { platform_id: platform.platformId } : {}),
      ...(platform.customerPlatformId ? { customer_platform_id: platform.customerPlatformId } : {}),
      payment_method_id: isCod ? 1 : 2, // 1 = cash on delivery (the docs sample); the site only takes COD today
      remarks: order.order_notes ?? '',
      shipping_charges: shipping,
      line_items: pieces,
    }],
  };
}

/** the Orio order id out of the create reply, if it gives one */
function createdId(json: unknown): string | null {
  const find = (o: unknown, depth: number): unknown => {
    if (!o || typeof o !== 'object' || depth > 4) return undefined;
    if (Array.isArray(o)) { for (const x of o) { const f = find(x, depth + 1); if (f !== undefined) return f; } return undefined; }
    const r = o as Record<string, unknown>;
    const direct = pick(r, ['order_id', 'orio_order_id', 'id', 'order_no', 'tracking_number', 'cn']);
    if (direct !== undefined && (typeof direct === 'string' || typeof direct === 'number')) return direct;
    for (const v of Object.values(r)) { const f = find(v, depth + 1); if (f !== undefined) return f; }
    return undefined;
  };
  const id = find(json, 0);
  return id === undefined ? null : String(id);
}

export interface OrioSendResult { ok: boolean; message: string; orioId?: string | null; reply?: OrioReply }

/** Send one order. `cityId` overrides the automatic city match. Already-sent orders are not sent twice. */
export async function sendOrderToOrio(orderId: number, opts: { cityId?: number | null; force?: boolean } = {}): Promise<OrioSendResult> {
  await connectDb();
  const order = await Order.findById(orderId).lean();
  if (!order) return { ok: false, message: 'Order not found.' };
  if (order.orio_sent_at && !opts.force) return { ok: true, message: 'Already sent to Orio.', orioId: order.orio_order_id ?? null };
  if (!orioConfigured()) return { ok: false, message: 'ORIO_API_KEY is not set in Vercel.' };
  const fail = async (message: string, reply?: OrioReply) => {
    await Order.updateOne({ _id: orderId }, { $set: { orio_error: message.slice(0, 500) } }, { timestamps: false });
    return { ok: false, message, reply };
  };

  let cityId = opts.cityId ?? null;
  if (!cityId) {
    const { list } = await orioCities();
    if (!list.length) return fail('Could not load the city list from Orio.');
    const m = matchCity(order.shipping_city, list);
    if (!m) return fail(`City "${order.shipping_city ?? ''}" not found in Orio's list: pick it by hand and send again.`);
    cityId = m.id;
  }
  const platform = await orioStorePlatform();
  const reply = await orioPost('/v2/order/bulk-create', await orioPayload(order, cityId, platform));
  if (!reply.ok) return fail(replyMessage(reply), reply);
  const orioId = createdId(reply.json);
  await Order.updateOne({ _id: orderId }, { $set: { orio_order_id: orioId, orio_sent_at: new Date(), orio_error: null } }, { timestamps: false });
  return { ok: true, message: 'Sent to Orio.', orioId, reply };
}
