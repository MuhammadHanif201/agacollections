import 'server-only';
import { cache } from 'react';
import { connectDb } from '@/lib/db';
import { Category } from '@/models/Category';
import { Review } from '@/models/content';
import { Product } from '@/models/Product';

/** ClientController::productDetail (draft products are not shown; admin preview comes with the admin panel) */
export const getProductPage = cache(async (slug: string) => {
  await connectDb();
  const product = await Product.findOne({ slug, status: 'active' }).lean();
  if (!product) return null;

  let related = product.related_ids.length
    ? await Product.find({ _id: { $in: product.related_ids }, status: 'active' }).sort({ created_at: -1, _id: 1 }).limit(8).lean()
    : [];
  if (!related.length) {
    related = await Product.find({ _id: { $ne: product._id }, quantity: { $gt: 0 }, status: 'active' }).sort({ created_at: -1, _id: 1 }).limit(8).lean();
  }

  const approvedReviews = await Review.find({ product_id: product._id, status: 'approved' }).sort({ created_at: -1, _id: 1 }).lean();
  const reviewCount = approvedReviews.length;
  const avgRating = reviewCount ? approvedReviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  const categories = await Category.find({ _id: { $in: product.category_ids } }).lean();
  // keep the product's own category order
  const orderedCats = product.category_ids.map((id) => categories.find((c) => c._id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));

  return { product, related, approvedReviews, reviewCount, avgRating, categories: orderedCats };
});

/** Plain counter update, like the PHP (no audit row, no updated_at change) */
export async function countProductView(id: number) {
  await connectDb();
  await Product.collection.updateOne({ _id: id as unknown as never }, { $inc: { views: 1 } });
}
