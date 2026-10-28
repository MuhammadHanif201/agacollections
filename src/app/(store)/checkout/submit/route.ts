import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCurrentCustomer, hashPassword } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { hit, clientIp, isSameOrigin } from '@/lib/request';
import { readBody } from '@/lib/route';
import { getWritableSession, saveSession } from '@/lib/session';
import { AFFILIATE_COOKIE } from '@/models/Affiliate';
import { nextId } from '@/models/Counter';
import { CI, Customer } from '@/models/Customer';
import { placeOrder } from '@/services/orders';
import { applyFreeShipping, cartSubtotal, shippingForCity } from '@/services/pricing';
import { getCompanySetting } from '@/services/settings';
import { checkoutSchema, firstErrors } from '@/validators/store';

const FIELDS = ['full_name', 'email', 'phone', 'city', 'address', 'country', 'order_notes', 'affiliate_code'] as const;

const to = (req: Request, path: string) => NextResponse.redirect(new URL(path, req.url), 303);

/** ClientController::checkoutSubmit (cash on delivery) */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    await setFlash('error', 'This page was open for a long time, so your session expired. Refresh the page and try again.');
    return to(req, '/checkout');
  }
  const session = await getWritableSession();
  // Six a minute per visitor and thirty per IP (shoppers on mobile networks share IPs)
  const ip = await clientIp();
  if (!(await hit(`checkout-session:${session.id}`, 6)) || !(await hit(`checkout-ip:${ip}`, 30))) {
    await setFlash('error', 'Too many attempts. Please wait a minute and try again.');
    return to(req, '/checkout');
  }

  const body = await readBody(req);
  const input: Record<string, string> = {};
  for (const f of FIELDS) if (typeof body[f] === 'string') input[f] = body[f] as string;

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const data = session.data as typeof session.data & { _old?: Record<string, string> };
    data._old = input;
    await saveSession(session);
    await setFlash('errors', 'Validation Error', firstErrors(parsed.error));
    return to(req, '/checkout');
  }
  const form = parsed.data;

  const cart = session.data.cart ?? {};
  if (!Object.keys(cart).length) {
    await setFlash('error', 'Your cart is empty.');
    return to(req, '/checkout');
  }

  // Snapshot of the form and the prices, kept with the session
  const company = await getCompanySetting();
  const subtotal = cartSubtotal(cart);
  const discountCoupon = Number(session.data.coupon?.amount ?? 0);
  const afterCoupons = Math.max(0, subtotal - discountCoupon);
  const shipping = applyFreeShipping(company, afterCoupons, shippingForCity(company, form.city));
  const data = session.data as typeof session.data & Record<string, unknown>;
  data.pending_checkout_data = { ...form, order_notes: form.order_notes ?? null, affiliate_code: form.affiliate_code ?? null };
  data.pending_pricing = { subtotal, discount_coupon: discountCoupon, shipping, total: afterCoupons + shipping, computed_at: new Date().toISOString() };

  // Customer: signed in, or a guest. An existing account (same email, else same phone) only
  // gets the order attached for the admin; its name, address and password are never changed
  // here, and the order is marked guest so it never shows in that account.
  await connectDb();
  let customer = await getCurrentCustomer();
  const guest = !customer;
  if (!customer) {
    customer = (await Customer.findOne({ email: form.email }).collation(CI).lean()) ?? (await Customer.findOne({ phone: form.phone }).lean());
    if (!customer) {
      try {
        const created = await Customer.create({
          _id: await nextId('customers'),
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address,
          // Random, unguessable password; the shopper can set one with "Forgot password"
          password: await hashPassword(randomBytes(24).toString('base64url')),
        });
        customer = created.toObject();
      } catch {
        // Created at the same moment by another request
        customer = (await Customer.findOne({ email: form.email }).collation(CI).lean()) ?? (await Customer.findOne({ phone: form.phone }).lean());
      }
    }
  }
  if (!customer) {
    await saveSession(session);
    await setFlash('error', 'Sorry, we could not place your order right now. Please try again.');
    return to(req, '/checkout');
  }

  const affiliateCookie = (await cookies()).get(AFFILIATE_COOKIE)?.value;
  const result = await placeOrder(session.data, form, customer, affiliateCookie, 'cod', guest);
  if (!result.ok) {
    await saveSession(session);
    await setFlash('error', result.error);
    return to(req, '/cart');
  }

  delete data.pending_checkout_data;
  delete data.pending_cart_data;
  await saveSession(session);
  await setFlash('success', 'Your order has been placed successfully!');
  return to(req, `/thankyou/${result.orderId}`);
}
