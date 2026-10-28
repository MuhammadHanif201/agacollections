import 'server-only';
import { randomInt } from 'node:crypto';
import mongoose from 'mongoose';
import { hashPassword } from '@/lib/auth';
import { Paginator, carbonize } from '@/lib/admin/php';
import { connectDb } from '@/lib/db';
import { Affiliate, AffiliateCommission, AffiliateWithdrawal, type AffiliateDoc } from '@/models/Affiliate';
import { CompanySetting } from '@/models/content';
import { nextId } from '@/models/Counter';
import { CI, Customer } from '@/models/Customer';
import { Order } from '@/models/Order';
import { like, pageParam } from './models';

/* eslint-disable @typescript-eslint/no-explicit-any */

async function defaultRate() {
  const s = await CompanySetting.findOne().sort({ _id: 1 }).select('affiliate_default_rate').lean();
  return Number(s?.affiliate_default_rate ?? 8);
}

/** $affiliate with the helper methods the views call */
async function affiliateModel(a: AffiliateDoc, rate: number) {
  const doc = carbonize(a);
  if (doc.commission_rate !== null && doc.commission_rate !== undefined) doc.commission_rate = Number(doc.commission_rate).toFixed(2); // decimal:2 cast
  const sums = await AffiliateCommission.aggregate<{ _id: { s: string; w: boolean }; t: number }>([
    { $match: { affiliate_id: a._id } },
    { $group: { _id: { s: '$status', w: { $gt: ['$withdrawal_id', null] } }, t: { $sum: '$commission_amount' } } },
  ]);
  const sum = (f: (r: { s: string; w: boolean }) => boolean) => sums.filter((r) => f(r._id)).reduce((s, r) => s + r.t, 0);
  doc.totalEarned = () => sum((r) => r.s === 'available' || r.s === 'paid');
  doc.pendingAmount = () => sum((r) => r.s === 'pending');
  doc.availableAmount = () => sum((r) => r.s === 'available' && !r.w);
  doc.paidAmount = () => sum((r) => r.s === 'paid');
  doc.effectiveRate = () => (a.commission_rate !== null && a.commission_rate !== undefined ? Number(a.commission_rate) : rate);
  doc.isApproved = () => a.status === 'approved';
  return doc;
}

/** AdminAffiliateController::index */
export async function affiliateIndexData(url: URL) {
  await connectDb();
  const status = url.searchParams.get('status') ?? 'all';
  const f: Record<string, unknown> = {};
  if (['pending', 'approved', 'rejected', 'suspended'].includes(status)) f.status = status;
  const search = url.searchParams.get('q');
  if (search) { const rx = like(search); f.$or = [{ full_name: rx }, { phone: rx }, { email: rx }, { referral_code: rx }]; }
  const perPage = 25;
  const page = pageParam(url);
  const [total, rows, all, pending, approved, rejected, rate] = await Promise.all([
    Affiliate.countDocuments(f),
    Affiliate.find(f).sort({ created_at: -1, _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
    Affiliate.countDocuments(), Affiliate.countDocuments({ status: 'pending' }), Affiliate.countDocuments({ status: 'approved' }), Affiliate.countDocuments({ status: 'rejected' }),
    defaultRate(),
  ]);
  const orderCounts = await Order.aggregate<{ _id: number; n: number }>([{ $match: { affiliate_id: { $in: rows.map((r) => r._id) } } }, { $group: { _id: '$affiliate_id', n: { $sum: 1 } } }]);
  const affiliates = await Promise.all(rows.map(async (a) => {
    const doc = await affiliateModel(a, rate);
    doc.orders_count = orderCounts.find((o) => o._id === a._id)?.n ?? 0;
    return doc;
  }));
  return { affiliates: Paginator.make(affiliates, total, perPage, page), status, counts: { all, pending, approved, rejected } };
}

/** AdminAffiliateController::show */
export async function affiliateShowData(id: number) {
  await connectDb();
  const a = await Affiliate.findById(id).lean();
  if (!a) return null;
  const affiliate = await affiliateModel(a, await defaultRate());
  const [customer, commissions, withdrawals] = await Promise.all([
    a.customer_id ? Customer.findById(a.customer_id).lean() : null,
    AffiliateCommission.find({ affiliate_id: id }).sort({ _id: 1 }).lean(),
    AffiliateWithdrawal.find({ affiliate_id: id }).sort({ _id: 1 }).lean(),
  ]);
  const orders = await Order.find({ _id: { $in: commissions.map((c) => c.order_id) } }).lean();
  affiliate.customer = customer ? carbonize(customer) : null;
  affiliate.commissions = carbonize(commissions).map((c: any) => ({ ...c, order: carbonize(orders.find((o) => o._id === c.order_id) ?? null) }));
  affiliate.withdrawals = carbonize(withdrawals);
  return { affiliate };
}

const now = () => new Date();

/** AdminAffiliateController::approve: returns the flash message */
export async function approveAffiliate(a: AffiliateDoc): Promise<{ error?: string; success?: string }> {
  let customer = a.customer_id ? await Customer.findById(a.customer_id).lean() : null;
  let tempPassword: string | null = null;
  let createdNew = false, linked = false;
  const set: Record<string, unknown> = {};
  if (!customer) {
    const email = String(a.email ?? '').trim();
    const phone = String(a.phone ?? '').trim();
    if (email) customer = await Customer.findOne({ email }).collation(CI).lean();
    if (!customer && phone) customer = await Customer.findOne({ phone }).lean();
    if (customer) linked = true;
    else {
      if (!email) return { error: 'Cannot approve: affiliate has no email on file. Please add an email to the affiliate record first, then try again.' };
      const letters = Array.from({ length: 4 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[randomInt(36)]).join('');
      tempPassword = letters + randomInt(1000, 10000);
      const id = await nextId('customers');
      const ts = now();
      await Customer.create([{ _id: id, full_name: a.full_name, email, phone: (phone || null) as unknown as string, password: await hashPassword(tempPassword), created_at: ts, updated_at: ts }], { timestamps: false });
      customer = (await Customer.findById(id).lean())!;
      createdNew = true;
    }
    set.customer_id = customer._id;
  }
  await Affiliate.updateOne({ _id: a._id }, { $set: { ...set, status: 'approved', approved_at: now(), rejected_at: null } });
  let msg = 'Affiliate approved.';
  if (createdNew && tempPassword) msg += ` A new customer account was created. Login email: ${customer.email} · Temporary password: ${tempPassword} — share these with the affiliate (e.g. via WhatsApp). They can change the password from their dashboard.`;
  else if (linked) msg += ` Linked to existing customer (${customer.email}). They can log in with their existing password.`;
  return { success: msg };
}

export const rejectAffiliate = (id: number, note: string | null) => Affiliate.updateOne({ _id: id }, { $set: { status: 'rejected', rejected_at: now(), admin_note: note } });
export const suspendAffiliate = (id: number) => Affiliate.updateOne({ _id: id }, { $set: { status: 'suspended' } });
export const updateAffiliate = (id: number, data: Record<string, unknown>) => Affiliate.updateOne({ _id: id }, { $set: data });

/** AdminAffiliateController::withdrawalsIndex */
export async function withdrawalIndexData(url: URL) {
  await connectDb();
  const status = url.searchParams.get('status') ?? 'all';
  const f: Record<string, unknown> = ['requested', 'approved', 'paid', 'rejected'].includes(status) ? { status } : {};
  const perPage = 25;
  const page = pageParam(url);
  const [total, rows, all, requested, approved, paid] = await Promise.all([
    AffiliateWithdrawal.countDocuments(f),
    AffiliateWithdrawal.find(f).sort({ created_at: -1, _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
    AffiliateWithdrawal.countDocuments(), AffiliateWithdrawal.countDocuments({ status: 'requested' }),
    AffiliateWithdrawal.countDocuments({ status: 'approved' }), AffiliateWithdrawal.countDocuments({ status: 'paid' }),
  ]);
  const affs = await Affiliate.find({ _id: { $in: rows.map((r) => r.affiliate_id) } }).lean();
  const withdrawals = rows.map((r) => ({ ...carbonize(r), affiliate: carbonize(affs.find((a) => a._id === r.affiliate_id) ?? null) }));
  return { withdrawals: Paginator.make(withdrawals, total, perPage, page), status, counts: { all, requested, approved, paid } };
}

export async function approveWithdrawal(id: number) {
  const w = await AffiliateWithdrawal.findById(id).lean();
  if (!w) return null;
  if (w.status !== 'requested') return { error: 'Only requested withdrawals can be approved.' };
  await AffiliateWithdrawal.updateOne({ _id: id }, { $set: { status: 'approved', approved_at: now() } });
  return { success: 'Withdrawal approved.' };
}

export async function payWithdrawal(id: number, ref: string | null) {
  const w = await AffiliateWithdrawal.findById(id).lean();
  if (!w) return null;
  if (!['requested', 'approved'].includes(w.status)) return { error: 'This withdrawal is already finalised.' };
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await AffiliateWithdrawal.updateOne({ _id: id }, { $set: { status: 'paid', paid_at: now(), transaction_ref: ref } }, { session });
      await AffiliateCommission.updateMany({ withdrawal_id: id, status: 'available' }, { $set: { status: 'paid', paid_at: now() } }, { session });
    });
  } finally { await session.endSession(); }
  return { success: 'Withdrawal marked as paid.' };
}

export async function rejectWithdrawal(id: number, note: string | null) {
  const w = await AffiliateWithdrawal.findById(id).lean();
  if (!w) return null;
  if (!['requested', 'approved'].includes(w.status)) return { error: 'This withdrawal is already finalised.' };
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await AffiliateWithdrawal.updateOne({ _id: id }, { $set: { status: 'rejected', rejected_at: now(), admin_note: note } }, { session });
      await AffiliateCommission.updateMany({ withdrawal_id: id }, { $set: { withdrawal_id: null } }, { session });
    });
  } finally { await session.endSession(); }
  return { success: 'Withdrawal rejected. Commissions released.' };
}
