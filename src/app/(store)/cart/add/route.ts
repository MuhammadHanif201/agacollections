import { setFlash } from '@/lib/flash';
import { json, readBody, rejectCrossSite } from '@/lib/route';
import { getWritableSession, saveSession } from '@/lib/session';
import { addToCart } from '@/services/cart';

export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const body = await readBody(req);
  const s = await getWritableSession();
  const r = await addToCart(s.data, body);
  if (r.httpStatus === 200 && r.body.status === 'success') await saveSession(s);
  if (r.flash) await setFlash('error', r.flash);
  return json(r.body, r.httpStatus);
}
