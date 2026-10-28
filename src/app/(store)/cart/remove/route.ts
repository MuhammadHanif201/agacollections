import { setFlash } from '@/lib/flash';
import { json, readBody, rejectCrossSite } from '@/lib/route';
import { getWritableSession, saveSession } from '@/lib/session';
import { removeCartLine } from '@/services/cart';
import { applyFreeShipping, cartSubtotal } from '@/services/pricing';
import { getCompanySetting } from '@/services/settings';

export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const body = await readBody(req);
  const s = await getWritableSession();
  const r = await removeCartLine(s.data, body.key);
  if (r.httpStatus !== 200) return json(r.body, r.httpStatus);
  await saveSession(s);
  if (r.flash) await setFlash('error', r.flash);

  // Totals for pages that update in place (city-specific shipping is quoted at checkout)
  const subtotal = cartSubtotal(s.data.cart);
  const discount = Number(s.data.coupon?.amount ?? 0);
  const company = await getCompanySetting();
  const rates = (company?.shipping_charges ?? { rest_of_pakistan: 300 }) as Record<string, number>;
  const afterCoupon = Math.max(0, subtotal - discount);
  const shipping = applyFreeShipping(company, afterCoupon, Number(rates.rest_of_pakistan ?? 0));
  return json({ status: 'removed', updated_totals: { subtotal, discount, total: afterCoupon + shipping } });
}
