import 'server-only';
import mongoose from 'mongoose';
import { recordAudit } from '@/lib/admin/audit';
import { Paginator, carbonize, collect, withView, type ViewRequest } from '@/lib/admin/php';
import { connectDb } from '@/lib/db';
import { sendMail } from '@/lib/mail';
import { AffiliateCommission } from '@/models/Affiliate';
import { Category } from '@/models/Category';
import { Customer } from '@/models/Customer';
import { Order, type OrderDoc, type OrderStatus } from '@/models/Order';
import { Product } from '@/models/Product';
import statusMail from '@/admin-views/emails/order-status-update';
import { loadCompanySetting } from '@/lib/admin/layout';
import { customersById, like, orderModel, orderModels, pageParam, productsById } from './models';
import { giveBack } from './stock';

const KARACHI = 5 * 60 * 60 * 1000;

/** HomeController::orderIndex */
export async function orderIndexData(url: URL) {
  await connectDb();
  const q = url.searchParams;
  const categories = collect((await Category.find().sort({ _id: 1 }).lean()).map(carbonize));
  const search = (q.get('search') ?? '').trim();
  const status = q.get('status');
  const from = q.get('from');
  const to = q.get('to');
  const category = q.get('category');

  const and: Record<string, unknown>[] = [];
  if (search !== '') {
    const or: Record<string, unknown>[] = [];
    const num = search.replace(/^#+/, '');
    if (/^\d+$/.test(num)) or.push({ _id: Number(num) });
    const rx = like(search);
    const custIds = (await Customer.find({ $or: [{ full_name: rx }, { email: rx }, { phone: rx }, { city: rx }] }).select('_id').lean()).map((c) => c._id);
    if (custIds.length) or.push({ customer_id: { $in: custIds } });
    or.push({ coupon_code: rx }, { shipping_name: rx }, { shipping_phone: rx }, { shipping_email: rx }, { shipping_city: rx });
    const digits = search.replace(/\D+/g, '');
    if (digits.length >= 7) {
      const tail = like(digits.slice(-10));
      or.push({ shipping_phone: tail });
      const byPhone = (await Customer.find({ phone: tail }).select('_id').lean()).map((c) => c._id);
      if (byPhone.length) or.push({ customer_id: { $in: byPhone } });
    }
    and.push({ $or: or });
  }
  if (status && status !== 'all') and.push({ status });
  if (from || to) {
    // dates are Pakistan days
    const day = (s: string) => { const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) - KARACHI : NaN; };
    const start = day((from || to)!);
    const end = day((to || from)!) + 86400000 - 1;
    if (!Number.isNaN(start) && !Number.isNaN(end)) and.push({ created_at: { $gte: new Date(start), $lte: new Date(end) } });
  }
  if (category && category !== 'all') {
    const productIds = (await Product.find({ category_ids: Number(category) }).select('_id').lean()).map((p) => p._id);
    and.push({ 'items.product_id': { $in: productIds } });
  }
  const filter = and.length ? { $and: and } : {};
  const count = (s: OrderStatus) => Order.countDocuments({ $and: [...and, { status: s }] });
  const [pending, processing, completed, cancelled, total] = await Promise.all([count('pending'), count('processing'), count('completed'), count('cancelled'), Order.countDocuments(filter)]);
  const summary = { pending, processing, shipped: 0, completed, cancelled };

  const perPage = 50;
  const page = pageParam(url);
  const rows = await Order.find(filter).sort({ created_at: -1, _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean();
  const orders = Paginator.make(await orderModels(rows), total, perPage, page).withQueryString();
  return { orders, summary, categories };
}

/** HomeController::showOrder */
export async function orderShowData(id: number) {
  await connectDb();
  const o = await Order.findById(id).lean();
  if (!o) return null;
  const [customers, products] = await Promise.all([customersById([o.customer_id]), productsById(o.items.map((i) => i.product_id))]);
  return { order: orderModel(o, customers.get(o.customer_id), products) };
}

const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'completed', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** OrderStatusUpdateMail */
export async function sendStatusMail(order: OrderDoc, origin: string) {
  const [customers, products] = await Promise.all([customersById([order.customer_id]), productsById(order.items.map((i) => i.product_id))]);
  const model = orderModel(order, customers.get(order.customer_id), products);
  if (!model.contact_email) return;
  const companySetting = await loadCompanySetting();
  const ctx: ViewRequest = { origin, path: '/', query: new URLSearchParams(), routeName: '', old: {}, hasOld: false, errors: {}, flash: {}, csrf: '', user: null, companySetting, stack: [] };
  const body = withView(ctx, () => statusMail({ order: model, companySetting }).content.value);
  try {
    await sendMail({ to: model.contact_email, subject: `Your Order #${order._id} is now ${order.status}`, html: body });
  } catch (e) {
    console.warn('Order status email failed: ' + (e as Error).message);
  }
}

/** HomeController::updateStatus (JSON) */
export async function updateOrderStatus(id: number, newStatus: string, req: Request, adminId: number): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!['pending', 'processing', 'completed', 'cancelled'].includes(newStatus)) {
    return { status: 422, body: { success: false, message: `Invalid status '${newStatus}'.` } };
  }
  await connectDb();
  const session = await mongoose.startSession();
  let result: { ok: boolean; message?: string; changed?: boolean; prev?: string } = { ok: false };
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session).lean();
      if (!order) throw Object.assign(new Error(`No query results for model [App\\Models\\Order] ${id}`), { notFound: true });
      const prev = order.status;
      if (prev === newStatus) { result = { ok: true, changed: false }; return; }
      if (!ALLOWED_NEXT[prev].includes(newStatus as OrderStatus)) {
        result = { ok: false, message: prev === 'cancelled' ? 'Cannot update status. This order is already cancelled.' : `Cannot change an order from ${prev} to ${newStatus}.` };
        return;
      }
      if (newStatus === 'cancelled') for (const item of order.items) await giveBack(order._id, item, session);
      await Order.updateOne({ _id: id }, { $set: { status: newStatus, updated_at: new Date() } }, { session, timestamps: false });

      const commission = await AffiliateCommission.findOne({ order_id: id }).session(session).lean();
      if (commission && commission.status === 'pending') {
        if (newStatus === 'completed') await AffiliateCommission.updateOne({ _id: commission._id }, { $set: { status: 'available', available_at: new Date() } }, { session });
        else if (newStatus === 'cancelled') await AffiliateCommission.updateOne({ _id: commission._id }, { $set: { status: 'cancelled', cancelled_at: new Date() } }, { session });
      }
      result = { ok: true, changed: true, prev };
    });
  } catch (e) {
    if ((e as { notFound?: boolean }).notFound) return { status: 500, body: { success: false, message: 'Server error: ' + (e as Error).message } };
    console.error('Order updateStatus failed: ' + (e as Error).message);
    return { status: 500, body: { success: false, message: 'Server error: ' + (e as Error).message } };
  } finally {
    await session.endSession();
  }
  if (!result.ok) return { status: 200, body: { success: false, message: result.message } };
  if (!result.changed) return { status: 200, body: { success: true } };

  await recordAudit({ event: 'updated', type: 'App\\Models\\Order', id, old: { status: result.prev }, new: { status: newStatus }, userId: adminId, req });
  const order = await Order.findById(id).lean();
  if (order) await sendStatusMail(order, new URL(req.url).origin);
  return { status: 200, body: { success: true } };
}

/** HomeController::customerIndex */
export async function customerIndexData(url: URL) {
  await connectDb();
  const perPage = 20;
  const page = pageParam(url);
  const [total, rows] = await Promise.all([
    Customer.countDocuments(),
    Customer.find().sort({ created_at: -1, _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  return { customers: Paginator.make(rows.map(carbonize), total, perPage, page) };
}

/** HomeController::customerShow */
export async function customerShowData(id: number) {
  await connectDb();
  const customer = await Customer.findById(id).lean();
  if (!customer) return null;
  const orders = await Order.find({ customer_id: id }).sort({ created_at: -1, _id: -1 }).lean();
  return { customer: carbonize(customer), orders: collect(orders.map(carbonize)) };
}

/** HomeController::audits */
export async function auditsData(url: URL) {
  await connectDb();
  const { Audit, User } = await import('@/models/User');
  const perPage = 20;
  const page = pageParam(url);
  const [total, rows] = await Promise.all([Audit.estimatedDocumentCount(), Audit.find().sort({ _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean()]);
  const userIds = rows.filter((r) => r.user_type === 'App\\Models\\User' && r.user_id).map((r) => r.user_id!);
  const custIds = rows.filter((r) => r.user_type === 'App\\Models\\Customer' && r.user_id).map((r) => r.user_id!);
  const [users, custs] = await Promise.all([
    userIds.length ? User.find({ _id: { $in: userIds } }).select('name email').lean() : [],
    custIds.length ? Customer.find({ _id: { $in: custIds } }).select('full_name email').lean() : [],
  ]);
  const parse = (s: string | null) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
  const audits = rows.map((r) => {
    const doc = carbonize({ ...r, old_values: null, new_values: null });
    doc.old_values = parse(r.old_values);
    doc.new_values = parse(r.new_values);
    doc.user = r.user_type === 'App\\Models\\User' ? users.find((u) => u._id === r.user_id) ?? null
      : r.user_type === 'App\\Models\\Customer' ? custs.find((c) => c._id === r.user_id) ?? null : null;
    return doc;
  });
  return { audits: Paginator.make(audits, total, perPage, page) };
}
