import 'server-only';
import mongoose, { type ClientSession } from 'mongoose';
import { dbDecimal, laravelDirty, recordAudit } from '@/lib/admin/audit';
import { str, type FormInput } from '@/lib/admin/form';
import { Paginator, asset, carbonize, collect, number_format } from '@/lib/admin/php';
import { connectDb } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { AffiliateCommission } from '@/models/Affiliate';
import { CompanySetting } from '@/models/content';
import { nextId } from '@/models/Counter';
import { CI, Customer } from '@/models/Customer';
import { Order, variantLabelFor, type OrderItem } from '@/models/Order';
import { Product } from '@/models/Product';
import { customersById, orderModel, orderModels, pageParam, productsById } from './models';
import { giveBack, StockError, takeStock } from './stock';

/* eslint-disable @typescript-eslint/no-explicit-any */

const PK_ZONE_MAP: Record<string, string[]> = {
  karachi: ['Karachi'],
  lahore: ['Lahore'],
  islamabad: ['Islamabad', 'Rawalpindi'],
  other_major: ['Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan',
    'Sukkur', 'Larkana', 'Rahim Yar Khan', 'Sheikhupura', 'Jhang', 'Dera Ghazi Khan', 'Gujrat', 'Kasur', 'Okara', 'Sahiwal',
    'Chiniot', 'Khanewal', 'Mianwali', 'Attock', 'Nowshera', 'Charsadda', 'Swat'],
  remote: ['Muzaffarabad', 'Mirpur', 'Gilgit'],
};

async function shippingConfig() {
  const c = await CompanySetting.findOne().sort({ _id: 1 }).select('shipping_charges shipping_mode').lean();
  return { config: (c?.shipping_charges ?? {}) as Record<string, number>, mode: c?.shipping_mode ?? 'flat' };
}

async function buildShippingRateMap() {
  const { config, mode } = await shippingConfig();
  const map: Record<string, number> = {};
  for (const [zone, cities] of Object.entries(PK_ZONE_MAP)) {
    const rate = Number(mode === 'flat' ? config.rest_of_pakistan ?? 0 : config[zone] ?? config.rest_of_pakistan ?? 0);
    for (const city of cities) map[city] = rate;
  }
  return map;
}

/** getSellables(): products without sizes, then every size of an active product (url needs the view's request) */
async function getSellables() {
  const fallback = asset('adminlte/dist/img/boxed-bg.jpg');
  const img = (p: any) => {
    const m = p.images?.find((i: any) => i.is_primary);
    return m?.image_path ? mediaUrl(m.image_path) : fallback;
  };
  const active = await Product.find({ status: 'active' }).sort({ _id: 1 }).lean();
  const products = active.filter((p) => p.variants.length === 0).map((p) => {
    const price = Number(p.price ?? 0);
    return { id: p._id, type: 'product', name: p.name, sku: p.sku ?? '', price, image_url: img(p), label: p.name + (p.sku ? ` — SKU: ${p.sku}` : '') + ' — PKR ' + number_format(price, 2) };
  });
  const variants = active.flatMap((p) => p.variants.map((v) => ({ v, p }))).sort((a, b) => a.v._id - b.v._id).map(({ v, p }) => {
    const price = Number(v.price || p.price || 0);
    const opts = Object.values(v.option_values ?? {});
    const optionsLabel = opts.length ? ` (${opts.join(', ')})` : '';
    return { id: v._id, type: 'variant', name: p.name + optionsLabel, sku: v.sku ?? '', price, image_url: img(p), label: p.name + optionsLabel + (v.sku ? ` — SKU: ${v.sku}` : '') + ' — PKR ' + number_format(price, 2) };
  });
  return collect([...products, ...variants]);
}

/** AdminCustomOrderController::index */
export async function customOrderIndexData(url: URL) {
  await connectDb();
  const q = (url.searchParams.get('q') ?? '').trim();
  const f: Record<string, unknown> = {};
  if (q !== '') {
    const or: Record<string, unknown>[] = [];
    if (/^\s*[+-]?(\d+\.?\d*|\.\d+)\s*$/.test(q)) or.push({ _id: Math.trunc(Number(q)) });
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const ids = (await Customer.find({ $or: [{ full_name: rx }, { phone: rx }] }).select('_id').lean()).map((c) => c._id);
    or.push({ customer_id: { $in: ids } });
    f.$or = or;
  }
  const perPage = 20;
  const page = pageParam(url);
  const [total, rows, pendingCount, completedCount] = await Promise.all([
    Order.countDocuments(f),
    Order.find(f).sort({ _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'completed' }),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = await Order.countDocuments({ $expr: { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, today] } });
  const orders = await orderModels(rows);
  return { orders: Paginator.make(orders, total, perPage, page).withQueryString(), q, pendingCount, todayCount, completedCount };
}

/** AdminCustomOrderController::create */
export async function customOrderCreateData() {
  await connectDb();
  const customers = await Customer.find().select('full_name phone email address city villa_apartment').sort({ full_name: 1, _id: 1 }).collation(CI).lean();
  const { config } = await shippingConfig();
  return { customers: collect(customers.map(carbonize)), sellables: await getSellables(), shippingRateMap: await buildShippingRateMap(), defaultShipping: Number(config.rest_of_pakistan ?? 0) };
}

/** AdminCustomOrderController::edit (null = 404, 'forbidden' = 403) */
export async function customOrderEditData(id: number) {
  await connectDb();
  const o = await Order.findById(id).lean();
  if (!o) return null;
  if (o.status !== 'pending') return 'forbidden' as const;
  const [customers, products] = await Promise.all([customersById([o.customer_id]), productsById(o.items.map((i) => i.product_id))]);
  const order = orderModel(o, customers.get(o.customer_id), products);
  const sellables = await getSellables();
  const fallbackImg = asset('adminlte/dist/img/boxed-bg.jpg');
  const existingItems = collect(o.items.map((item) => {
    const s = sellables.first((x: any) => (item.variant_id ? x.type === 'variant' && x.id === item.variant_id : x.type === 'product' && x.id === item.product_id));
    return { type: item.variant_id ? 'variant' : 'product', id: item.variant_id ?? item.product_id, qty: item.quantity, unit: Number(item.price), name: s?.name ?? products.get(item.product_id)?.name ?? 'Item', sku: s?.sku ?? '', img: s?.image_url ?? fallbackImg };
  }));
  const { config } = await shippingConfig();
  return { order, sellables, existingItems, shippingRateMap: await buildShippingRateMap(), defaultShipping: Number(config.rest_of_pakistan ?? 0), fallbackImg };
}

export const storeRules = {
  customer_id: ['nullable', { name: 'exists', test: async (v: unknown) => !!(await Customer.exists({ _id: Number(v) })) }],
  'customer.full_name': 'required_without:customer_id|string|max:255',
  'customer.phone': 'required_without:customer_id|string|max:20',
  'customer.email': 'nullable|email|max:255',
  payment_method: 'required|in:cod',
  items: 'required|array|min:1',
  'items.*.type': 'required|in:product,variant',
  'items.*.id': 'required|integer',
  'items.*.qty': 'required|integer|min:1',
  discount: 'nullable|numeric|min:0',
  shipping: 'required|numeric|min:0',
  'shipping_address.full_name': 'required|string|max:255',
  'shipping_address.phone': 'required|string|max:20',
  'shipping_address.address': 'required|string',
  'shipping_address.city': 'nullable|string|max:100',
  'shipping_address.villa_apartment': 'nullable|string|max:255',
  order_notes: 'nullable|string|max:1000',
};

export const updateRules = {
  items: 'required|array|min:1',
  'items.*.type': 'required|in:product,variant',
  'items.*.id': 'required|integer',
  'items.*.qty': 'required|integer|min:1',
  discount: 'nullable|numeric|min:0',
  shipping: 'required|numeric|min:0',
  order_notes: 'nullable|string|max:1000',
  'shipping_address.full_name': 'required|string|max:255',
  'shipping_address.phone': 'required|string|max:20',
  'shipping_address.address': 'required|string',
  'shipping_address.city': 'nullable|string|max:100',
  'shipping_address.villa_apartment': 'nullable|string|max:255',
};

/** +923XXXXXXXXX like checkout; anything else is kept as typed */
export function normalisePhone(phone: string) {
  let d = phone.replace(/\D+/g, '');
  if (d.length === 12 && d.startsWith('92')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? '+92' + d : phone.trim();
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export class ItemError extends Error { constructor(readonly field: string, message: string) { super(message); } }

/** createItems(): order lines with stock taken; keepPrices keeps the agreed price of old lines */
async function createItems(rows: any[], keepPrices: Record<string, number>, session: ClientSession) {
  const items: OrderItem[] = [];
  let subtotal = 0;
  const now = new Date();
  for (const [idx, row] of rows.entries()) {
    const qty = parseInt(String(row.qty), 10);
    if (row.type === 'product') {
      const p = await Product.findById(Number(row.id)).session(session).lean();
      if (!p) throw new ItemError(`items.${idx}.id`, 'Invalid product');
      const price = Number(keepPrices[`product:${p._id}`] ?? p.price ?? 0);
      await takeStock(p._id, null, qty, p.name, session);
      items.push({ _id: await nextId('order_items', session), product_id: p._id, variant_id: null, variant_label: null, quantity: qty, price, total: price * qty, stock_adjusted: true, created_at: now });
      subtotal += price * qty;
    } else {
      const p = await Product.findOne({ 'variants._id': Number(row.id) }).session(session).lean();
      const v = p?.variants.find((x) => x._id === Number(row.id));
      if (!p || !v) throw new ItemError(`items.${idx}.id`, 'Invalid variant');
      const price = Number(keepPrices[`variant:${v._id}`] ?? (v.price || p.price || 0));
      const label = `${p.name ?? 'Item'} ${Object.values(v.option_values ?? {}).map(String).join(' ')}`.trim();
      await takeStock(p._id, v._id, qty, label, session);
      items.push({ _id: await nextId('order_items', session), product_id: p._id, variant_id: v._id, variant_label: variantLabelFor(v.option_values), quantity: qty, price, total: price * qty, stock_adjusted: true, created_at: now });
      subtotal += price * qty;
    }
  }
  return { items, subtotal };
}

const rowsOf = (input: FormInput) => Object.values((input.items ?? {}) as Record<string, any>);
const ship = (input: FormInput, k: string) => str(input, `shipping_address.${k}`);

/** AdminCustomOrderController::store → { id } or { error } (stock) or { field errors } */
export async function storeCustomOrder(input: FormInput, req: Request, adminId: number): Promise<{ id?: number; error?: string; errors?: Record<string, string[]> }> {
  const discountIn = round2(Number(str(input, 'discount') ?? 0));
  const shipping = round2(Number(str(input, 'shipping') ?? 0));
  const session = await mongoose.startSession();
  let orderId = 0;
  let audits: Parameters<typeof recordAudit>[0][] = [];
  try {
    await session.withTransaction(async () => {
      audits = [];
      let customer: any;
      const cid = str(input, 'customer_id');
      if (cid) customer = await Customer.findById(Number(cid)).session(session).lean();
      else {
        const phone = normalisePhone(str(input, 'customer.phone') ?? '');
        const email = str(input, 'customer.email') ? str(input, 'customer.email')!.trim().toLowerCase() : null;
        customer = (await Customer.findOne({ phone }).session(session).lean()) ?? (email ? await Customer.findOne({ email }).collation(CI).session(session).lean() : null);
        if (!customer) {
          const id = await nextId('customers', session);
          const now = new Date();
          await Customer.create([{ _id: id, full_name: str(input, 'customer.full_name')!, phone, email: email as unknown as string, country: 'PK', created_at: now, updated_at: now }], { session, timestamps: false });
          customer = { _id: id, email };
        }
      }
      const { items, subtotal: raw } = await createItems(rowsOf(input), {}, session);
      const subtotal = round2(raw);
      const discount = Math.min(discountIn, subtotal + shipping);
      const total = round2(Math.max(0, subtotal + shipping - discount));
      orderId = await nextId('orders', session);
      const now = new Date();
      const attrs = {
        customer_id: customer._id, subtotal: 0, shipping, discount: 0, total: 0, status: 'pending', payment_method: str(input, 'payment_method'),
        order_notes: str(input, 'order_notes'), shipping_name: ship(input, 'full_name'), shipping_phone: normalisePhone(ship(input, 'phone') ?? ''),
        shipping_email: str(input, 'customer.email') ? str(input, 'customer.email')!.trim().toLowerCase() : customer.email ?? null,
        shipping_address: ship(input, 'address'), shipping_city: ship(input, 'city'), shipping_villa: ship(input, 'villa_apartment'),
      };
      await Order.create([{ _id: orderId, ...attrs, subtotal, discount, total, items, created_at: now, updated_at: now } as any], { session, timestamps: false });
      audits.push({ event: 'created', type: 'App\\Models\\Order', id: orderId, new: { ...attrs, id: orderId } });
      for (const it of items) audits.push({ event: 'created', type: 'App\\Models\\OrderItem', id: it._id, new: { order_id: orderId, product_id: it.product_id, ...(it.variant_id ? { variant_id: it.variant_id, variant_label: it.variant_label } : {}), quantity: it.quantity, price: it.price, total: it.total, stock_adjusted: true, id: it._id } });
      audits.push({ event: 'updated', type: 'App\\Models\\Order', id: orderId, old: { subtotal: 0, discount: 0, total: 0 }, new: { subtotal, discount, total } });
    });
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    if (e instanceof ItemError) return { errors: { [e.field]: [e.message] } };
    throw e;
  } finally {
    await session.endSession();
  }
  for (const a of audits) await recordAudit({ ...a, userId: adminId, req });
  return { id: orderId };
}

/** AdminCustomOrderController::update */
export async function updateCustomOrder(id: number, input: FormInput, req: Request, adminId: number): Promise<{ ok?: true; error?: string; errors?: Record<string, string[]> }> {
  const discountIn = round2(Number(str(input, 'discount') ?? 0));
  const shipping = round2(Number(str(input, 'shipping') ?? 0));
  const session = await mongoose.startSession();
  let before: any = null;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session).lean();
      before = order;
      if (!order) throw new StockError('Only pending orders can be edited.');
      if (order.status !== 'pending') throw new StockError('Only pending orders can be edited.');
      const keep: Record<string, number> = {};
      for (const item of order.items) {
        keep[item.variant_id ? `variant:${item.variant_id}` : `product:${item.product_id}`] = Number(item.price);
        await giveBack(order._id, item, session);
      }
      const { items, subtotal: raw } = await createItems(rowsOf(input), keep, session);
      const subtotal = round2(raw);
      const discount = Math.min(discountIn, subtotal + shipping);
      const total = round2(Math.max(0, subtotal + shipping - discount));
      await Order.updateOne({ _id: id }, {
        $set: {
          items, subtotal, shipping, discount, total, order_notes: str(input, 'order_notes') ?? order.order_notes,
          shipping_name: ship(input, 'full_name'), shipping_phone: normalisePhone(ship(input, 'phone') ?? ''), shipping_address: ship(input, 'address'),
          shipping_city: ship(input, 'city'), shipping_villa: ship(input, 'villa_apartment'), updated_at: new Date(),
        },
      }, { session, timestamps: false });
      const c = await AffiliateCommission.findOne({ order_id: id }).session(session).lean();
      if (c && c.status === 'pending') {
        const base = Math.max(0, subtotal - discount);
        await AffiliateCommission.updateOne({ _id: c._id }, { $set: { base_amount: base, commission_amount: round2(base * Number(c.rate_used) / 100) } }, { session });
      }
    });
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    if (e instanceof ItemError) return { errors: { [e.field]: [e.message] } };
    throw e;
  } finally {
    await session.endSession();
  }
  const after = await Order.findById(id).lean();
  // Column order, MySQL's values against the ones the PHP set (DECIMAL "250.00" vs 250 counts as a change)
  const columns = ['subtotal', 'shipping', 'discount', 'total', 'shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city', 'shipping_villa', 'order_notes'];
  const money = ['subtotal', 'shipping', 'discount', 'total'];
  const dbRow = Object.fromEntries(columns.map((f) => [f, money.includes(f) ? dbDecimal(before?.[f]) : before?.[f] ?? null]));
  const newRow = Object.fromEntries(columns.map((f) => [f, after?.[f as keyof typeof after] ?? null]));
  const d = laravelDirty(dbRow, newRow, columns);
  // the new order lines (the old ones were removed with a plain query: no audit rows, as before)
  for (const it of after?.items ?? []) {
    await recordAudit({ event: 'created', type: 'App\\Models\\OrderItem', id: it._id, userId: adminId, req, new: {
      order_id: id, product_id: it.product_id, ...(it.variant_id ? { variant_id: it.variant_id, variant_label: it.variant_label } : {}),
      quantity: it.quantity, price: it.price, total: it.total, stock_adjusted: true, id: it._id,
    } });
  }
  if (d.changed) await recordAudit({ event: 'updated', type: 'App\\Models\\Order', id, old: d.old, new: d.new, userId: adminId, req });
  return { ok: true };
}
