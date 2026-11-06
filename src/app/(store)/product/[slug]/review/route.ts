import sharp from 'sharp';
import { connectDb } from '@/lib/db';
import { recordAudit } from '@/lib/admin/audit';
import { deletePublic, storePublic } from '@/lib/admin/storage';
import { throttle } from '@/lib/request';
import { json, rejectCrossSite, tooManyRequests } from '@/lib/route';
import { Review } from '@/models/content';
import { nextId } from '@/models/Counter';
import { CI } from '@/models/Customer';
import { Product } from '@/models/Product';
import { reviewSchema, zodErrors } from '@/validators/store';

const REVIEW_MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // the browser shrinks photos first; this only stops oversized raw files

/** Body fields and photos: JSON (no photos) or multipart with photos[] */
async function readReview(req: Request): Promise<{ fields: Record<string, unknown>; photos: File[] }> {
  const type = req.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) {
      const v = await req.json();
      return { fields: v && typeof v === 'object' && !Array.isArray(v) ? v : {}, photos: [] };
    }
    if (type.includes('multipart/form-data') || type.includes('application/x-www-form-urlencoded')) {
      const fd = await req.formData();
      const fields: Record<string, unknown> = {};
      const photos: File[] = [];
      for (const [k, v] of fd.entries()) {
        if (typeof v === 'string') fields[k] = v;
        else if ((k === 'photos' || k === 'photos[]') && v.size > 0) photos.push(v);
      }
      return { fields, photos };
    }
  } catch { /* malformed body */ }
  return { fields: {}, photos: [] };
}

/** POST /product/{product id}/review — the segment holds the id here, as in the Laravel route */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  if (!(await throttle('review', 5))) return tooManyRequests();

  const id = Number((await params).slug);
  await connectDb();
  const product = Number.isInteger(id) ? await Product.findById(id).select('_id').lean() : null;
  if (!product) return json({ message: 'Not Found' }, 404);

  const { fields, photos } = await readReview(req);
  const parsed = reviewSchema.safeParse(fields);
  if (!parsed.success) {
    const errors = zodErrors(parsed.error);
    return json({ message: Object.values(errors)[0]?.[0] ?? 'The given data was invalid.', errors }, 422);
  }
  const v = parsed.data;
  if (photos.length > REVIEW_MAX_PHOTOS) return json({ message: `You can add up to ${REVIEW_MAX_PHOTOS} photos.` }, 422);
  if (photos.some((f) => f.size > MAX_PHOTO_BYTES)) return json({ message: 'Each photo must be smaller than 8 MB.' }, 422);

  // One pending/approved review per email per product, whatever the letter case
  const exists = await Review.exists({ product_id: product._id, email: v.email, status: { $in: ['pending', 'approved'] } }).collation(CI);
  if (exists) return json({ success: false, message: 'You have already submitted a review for this product.' }, 422);

  // Photos become WebP (max 1600px); anything that is not a readable picture is refused
  const webps: Buffer[] = [];
  for (const f of photos) {
    try {
      webps.push(await sharp(Buffer.from(await f.arrayBuffer())).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer());
    } catch {
      return json({ message: 'One of the files is not a photo we can read. Please use JPG, PNG or WebP.' }, 422);
    }
  }

  const reviewId = await nextId('reviews');
  const images: string[] = [];
  try {
    for (const [i, buf] of webps.entries()) {
      images.push(await storePublic(`reviews/${reviewId}-${i + 1}-${Date.now().toString(36)}.webp`, buf));
    }
  } catch (e) {
    console.error('Review photo upload failed: ' + (e as Error).message);
    await Promise.all(images.map((p) => deletePublic(p)));
    return json({ message: 'Your photos could not be uploaded. Please try again, or skip the photos.' }, 500);
  }

  const doc = {
    _id: reviewId,
    product_id: product._id,
    name: v.name,
    email: v.email,
    rating: v.rating,
    title: v.title || null,
    comment: v.comment || null,
    recommend: v.recommend === 'yes',
    age_group: v.age_group ?? null,
    gender: v.gender ?? null,
    images,
    helpful: 0,
    status: 'pending' as const,
  };
  await Review.create(doc);
  const { _id, ...logged } = doc;
  await recordAudit({ event: 'created', type: 'App\\Models\\Review', id: reviewId, new: { ...logged, id: _id } });
  return json({ success: true, message: 'Thank you! Your review has been submitted and is awaiting approval.' });
}
