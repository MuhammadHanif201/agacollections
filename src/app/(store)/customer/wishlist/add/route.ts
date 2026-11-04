import { getCurrentCustomer } from '@/lib/auth';
import { recordAudit } from '@/lib/admin/audit';
import { connectDb } from '@/lib/db';
import { json, readBody, rejectCrossSite } from '@/lib/route';
import { getWritableSession, saveSession } from '@/lib/session';
import { Wishlist } from '@/models/content';
import { nextId } from '@/models/Counter';
import { Product } from '@/models/Product';

export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const customer = await getCurrentCustomer();

  const body = await readBody(req);
  const productId = Number(body.product_id);
  await connectDb();
  if (!Number.isInteger(productId) || !(await Product.exists({ _id: productId, status: 'active' }))) {
    return json({ message: 'The selected product id is invalid.', errors: { product_id: ['The selected product id is invalid.'] } }, 422);
  }

  // Guests keep their wishlist in the session (it joins their account when they sign in)
  if (!customer) {
    const s = await getWritableSession();
    const list = s.data.wishlist ?? [];
    if (list.includes(productId)) return json({ status: 'exists', message: 'Product is already in wishlist' });
    s.data.wishlist = [...list, productId];
    await saveSession(s);
    return json({ status: 'added', message: 'Added to wishlist' });
  }

  const existing = await Wishlist.findOne({ user_id: customer._id, product_id: productId }).lean();
  if (existing) return json({ status: 'exists', message: 'Product is already in wishlist' });
  const wid = await nextId('wishlists');
  await Wishlist.create({ _id: wid, user_id: customer._id, product_id: productId });
  await recordAudit({ event: 'created', type: 'App\\Models\\Wishlist', id: wid, new: { user_id: customer._id, product_id: String(body.product_id), id: wid } });
  return json({ status: 'added', message: 'Added to wishlist' });
}
