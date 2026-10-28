import { connectDb } from '@/lib/db';
import { recordAudit } from '@/lib/admin/audit';
import { throttle } from '@/lib/request';
import { json, readBody, rejectCrossSite, tooManyRequests } from '@/lib/route';
import { Review } from '@/models/content';
import { nextId } from '@/models/Counter';
import { CI } from '@/models/Customer';
import { Product } from '@/models/Product';
import { reviewSchema, zodErrors } from '@/validators/store';

/** POST /product/{product id}/review — the segment holds the id here, as in the Laravel route */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  if (!(await throttle('review', 5))) return tooManyRequests();

  const id = Number((await params).slug);
  await connectDb();
  const product = Number.isInteger(id) ? await Product.findById(id).select('_id').lean() : null;
  if (!product) return json({ message: 'Not Found' }, 404);

  const parsed = reviewSchema.safeParse(await readBody(req));
  if (!parsed.success) {
    const errors = zodErrors(parsed.error);
    return json({ message: Object.values(errors)[0]?.[0] ?? 'The given data was invalid.', errors }, 422);
  }
  const v = parsed.data;

  // One pending/approved review per email per product, whatever the letter case
  const exists = await Review.exists({ product_id: product._id, email: v.email, status: { $in: ['pending', 'approved'] } }).collation(CI);
  if (exists) return json({ success: false, message: 'You have already submitted a review for this product.' }, 422);

  const reviewId = await nextId('reviews');
  await Review.create({
    _id: reviewId,
    product_id: product._id,
    name: v.name,
    email: v.email,
    rating: v.rating,
    comment: v.comment || null,
    status: 'pending',
  });
  await recordAudit({ event: 'created', type: 'App\\Models\\Review', id: reviewId, new: { product_id: product._id, name: v.name, email: v.email, rating: v.rating, comment: v.comment || null, status: 'pending', id: reviewId } });
  return json({ success: true, message: 'Thank you! Your review has been submitted and is awaiting approval.' });
}
