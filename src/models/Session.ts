import mongoose, { Schema, type Model } from 'mongoose';

export interface CartLine {
  variant_id: number | null;
  product_id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  variant_options: Record<string, string>;
}

export interface SessionCoupon {
  code: string;
  amount: number;
  type: 'fixed' | 'percentage';
  id: number;
  valid_until: string | null;
}

export interface SessionData {
  cart?: Record<string, CartLine>;
  coupon?: SessionCoupon;
  /** "Buy it now": the one item being bought straight away, kept apart from the bag */
  buy_now?: Record<string, CartLine>;
  /** The order just placed with Buy it now: its thank-you page must leave the bag alone */
  buy_now_order_id?: number;
  /** Orders this browser placed: only they (or the owner) may open the thank-you page */
  zq_order_access?: number[];
  just_purchased_order_id?: number;
}

export interface SessionDoc {
  _id: string; // sha256 of the cookie value, so a database leak does not expose live sessions
  customer_id?: number | null;
  admin_id?: number | null; // signed-in admin (Laravel web guard)
  data: SessionData;
  expires_at: Date;
}

const SessionSchema = new Schema<SessionDoc>(
  {
    _id: String,
    customer_id: Number,
    admin_id: Number,
    data: { type: Schema.Types.Mixed, default: {} },
    expires_at: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);
SessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) || mongoose.model<SessionDoc>('Session', SessionSchema, 'sessions');

// Fixed-window request counters for the throttles the Laravel routes had
export interface RateLimitDoc {
  _id: string;
  count: number;
  expires_at: Date;
}
const RateLimitSchema = new Schema<RateLimitDoc>(
  { _id: String, count: { type: Number, default: 0 }, expires_at: { type: Date, required: true } },
  { versionKey: false },
);
RateLimitSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
export const RateLimit: Model<RateLimitDoc> =
  (mongoose.models.RateLimit as Model<RateLimitDoc>) || mongoose.model<RateLimitDoc>('RateLimit', RateLimitSchema, 'rate_limits');
