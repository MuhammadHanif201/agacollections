import 'server-only';
import { connectDb } from '@/lib/db';
import { numberFormat, wallClock } from '@/lib/format';
import { Coupon, type CouponDoc } from '@/models/content';
import { Product } from '@/models/Product';
import type { CartLine, SessionCoupon, SessionData } from '@/models/Session';
import { cartSubtotal, round2 } from './pricing';

type Result = { status: string; message?: string; [k: string]: unknown };

/** Coupon::isExpired(): valid_until is Pakistan wall-clock time as the admin typed it */
export const couponExpired = (c: Pick<CouponDoc, 'valid_until'>) => Boolean(c.valid_until && c.valid_until < wallClock('Asia/Karachi'));
export const couponUsedUp = (c: Pick<CouponDoc, 'max_uses' | 'used_count'>) => c.max_uses != null && (c.used_count ?? 0) >= c.max_uses;

/** "d-m-Y h:i A" of the stored wall-clock expiry */
function couponExpiryLabel(c: Pick<CouponDoc, 'valid_until'>): string | null {
  if (!c.valid_until) return null;
  const m = c.valid_until.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[4]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${m[3]}-${m[2]}-${m[1]} ${String(h12).padStart(2, '0')}:${m[5]} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * CartController::recalculateCouponDiscount — re-price the coupon for the current bag,
 * dropping it (with a message for the next page) when it is gone, expired or used up.
 */
export async function recalculateCoupon(data: SessionData): Promise<string | null> {
  const coupon = data.coupon;
  if (!coupon?.id || !coupon.code) return null;
  await connectDb();
  const model = await Coupon.findById(coupon.id).lean();
  if (!model) { delete data.coupon; return 'Coupon is invalid or expired. Please try again.'; }
  if (couponExpired(model)) { delete data.coupon; return 'Coupon is expired.'; }
  if (couponUsedUp(model)) { delete data.coupon; return 'Coupon usage limit reached.'; }
  const subtotal = cartSubtotal(data.cart);
  let discount = 0;
  if (model.type === 'fixed') discount = Math.min(model.discount, subtotal);
  else if (model.type === 'percentage') discount = round2(subtotal * (model.discount / 100));
  data.coupon = { code: model.code, amount: discount, type: model.type, id: model._id, valid_until: couponExpiryLabel(model) };
  return null;
}

const isIntLike = (v: unknown) => v === null || v === undefined || v === '' || (/^-?\d+$/.test(String(v)) && typeof v !== 'object');

export async function addToCart(data: SessionData, input: { product_id?: unknown; variant_id?: unknown; quantity?: unknown }): Promise<{ httpStatus: number; body: Result; flash?: string | null }> {
  // Scalars only (arrays or text here used to crash with a 500)
  for (const v of [input.product_id, input.variant_id, input.quantity]) {
    if (!isIntLike(v)) return { httpStatus: 422, body: { status: 'error', message: 'Invalid request.' } };
  }
  const quantity = Math.max(parseInt(String(input.quantity ?? 1), 10) || 0, 1);
  const variantId = input.variant_id ? Number(input.variant_id) : null;
  const productId = input.product_id ? Number(input.product_id) : null;
  const cart: Record<string, CartLine> = { ...(data.cart ?? {}) };
  await connectDb();

  if (variantId) {
    const product = await Product.findOne({ 'variants._id': variantId }).lean();
    const variant = product?.variants.find((v) => v._id === variantId);
    if (!product || !variant) return { httpStatus: 404, body: { status: 'error', message: 'Not found.' } };
    if (product.status !== 'active') return { httpStatus: 200, body: { status: 'error', message: 'This product is not available.' } };

    const key = 'v_' + variant._id;
    const available = Number(variant.quantity ?? 0);
    const inCart = Object.values(cart).reduce((s, l) => s + (l.variant_id === variant._id ? Number(l.quantity) : 0), 0);
    const remain = Math.max(0, available - inCart);
    if (remain <= 0) return { httpStatus: 200, body: { status: 'error', message: 'Out of stock.' } };
    if (quantity > remain) return { httpStatus: 200, body: { status: 'error', message: `Only ${remain} left.` } };

    const existing = Number(cart[key]?.quantity ?? 0);
    const primary = product.images.find((i) => i.is_primary);
    cart[key] = {
      variant_id: variant._id,
      product_id: product._id,
      name: product.name,
      slug: product.slug,
      sku: variant.sku ?? '',
      // A variant without its own price uses the product price (as the product page shows)
      price: Number(variant.price || product.price || 0),
      quantity: existing + quantity,
      image: variant.primary_image ?? primary?.image_path ?? 'placeholder.png',
      variant_options: variant.option_values ?? {},
    };
  } else {
    const product = productId ? await Product.findById(productId).lean() : null;
    if (!product) return { httpStatus: 404, body: { status: 'error', message: 'Not found.' } };
    if (product.status !== 'active') return { httpStatus: 200, body: { status: 'error', message: 'This product is not available.' } };
    // Products with sizes/colours must be added with a chosen variant
    if (product.variants.length > 0) return { httpStatus: 200, body: { status: 'error', message: 'Please choose a size first.' } };

    const key = 'p_' + product._id;
    const available = Number(product.quantity ?? 0);
    const inCart = Object.values(cart).reduce((s, l) => s + (l.variant_id === null && l.product_id === product._id ? Number(l.quantity) : 0), 0);
    const remain = Math.max(0, available - inCart);
    if (remain <= 0) return { httpStatus: 200, body: { status: 'error', message: 'Out of stock.' } };
    if (quantity > remain) return { httpStatus: 200, body: { status: 'error', message: `Only ${remain} left.` } };

    const existing = Number(cart[key]?.quantity ?? 0);
    const primary = product.images.find((i) => i.is_primary);
    cart[key] = {
      variant_id: null,
      product_id: product._id,
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? '',
      price: Number(product.price ?? 0),
      quantity: existing + quantity,
      image: primary?.image_path ?? 'placeholder.png',
      variant_options: {},
    };
  }

  data.cart = cart;
  const flash = await recalculateCoupon(data);
  return { httpStatus: 200, body: { status: 'success' }, flash };
}

export async function updateCartLine(data: SessionData, rawKey: unknown, rawQty: unknown): Promise<{ httpStatus: number; body: Result; flash?: string | null }> {
  const cart: Record<string, CartLine> = { ...(data.cart ?? {}) };
  if (typeof rawKey !== 'string' || (typeof rawQty !== 'string' && typeof rawQty !== 'number')) {
    return { httpStatus: 422, body: { status: 'error', message: 'Invalid cart item or quantity.' } };
  }
  const key = rawKey;
  const newQuantity = parseInt(String(rawQty), 10) || 0;
  if (!cart[key] || newQuantity < 1) return { httpStatus: 200, body: { status: 'error', message: 'Invalid cart item or quantity.' } };

  const item = cart[key];
  const currentQty = Number(item.quantity ?? 0);
  const isIncrease = newQuantity > currentQty;

  // Friendly variant details for the messages
  const pairs = Object.entries(item.variant_options ?? {})
    .filter(([, v]) => v !== null && v !== '')
    .map(([k, v]) => `${k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Option'}: ${String(v).charAt(0).toUpperCase() + String(v).slice(1)}`);
  const variantDetails = pairs.length ? ` (${pairs.join(', ')})` : '';

  await connectDb();
  let nameForMsg = 'This product';
  let availableQty: number;
  let inCartOther = 0;
  if (item.variant_id) {
    const product = await Product.findOne({ 'variants._id': item.variant_id }).lean();
    const variant = product?.variants.find((v) => v._id === item.variant_id);
    if (!product || !variant) return { httpStatus: 200, body: { status: 'error', message: 'This variant is no longer available.' } };
    nameForMsg = product.name ?? nameForMsg;
    availableQty = Number(variant.quantity ?? 0);
    for (const [k, line] of Object.entries(cart)) if (k !== key && line.variant_id === item.variant_id) inCartOther += Number(line.quantity ?? 0);
  } else {
    const product = await Product.findById(item.product_id).lean();
    if (!product) return { httpStatus: 200, body: { status: 'error', message: 'This product is no longer available.' } };
    nameForMsg = product.name ?? nameForMsg;
    availableQty = Number(product.quantity ?? 0);
    for (const [k, line] of Object.entries(cart)) if (k !== key && line.variant_id === null && line.product_id === item.product_id) inCartOther += Number(line.quantity ?? 0);
  }
  const details = item.variant_id ? variantDetails : '';
  const additionalAvailable = Math.max(0, availableQty - inCartOther - currentQty);
  const maxTotalForThisLine = currentQty + additionalAvailable;
  if (isIncrease && newQuantity > maxTotalForThisLine) {
    const message = additionalAvailable <= 0
      ? `No more stock available for ${nameForMsg}${details}. You already have ${currentQty} in cart.`
      : `You can add only ${additionalAvailable} more (max ${maxTotalForThisLine} total) for ${nameForMsg}${details}.`;
    return { httpStatus: 200, body: { status: 'error', message, max_total: maxTotalForThisLine, additional_available: additionalAvailable } };
  }

  cart[key] = { ...item, quantity: newQuantity };
  data.cart = cart;
  const flash = await recalculateCoupon(data);
  return { httpStatus: 200, body: { status: 'success' }, flash };
}

export async function removeCartLine(data: SessionData, key: unknown) {
  if (typeof key !== 'string') return { httpStatus: 422, body: { status: 'error', message: 'Invalid cart item.' } as Result, flash: null };
  const cart: Record<string, CartLine> = { ...(data.cart ?? {}) };
  let flash: string | null = null;
  if (cart[key]) {
    delete cart[key];
    data.cart = cart;
    flash = await recalculateCoupon(data);
  }
  return { httpStatus: 200, body: { status: 'removed' } as Result, flash };
}

export async function applyCoupon(data: SessionData, rawCode: unknown): Promise<{ httpStatus: number; body: Result; flash?: string | null }> {
  if (typeof rawCode !== 'string' || rawCode.trim() === '') {
    return { httpStatus: 422, body: { status: 'error', message: 'Please enter a coupon code.' } };
  }
  const code = rawCode.trim();
  await connectDb();
  const now = wallClock('Asia/Karachi');
  const coupon = await Coupon.findOne({
    code,
    $or: [{ valid_until: null }, { valid_until: { $exists: false } }, { valid_until: { $gt: now } }],
  })
    .collation({ locale: 'en', strength: 2 })
    .lean();
  if (!coupon) {
    delete data.coupon;
    return { httpStatus: 200, body: { status: 'error', message: 'Invalid or expired coupon code.' } };
  }
  const subtotal = cartSubtotal(data.cart);
  const amount = coupon.type === 'percentage' ? round2((subtotal * coupon.discount) / 100) : coupon.discount;
  data.coupon = { code: coupon.code, amount, type: coupon.type, id: coupon._id, valid_until: couponExpiryLabel(coupon) } satisfies SessionCoupon;

  const flash = await recalculateCoupon(data);
  // The recalculation drops coupons that are used up or expired: say so
  if (!data.coupon) return { httpStatus: 200, body: { status: 'error', message: 'This coupon can no longer be used.' }, flash };

  const message = coupon.type === 'percentage'
    ? `Coupon applied! ${trimNumber(coupon.discount)}% discount.`
    : `Coupon applied! PKR ${numberFormat(coupon.discount, 2)} discount.`;
  return { httpStatus: 200, body: { status: 'success', message }, flash };
}

// PHP prints decimal(8,2) columns as "10.00"
const trimNumber = (n: number) => n.toFixed(2);
