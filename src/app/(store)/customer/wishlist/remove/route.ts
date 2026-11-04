import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { json, readBody, rejectCrossSite } from '@/lib/route';
import { getWritableSession, saveSession } from '@/lib/session';
import { Wishlist } from '@/models/content';
import { Product } from '@/models/Product';

export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const customer = await getCurrentCustomer();
  const wantsJson = (req.headers.get('accept') ?? '').includes('application/json');

  const body = await readBody(req);
  const productId = Number(body.product_id);
  await connectDb();
  if (!Number.isInteger(productId) || !(await Product.exists({ _id: productId }))) {
    return json({ message: 'The selected product id is invalid.', errors: { product_id: ['The selected product id is invalid.'] } }, 422);
  }
  if (customer) {
    await Wishlist.deleteMany({ user_id: customer._id, product_id: productId });
  } else {
    // a guest's wishlist lives in the session
    const s = await getWritableSession();
    s.data.wishlist = (s.data.wishlist ?? []).filter((id) => id !== productId);
    await saveSession(s);
  }

  // Heart buttons call this with fetch; the wishlist page posts a form
  if (wantsJson) return json({ status: 'removed', message: 'Removed from your wishlist.' });
  await setFlash('success', 'Removed from wishlist');
  return NextResponse.redirect(new URL(req.headers.get('referer') ?? '/wishlist', req.url), 303);
}
