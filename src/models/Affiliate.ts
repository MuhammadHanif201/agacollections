import mongoose, { Schema, type Model } from 'mongoose';

const ts = { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false } as const;

export interface AffiliateDoc {
  _id: number;
  customer_id?: number | null;
  full_name: string;
  phone: string;
  email?: string | null;
  payment_method: 'jazzcash' | 'easypaisa' | 'bank';
  payment_account_number?: string | null;
  payment_account_name?: string | null;
  bank_name?: string | null;
  referral_code: string;
  commission_rate?: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  admin_note?: string | null;
  approved_at?: Date | null;
  rejected_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}
const AffiliateSchema = new Schema<AffiliateDoc>(
  {
    _id: Number,
    customer_id: Number,
    full_name: { type: String, required: true },
    phone: { type: String, required: true, maxlength: 30 },
    email: String,
    payment_method: { type: String, enum: ['jazzcash', 'easypaisa', 'bank'], default: 'jazzcash' },
    payment_account_number: { type: String, maxlength: 60 },
    payment_account_name: String,
    bank_name: String,
    referral_code: { type: String, required: true, maxlength: 32 },
    commission_rate: Number,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
    admin_note: String,
    approved_at: Date,
    rejected_at: Date,
  },
  ts,
);
AffiliateSchema.index({ referral_code: 1 }, { unique: true });
AffiliateSchema.index({ status: 1 });
AffiliateSchema.index({ customer_id: 1 });
export const Affiliate: Model<AffiliateDoc> =
  (mongoose.models.Affiliate as Model<AffiliateDoc>) || mongoose.model<AffiliateDoc>('Affiliate', AffiliateSchema, 'affiliates');

export interface AffiliateCommissionDoc {
  _id: number;
  affiliate_id: number;
  order_id: number;
  rate_used: number;
  base_amount: number;
  commission_amount: number;
  status: 'pending' | 'available' | 'paid' | 'cancelled';
  available_at?: Date | null;
  paid_at?: Date | null;
  cancelled_at?: Date | null;
  withdrawal_id?: number | null;
  created_at: Date;
  updated_at: Date;
}
const AffiliateCommissionSchema = new Schema<AffiliateCommissionDoc>(
  {
    _id: Number,
    affiliate_id: { type: Number, required: true },
    order_id: { type: Number, required: true },
    rate_used: { type: Number, required: true },
    base_amount: { type: Number, required: true },
    commission_amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'available', 'paid', 'cancelled'], default: 'pending' },
    available_at: Date,
    paid_at: Date,
    cancelled_at: Date,
    withdrawal_id: Number,
  },
  ts,
);
AffiliateCommissionSchema.index({ affiliate_id: 1, status: 1 });
AffiliateCommissionSchema.index({ order_id: 1 });
export const AffiliateCommission: Model<AffiliateCommissionDoc> =
  (mongoose.models.AffiliateCommission as Model<AffiliateCommissionDoc>) ||
  mongoose.model<AffiliateCommissionDoc>('AffiliateCommission', AffiliateCommissionSchema, 'affiliate_commissions');

export interface AffiliateClickDoc {
  _id: number;
  affiliate_id: number;
  ip?: string | null;
  user_agent?: string | null;
  referrer_url?: string | null;
  landing_url?: string | null;
  created_at: Date;
}
const AffiliateClickSchema = new Schema<AffiliateClickDoc>(
  {
    _id: Number,
    affiliate_id: { type: Number, required: true },
    ip: { type: String, maxlength: 45 },
    user_agent: { type: String, maxlength: 512 },
    referrer_url: { type: String, maxlength: 1024 },
    landing_url: { type: String, maxlength: 1024 },
    created_at: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);
AffiliateClickSchema.index({ affiliate_id: 1, created_at: -1 });
export const AffiliateClick: Model<AffiliateClickDoc> =
  (mongoose.models.AffiliateClick as Model<AffiliateClickDoc>) ||
  mongoose.model<AffiliateClickDoc>('AffiliateClick', AffiliateClickSchema, 'affiliate_clicks');

export interface AffiliateWithdrawalDoc {
  _id: number;
  affiliate_id: number;
  amount: number;
  payment_method: 'jazzcash' | 'easypaisa' | 'bank';
  payment_account_number: string;
  payment_account_name?: string | null;
  bank_name?: string | null;
  status: 'requested' | 'approved' | 'paid' | 'rejected';
  admin_note?: string | null;
  transaction_ref?: string | null;
  approved_at?: Date | null;
  paid_at?: Date | null;
  rejected_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}
const AffiliateWithdrawalSchema = new Schema<AffiliateWithdrawalDoc>(
  {
    _id: Number,
    affiliate_id: { type: Number, required: true },
    amount: { type: Number, required: true },
    payment_method: { type: String, enum: ['jazzcash', 'easypaisa', 'bank'], required: true },
    payment_account_number: { type: String, required: true, maxlength: 60 },
    payment_account_name: String,
    bank_name: String,
    status: { type: String, enum: ['requested', 'approved', 'paid', 'rejected'], default: 'requested' },
    admin_note: String,
    transaction_ref: { type: String, maxlength: 120 },
    approved_at: Date,
    paid_at: Date,
    rejected_at: Date,
  },
  ts,
);
AffiliateWithdrawalSchema.index({ affiliate_id: 1, created_at: -1 });
AffiliateWithdrawalSchema.index({ status: 1 });
export const AffiliateWithdrawal: Model<AffiliateWithdrawalDoc> =
  (mongoose.models.AffiliateWithdrawal as Model<AffiliateWithdrawalDoc>) ||
  mongoose.model<AffiliateWithdrawalDoc>('AffiliateWithdrawal', AffiliateWithdrawalSchema, 'affiliate_withdrawals');

export const AFFILIATE_COOKIE = 'aff_ref';
