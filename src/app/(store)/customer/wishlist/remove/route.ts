import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { json, readBody, rejectCrossSite } from '@/lib/route';
import { Wishlist } from '@/models/content';
import { Product } from '@/models/Product';

export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const customer = await getCurrentCustomer();
  const wantsJson = (req.headers.get('accept') ?? '').includes('application/json');
  if (!customer) {
    return wantsJson ? json({ message: 'Unauthenticated.' }, 401) : NextResponse.redirect(new URL('/customer/login', req.url), 303);
  }

  const body = await readBody(req);
  const productId = Number(body.product_id);
  await connectDb();
  if (!Number.isInteger(productId) || !(await Product.exists({ _id: productId }))) {
    return json({ message: 'The selected product id is invalid.', errors: { product_id: ['The selected product id is invalid.'] } }, 422);
  }
  await Wishlist.deleteMany({ user_id: customer._id, product_id: productId });

  // Heart buttons call this with fetch; the wishlist page posts a form
  if (wantsJson) return json({ status: 'removed', message: 'Removed from your wishlist.' });
  await setFlash('success', 'Removed from wishlist');
  return NextResponse.redirect(new URL(req.headers.get('referer') ?? '/wishlist', req.url), 303);
}
