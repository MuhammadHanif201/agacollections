import 'server-only';
import { recordAudit } from '@/lib/admin/audit';
import mongoose from 'mongoose';
import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { sendMail } from '@/lib/mail';
import { mediaUrl } from '@/lib/media';
import { numberFormat } from '@/lib/format';
import { adminOrderHtml, customerOrderHtml, customerOrderText, type OrderMailData } from '@/emails/templates';
import { Affiliate, AffiliateCommission, type AffiliateDoc } from '@/models/Affiliate';
import { Coupon, type CompanySettingDoc } from '@/models/content';
import { nextId, nextIds } from '@/models/Counter';
import { Order, orderContact, variantLabelFor, type OrderDoc } from '@/models/Order';
import { Product, type ProductDoc } from '@/models/Product';
import type { CartLine, SessionData } from '@/models/Session';
import { couponExpired, couponUsedUp } from './cart';
import { applyFreeShipping, cartSubtotal, round2, shippingForCity } from './pricing';
import { getCompanySetting, primaryEmail } from './settings';

export interface CheckoutForm {
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  order_notes?: string | null;
  affiliate_code?: string | null;
}

class CheckoutError extends Error {}

export type PlaceOrderResult =
  | { ok: true; orderId: number }
  | { ok: false; error: string };

/**
 * OrderService::createOrderAndRedirect. Mutates `session` (bag, coupon, order access);
 * the caller saves it and redirects (thank-you page on success, bag on failure).
 */
export async function placeOrder(
  session: SessionData,
  form: CheckoutForm,
  customer: { _id: number; full_name: string; email?: string | null; phone: string; address?: string | null; city?: string | null },
  affiliateCookie: string | undefined,
  paymentMethod = 'cod',
  guest = false,
): Promise<PlaceOrderResult> {
  await connectDb();
  const cartData: Record<string, CartLine> = { ...(session.cart ?? {}) };

  // The bag keeps the price from when an item was added. If a price changed since,
  // update the bag and let the customer see it before ordering.
  const changed: string[] = [];
  for (const [key, item] of Object.entries(cartData)) {
    const product = item.variant_id
      ? await Product.findOne({ 'variants._id': item.variant_id }).lean()
      : await Product.findById(item.product_id).lean();
    if (!product) continue; // handled below as "no longer available"
    const variant = item.variant_id ? product.variants.find((v) => v._id === item.variant_id) : null;
    const current = Number(variant ? (variant.price || product.price) : product.price) || 0;
    if (Math.abs(current - Number(item.price ?? 0)) > 0.009) {
      cartData[key] = { ...item, price: current };
      changed.push(item.name ?? product.name);
    }
  }
  if (changed.length) {
    session.cart = cartData;
    return { ok: false, error: `The price of ${changed.join(', ')} has changed since you added it. Your bag now shows the current price. Please check it and place your order again.` };
  }

  const subtotal = cartSubtotal(cartData);

  // Coupon: re-check now (it may have expired or run out since it was applied)
  let discountCoupon = Number(session.coupon?.amount ?? 0);
  if (session.coupon?.code) {
    const c = await Coupon.findOne({ code: session.coupon.code }).lean();
    if (!c || couponExpired(c) || couponUsedUp(c)) {
      delete session.coupon;
      discountCoupon = 0;
    }
  }
  discountCoupon = Math.min(Math.max(0, discountCoupon), subtotal);
  const subtotalAfterCoupons = Math.max(0, subtotal - discountCoupon);

  const setting = await getCompanySetting();
  const shipping = applyFreeShipping(setting, subtotalAfterCoupons, shippingForCity(setting, form.city ?? ''));
  const code = session.coupon?.code ?? '';
  const total = Math.max(0, subtotalAfterCoupons + shipping);

  // Affiliate: typed code at checkout, else the referral cookie
  let affiliateCode = String(form.affiliate_code ?? '').trim().toUpperCase();
  if (!affiliateCode) affiliateCode = String(affiliateCookie ?? '').trim().toUpperCase();
  let affiliate: AffiliateDoc | null = affiliateCode
    ? await Affiliate.findOne({ referral_code: affiliateCode, status: 'approved' }).lean()
    : null;
  // An affiliate cannot earn commission on their own orders
  if (affiliate) {
    const buyerEmail = String(form.email ?? customer.email ?? '').trim().toLowerCase();
    const own = (affiliate.customer_id && affiliate.customer_id === customer._id)
      || (affiliate.email && affiliate.email.trim().toLowerCase() === buyerEmail);
    if (own) affiliate = null;
  }

  const lines = Object.values(cartData);
  let orderId = 0;
  const db = await mongoose.startSession();
  try {
    await db.withTransaction(async () => {
      // Last use of a coupon: re-read it inside the transaction
      if (code && discountCoupon > 0) {
        const c = await Coupon.findOne({ code }).session(db).lean();
        if (!c || couponExpired(c) || couponUsedUp(c)) {
          delete session.coupon;
          throw new CheckoutError(`The coupon ${code} has just run out, so it was removed from your bag. Please check your total and order again.`);
        }
      }

      const taken: { line: CartLine; product: ProductDoc; qty: number }[] = [];
      for (const line of lines) {
        const qty = Number(line.quantity ?? 0);
        const name = line.name ?? 'An item';
        if (qty < 1) throw new CheckoutError(`${name} just sold out. Please remove it from your bag.`);
        const res = line.variant_id
          ? await Product.updateOne(
              { status: 'active', variants: { $elemMatch: { _id: line.variant_id, quantity: { $gte: qty } } } },
              { $inc: { 'variants.$.quantity': -qty } },
              { session: db },
            )
          : await Product.updateOne(
              { _id: line.product_id, status: 'active', quantity: { $gte: qty } },
              { $inc: { quantity: -qty } },
              { session: db },
            );
        if (res.modifiedCount !== 1) {
          // Say why, like the PHP checks did
          const p = line.variant_id
            ? await Product.findOne({ 'variants._id': line.variant_id }).session(db).lean()
            : await Product.findById(line.product_id).session(db).lean();
          if (!p || p.status !== 'active') throw new CheckoutError(`${name} is no longer available. Please remove it from your bag.`);
          const have = Number((line.variant_id ? p.variants.find((v) => v._id === line.variant_id)?.quantity : p.quantity) ?? 0);
          throw new CheckoutError(have > 0 ? `Only ${have} left of ${name}. Please update your bag.` : `${name} just sold out. Please remove it from your bag.`);
        }
        const product = (line.variant_id
          ? await Product.findOne({ 'variants._id': line.variant_id }).session(db).lean()
          : await Product.findById(line.product_id).session(db).lean())!;
        if (line.variant_id) {
          // Product-level stock for sized products = sum of its sizes
          await Product.updateOne({ _id: product._id }, [{ $set: { quantity: { $sum: '$variants.quantity' } } }], { session: db, updatePipeline: true });
        }
        taken.push({ line, product, qty });
      }

      orderId = await nextId('orders', db);
      const itemIds = await nextIds('order_items', taken.length, db);
      const now = new Date();
      await Order.create([{
        _id: orderId,
        customer_id: customer._id,
        subtotal: round2(subtotal),
        shipping,
        discount: round2(discountCoupon),
        coupon_code: code,
        total: round2(total),
        order_notes: form.order_notes ?? null,
        payment_method: paymentMethod,
        guest,
        affiliate_id: affiliate?._id ?? null,
        affiliate_code: affiliate?.referral_code ?? null,
        // Delivery details as typed for this order (checkout never changes the account profile)
        shipping_name: form.full_name ?? customer.full_name,
        shipping_phone: form.phone ?? customer.phone,
        shipping_email: form.email ?? customer.email,
        shipping_address: form.address ?? customer.address,
        shipping_city: form.city ?? customer.city,
        status: 'pending',
        items: taken.map(({ line, product, qty }, i) => {
          const variant = line.variant_id ? product.variants.find((v) => v._id === line.variant_id) : null;
          return {
            _id: itemIds[i],
            product_id: product._id,
            variant_id: variant?._id ?? null,
            variant_label: variant ? variantLabelFor(variant.option_values) : null,
            quantity: qty,
            price: line.price,
            total: round2(line.price * qty),
            stock_adjusted: true,
            created_at: now,
          };
        }),
      }], { session: db });

      if (affiliate) {
        const rate = affiliate.commission_rate != null ? Number(affiliate.commission_rate) : Number(setting?.affiliate_default_rate ?? 8);
        const base = subtotalAfterCoupons; // commission is on item revenue, excluding shipping
        await AffiliateCommission.create([{
          _id: await nextId('affiliate_commissions', db),
          affiliate_id: affiliate._id,
          order_id: orderId,
          rate_used: rate,
          base_amount: round2(base),
          commission_amount: round2((base * rate) / 100),
          status: 'pending',
        }], { session: db });
      }

      // One use of the coupon (max_uses is the limit and is never decremented)
      if (code) await Coupon.updateOne({ code }, { $inc: { used_count: 1 } }, { session: db });
    });
  } catch (err) {
    if (err instanceof CheckoutError) return { ok: false, error: err.message };
    throw err;
  } finally {
    await db.endSession();
  }

  // Audit trail, as the Auditable models wrote it
  const placed = await Order.findById(orderId).lean();
  if (placed) {
    await recordAudit({ event: 'created', type: 'App\\Models\\Order', id: orderId, new: {
      customer_id: placed.customer_id, subtotal: placed.subtotal, shipping: placed.shipping, discount: placed.discount, coupon_code: placed.coupon_code ?? '',
      total: placed.total, order_notes: placed.order_notes ?? null, payment_method: placed.payment_method, affiliate_id: placed.affiliate_id ?? null,
      affiliate_code: placed.affiliate_code ?? null, shipping_name: placed.shipping_name, shipping_phone: placed.shipping_phone, shipping_email: placed.shipping_email,
      shipping_address: placed.shipping_address, shipping_city: placed.shipping_city, id: orderId,
    } });
    for (const it of placed.items) {
      await recordAudit({ event: 'created', type: 'App\\Models\\OrderItem', id: it._id, new: {
        order_id: orderId, product_id: it.product_id, variant_id: it.variant_id ?? null, variant_label: it.variant_label ?? null,
        quantity: it.quantity, price: it.price, total: it.total, stock_adjusted: it.stock_adjusted, id: it._id,
      } });
    }
  }

  // Clear the bag
  delete session.cart;
  delete session.coupon;
  // Only this browser (or the logged-in owner) may open the confirmation page
  session.zq_order_access = [...(session.zq_order_access ?? []), orderId];
  session.just_purchased_order_id = orderId;

  // Confirmation emails (failures are logged, the order stands)
  const order = await Order.findById(orderId).lean();
  if (order) await sendOrderEmails(order, customer, setting);

  return { ok: true, orderId };
}

async function orderMailData(order: OrderDoc, customer: Parameters<typeof orderContact>[1]): Promise<OrderMailData> {
  const products = await Product.find({ _id: { $in: order.items.map((i) => i.product_id) } }).lean();
  const byId = new Map(products.map((p) => [p._id, p]));
  return {
    id: order._id,
    created_at: order.created_at,
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    total: order.total,
    coupon_code: order.coupon_code,
    payment_method: order.payment_method,
    order_notes: order.order_notes,
    contact: orderContact(order, customer),
    items: order.items.map((item) => {
      const p = byId.get(item.product_id);
      const v = item.variant_id ? p?.variants.find((x) => x._id === item.variant_id) : null;
      const img = p?.images.find((i) => i.is_primary)?.image_path ?? null;
      const imgUrl = img ? mediaUrl(img) : null;
      return {
        name: p?.name ?? null,
        slug: p?.slug ?? null,
        image: imgUrl ? (imgUrl.startsWith('http') ? imgUrl : env.appUrl + imgUrl) : null,
        optionsLabel: item.variant_label || variantLabelFor(v?.option_values),
        quantity: item.quantity,
        price: item.price,
        wasPriceRaw: Number(v ? (v.sale_price || p?.sale_price) : p?.sale_price) || 0,
      };
    }),
  };
}

async function sendOrderEmails(order: OrderDoc, customer: Parameters<typeof orderContact>[1], setting: CompanySettingDoc | null) {
  const data = await orderMailData(order, customer);
  const appName = process.env.APP_NAME || 'AGA Collections';
  const ctx = {
    setting,
    siteUrl: env.appUrl,
    policiesUrl: env.appUrl + '/policies',
    productUrl: (slug: string) => `${env.appUrl}/product/${encodeURIComponent(slug)}`,
    helpEmail: primaryEmail(setting),
    appName,
  };
  const to = data.contact.email;
  if (to) {
    try {
      const reply = primaryEmail(setting);
      await sendMail({
        to,
        subject: `Your ${setting?.name ?? 'AGA Collections'} order #${order._id} is confirmed`,
        html: customerOrderHtml(data, ctx),
        text: customerOrderText(data, ctx),
        replyTo: reply ? { address: reply, name: setting?.name } : undefined,
      });
    } catch (e) {
      console.warn('Order confirmation email failed: ' + (e as Error).message);
    }
  }
  const adminTo = primaryEmail(setting);
  if (adminTo) {
    try {
      await sendMail({ to: adminTo, subject: `New order #${order._id} — PKR ${numberFormat(order.total)}`, html: adminOrderHtml(data, appName) });
    } catch (e) {
      console.warn('Admin order notification email failed: ' + (e as Error).message);
    }
  }
}
