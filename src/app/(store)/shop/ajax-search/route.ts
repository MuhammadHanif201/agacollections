import { connectDb } from '@/lib/db';
import { json, readBody } from '@/lib/route';
import { Product } from '@/models/Product';
import { toCards } from '@/services/catalog';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Live results for the search overlay: up to 20 active products whose name matches, newest first */
export async function POST(req: Request) {
  const body = await readBody(req);
  const search = typeof body.search === 'string' || typeof body.search === 'number' ? String(body.search) : '';
  await connectDb();
  const products = await Product.find({ status: 'active', name: { $regex: escapeRegex(search), $options: 'i' } })
    .sort({ created_at: -1, _id: 1 })
    .limit(20)
    .lean();
  return json({ products: await toCards(products) });
}
