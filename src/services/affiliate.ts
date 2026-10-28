import 'server-only';
import { randomInt } from 'node:crypto';
import mongoose from 'mongoose';
import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { Affiliate, AffiliateCommission, AffiliateWithdrawal, type AffiliateDoc } from '@/models/Affiliate';
import { nextId } from '@/models/Counter';
import { Order } from '@/models/Order';
import { brandInitials } from '@/lib/format';
import { getCompanySetting } from './settings';

/** Affiliate::effectiveRate() */
export async function effectiveRate(a: Pick<AffiliateDoc, 'commission_rate'>): Promise<number> {
  if (a.commission_rate != null) return Number(a.commission_rate);
  return Number((await getCompanySetting())?.affiliate_default_rate ?? 8);
}

async function sumCommissions(affiliateId: number, filter: Record<string, unknown>): Promise<number> {
  const [r] = await AffiliateCommission.aggregate<{ s: number }>([
    { $match: { affiliate_id: affiliateId, ...filter } },
    { $group: { _id: null, s: { $sum: '$commission_amount' } } },
  ]);
  return Number(r?.s ?? 0);
}

/** totalEarned / pendingAmount / availableAmount / paidAmount from the Affiliate model */
export async function affiliateTotals(affiliateId: number) {
  await connectDb();
  const [totalEarned, pending, available, paid] = await Promise.all([
    sumCommissions(affiliateId, { status: { $in: ['available', 'paid'] } }),
    sumCommissions(affiliateId, { status: 'pending' }),
    // not yet reserved by a withdrawal request
    sumCommissions(affiliateId, { status: 'available', withdrawal_id: null }),
    sumCommissions(affiliateId, { status: 'paid' }),
  ]);
  return { totalEarned, pending, available, paid };
}

export const referralUrl = (code: string) => `${env.appUrl}/?ref=${code}`;

const brandPrefix = async () => brandInitials((await getCompanySetting())?.name);

/** Affiliate::generateReferralCode(): prefix + 4 chars without look-alikes (no 0/O/1/I/L) */
export async function generateReferralCode(): Promise<string> {
  await connectDb();
  const prefix = await brandPrefix();
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 50; attempt++) {
    let tail = '';
    for (let i = 0; i < 4; i++) tail += alphabet[randomInt(0, alphabet.length)];
    const code = prefix + tail;
    if (!(await Affiliate.exists({ referral_code: code }))) return code;
  }
  return prefix + randomInt(0, 0xffffff).toString(16).padStart(6, '0').slice(0, 5);
}

/** Dashboard lists: last 20 referred orders (with their commission) and withdrawals */
export async function affiliateActivity(affiliateId: number) {
  await connectDb();
  const [orders, withdrawals] = await Promise.all([
    Order.find({ affiliate_id: affiliateId }).sort({ created_at: -1, _id: 1 }).limit(20).lean(),
    AffiliateWithdrawal.find({ affiliate_id: affiliateId }).sort({ created_at: -1, _id: 1 }).limit(20).lean(),
  ]);
  const commissions = await AffiliateCommission.find({ order_id: { $in: orders.map((o) => o._id) } }).lean();
  const byOrder = new Map(commissions.map((c) => [c.order_id, c]));
  return { orders: orders.map((o) => ({ order: o, commission: byOrder.get(o._id) ?? null })), withdrawals };
}

class WithdrawError extends Error {}

/**
 * AffiliateController::requestWithdrawal — claims every free available commission for
 * one withdrawal. Done in a transaction so two quick requests cannot claim the same ones.
 */
export async function requestWithdrawal(affiliate: AffiliateDoc): Promise<string | null> {
  await connectDb();
  const minWith = Math.trunc(Number((await getCompanySetting())?.affiliate_min_withdrawal ?? 1000));
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Touch the affiliate row: concurrent requests now conflict and one is retried
      await Affiliate.updateOne({ _id: affiliate._id }, { $set: { updated_at: new Date() } }, { session });
      const free = await AffiliateCommission.find({ affiliate_id: affiliate._id, status: 'available', withdrawal_id: null }).session(session).lean();
      const available = free.reduce((s, c) => s + Number(c.commission_amount), 0);
      if (available < minWith) {
        throw new WithdrawError(`Minimum withdrawal is PKR ${minWith}. You currently have PKR ${available.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} available.`);
      }
      const id = await nextId('affiliate_withdrawals', session);
      await AffiliateWithdrawal.create([{
        _id: id,
        affiliate_id: affiliate._id,
        amount: Math.round(available * 100) / 100,
        payment_method: affiliate.payment_method,
        payment_account_number: affiliate.payment_account_number ?? '',
        payment_account_name: affiliate.payment_account_name,
        bank_name: affiliate.bank_name,
        status: 'requested',
      }], { session });
      await AffiliateCommission.updateMany(
        { _id: { $in: free.map((c) => c._id) }, withdrawal_id: null },
        { $set: { withdrawal_id: id } },
        { session },
      );
    });
    return null;
  } catch (e) {
    if (e instanceof WithdrawError) return e.message;
    throw e;
  } finally {
    await session.endSession();
  }
}
