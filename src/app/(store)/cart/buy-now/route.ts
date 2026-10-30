import { json, readBody, rejectCrossSite } from '@/lib/route';
import { getWritableSession, saveSession } from '@/lib/session';
import type { SessionData } from '@/models/Session';
import { addToCart } from '@/services/cart';

/**
 * "Buy it now": checks the item exactly as Add to Cart does (size, stock, price), but keeps
 * it in session.buy_now instead of the bag, so the bag is left as it was. The checkout then
 * opens with ?buy=now and orders only this item.
 */
export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const body = await readBody(req);
  const s = await getWritableSession();
  const single: SessionData = {};
  const r = await addToCart(single, body);
  if (r.httpStatus === 200 && r.body.status === 'success' && single.cart) {
    s.data.buy_now = single.cart;
    await saveSession(s);
  }
  return json(r.body, r.httpStatus);
}
