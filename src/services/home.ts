import 'server-only';
import { connectDb } from '@/lib/db';
import { Review } from '@/models/content';
import { Product, type ProductDoc } from '@/models/Product';
import { inStockFilter } from './catalog';
import { activeProductCounts } from './settings';
import { Category } from '@/models/Category';

const NEW_ARRIVAL = 'Home Page - New Arrival';

/** ClientController::index */
export async function homeData() {
  await connectDb();
  const active = { status: 'active' as const };

  // New In: the 16 newest in-stock products, shown in the curated order
  const latestProducts = sortStable(
    await Product.find({ ...active, ...inStockFilter }).sort({ created_at: -1, _id: 1 }).limit(16).lean(),
    (a, b) => a.sort_order - b.sort_order,
  );

  // Most Loved: admin-marked, else most viewed with stock
  let bestSellers = await Product.find({ ...active, is_best_seller: true }).sort({ sort_order: 1, _id: 1 }).limit(8).lean();
  if (!bestSellers.length) {
    bestSellers = await Product.find({ ...active, quantity: { $gt: 0 } }).sort({ views: -1, _id: 1 }).limit(8).lean();
  }

  // Last Call: products with a real discount, biggest first
  const sale = await Product.find({ ...active, sale_price: { $ne: null }, $expr: { $gt: ['$sale_price', '$price'] }, ...inStockFilter }).lean();
  const saleProducts = sortStable(sale, (a, b) => {
    const da = (Number(a.sale_price) - Number(a.price)) / Number(a.sale_price);
    const db = (Number(b.sale_price) - Number(b.price)) / Number(b.sale_price);
    return db - da || a.sort_order - b.sort_order || a._id - b._id;
  }).slice(0, 8);

  // Shop the Edit: the 3 categories with most products (at least 4), 6 in-stock products each
  const counts = await activeProductCounts();
  const showcaseCats = (await Category.find({ status: 'active', title: { $ne: NEW_ARRIVAL } }).lean())
    .map((c) => ({ ...c, products_count: counts.get(c._id) ?? 0 }))
    .filter((c) => c.products_count >= 4);
  const topCats = sortStable(showcaseCats, (a, b) => b.products_count - a.products_count).slice(0, 3);
  const categoryShowcase: { category: (typeof topCats)[number]; products: ProductDoc[] }[] = [];
  for (const cat of topCats) {
    const items = sortStable(
      await Product.find({ ...active, category_ids: cat._id, ...inStockFilter }).sort({ created_at: -1, _id: 1 }).limit(6).lean(),
      (a, b) => a.sort_order - b.sort_order,
    );
    if (items.length) categoryShowcase.push({ category: cat, products: items });
  }

  return { latestProducts, bestSellers, saleProducts, categoryShowcase };
}

/** partials/home-reviews.blade.php data */
export async function homeReviews() {
  await connectDb();
  const reviews = await Review.find({ status: 'approved' }).sort({ created_at: -1, _id: 1 }).lean();
  const products = await Product.find({ _id: { $in: [...new Set(reviews.map((r) => r.product_id))] }, status: 'active' })
    .select('_id name slug images status')
    .lean();
  const byId = new Map(products.map((p) => [p._id, p]));
  const all = reviews.filter((r) => byId.has(r.product_id));
  const count = all.length;
  const avg = count ? Math.round((all.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  // Written reviews first, newest first; show up to six
  const show = [...all]
    .sort((a, b) => {
      const fa = a.comment && a.comment.trim() !== '' ? 1 : 0;
      const fb = b.comment && b.comment.trim() !== '' ? 1 : 0;
      return fb - fa || +b.created_at - +a.created_at;
    })
    .slice(0, 6)
    .map((r) => ({ ...r, product: byId.get(r.product_id)! }));
  return { count, avg, show };
}

export function sortStable<T>(arr: T[], cmp: (a: T, b: T) => number): T[] {
  return arr.map((v, i) => [v, i] as const).sort((x, y) => cmp(x[0], y[0]) || x[1] - y[1]).map((x) => x[0]);
}
