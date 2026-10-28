import mongoose, { Schema, type Model } from 'mongoose';

export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  _id: number;
  product_id: number;
  variant_id?: number | null;
  variant_label?: string | null;
  quantity: number;
  price: number;
  total: number;
  stock_adjusted: boolean;
  created_at?: Date;
}

export interface OrderDoc {
  _id: number;
  coupon_id?: number | null;
  affiliate_id?: number | null;
  affiliate_code?: string | null;
  customer_id: number;
  /** Placed without signing in: kept on the matching customer for the admin, never shown in that account */
  guest?: boolean;
  subtotal: number;
  shipping: number;
  discount: number;
  coupon_code?: string | null;
  total: number;
  payment_method: string;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_email?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_villa?: string | null;
  order_notes?: string | null;
  status: OrderStatus;
  items: OrderItem[];
  created_at: Date;
  updated_at: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    _id: Number,
    product_id: { type: Number, required: true },
    variant_id: Number,
    variant_label: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    stock_adjusted: { type: Boolean, default: false },
    created_at: Date,
  },
  { _id: false },
);

const OrderSchema = new Schema<OrderDoc>(
  {
    _id: Number,
    coupon_id: Number,
    affiliate_id: Number,
    affiliate_code: { type: String, maxlength: 32 },
    customer_id: { type: Number, required: true },
    guest: { type: Boolean, default: false },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 30 },
    discount: { type: Number, default: 0 },
    coupon_code: { type: String, maxlength: 50 },
    total: { type: Number, required: true },
    payment_method: { type: String, default: 'cod' },
    shipping_name: String,
    shipping_phone: { type: String, maxlength: 20 },
    shipping_email: String,
    shipping_address: String,
    shipping_city: String,
    shipping_villa: String,
    order_notes: String,
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    items: { type: [OrderItemSchema], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false },
);

OrderSchema.index({ customer_id: 1, created_at: -1 });
OrderSchema.index({ affiliate_id: 1 });
OrderSchema.index({ status: 1, created_at: -1 });
OrderSchema.index({ created_at: -1 });

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) || mongoose.model<OrderDoc>('Order', OrderSchema, 'orders');

/**
 * The orders a signed-in customer sees in their account. A guest checkout that typed someone
 * else's email or phone lands on that customer, so guest orders stay out of the account pages.
 */
export const accountOrders = (customerId: number) => ({ customer_id: customerId, guest: { $ne: true } });

/** Delivery contact for an order: what was typed at checkout, else the account (older orders). */
export function orderContact(order: OrderDoc, customer?: { full_name?: string | null; email?: string | null; phone?: string | null; address?: string | null; city?: string | null } | null) {
  return {
    name: order.shipping_name || customer?.full_name || null,
    email: order.shipping_email || customer?.email || null,
    phone: order.shipping_phone || customer?.phone || null,
    address: order.shipping_address || customer?.address || null,
    city: order.shipping_city || customer?.city || null,
  };
}

const firstUpper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// PHP ucwords(): first letter after start or whitespace only
const titleWords = (s: string) => s.replace(/(^|\s)(\S)/g, (_, sp: string, c: string) => sp + c.toUpperCase());

/** "Size: 32" or "Size: L · Colour: Black"; empty when the item has no options. */
export function variantLabelFor(optionValues: Record<string, unknown> | null | undefined): string {
  return Object.entries(optionValues ?? {})
    .map(([k, v]) => {
      const val = String(v ?? '');
      return firstUpper(k.replace(/_/g, ' ')) + ': ' + ([...val].length <= 4 ? val.toUpperCase() : titleWords(val));
    })
    .join(' · ');
}
