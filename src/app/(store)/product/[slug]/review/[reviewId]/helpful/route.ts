import { connectDb } from '@/lib/db';
import { throttle } from '@/lib/request';
import { json, rejectCrossSite, tooManyRequests } from '@/lib/route';
import { Review } from '@/models/content';

/** POST /product/{product id}/review/{review id}/helpful — one "Useful" tap (the browser remembers it was tapped) */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string; reviewId: string }> }) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  if (!(await throttle('review-helpful', 20))) return tooManyRequests();

  const { slug, reviewId } = await params;
  const productId = Number(slug);
  const id = Number(reviewId);
  if (!Number.isInteger(productId) || !Number.isInteger(id)) return json({ message: 'Not Found' }, 404);

  await connectDb();
  const row = await Review.findOneAndUpdate(
    { _id: id, product_id: productId, status: 'approved' },
    { $inc: { helpful: 1 } },
    { new: true, timestamps: false, projection: { helpful: 1 } },
  ).lean();
  if (!row) return json({ message: 'Not Found' }, 404);
  return json({ success: true, helpful: row.helpful ?? 0 });
}
