import { getCurrentCustomer } from '@/lib/auth';
import { recordAudit } from '@/lib/admin/audit';
import { connectDb } from '@/lib/db';
import { json, readBody, rejectCrossSite } from '@/lib/route';
import { Wishlist } from '@/models/content';
import { nextId } from '@/models/Counter';
import { Product } from '@/models/Product';

export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const customer = await getCurrentCustomer();
  if (!customer) return json({ error: 'Login required' }, 401);

  const body = await readBody(req);
  const productId = Number(body.product_id);
  await connectDb();
  if (!Number.isInteger(productId) || !(await Product.exists({ _id: productId, status: 'active' }))) {
    return json({ message: 'The selected product id is invalid.', errors: { product_id: ['The selected product id is invalid.'] } }, 422);
  }

  const existing = await Wishlist.findOne({ user_id: customer._id, product_id: productId }).lean();
  if (existing) return json({ status: 'exists', message: 'Product is already in wishlist' });
  const wid = await nextId('wishlists');
  await Wishlist.create({ _id: wid, user_id: customer._id, product_id: productId });
  await recordAudit({ event: 'created', type: 'App\\Models\\Wishlist', id: wid, new: { user_id: customer._id, product_id: String(body.product_id), id: wid } });
  return json({ status: 'added', message: 'Added to wishlist' });
}
