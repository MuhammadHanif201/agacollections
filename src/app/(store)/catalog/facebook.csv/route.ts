import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { decodeEntities } from '@/lib/html';
import { mediaUrl } from '@/lib/media';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { getCompanySetting } from '@/services/settings';

export const dynamic = 'force-dynamic';

/** PHP fputcsv(): quote fields containing , " \ newline, tab or space */
function csvField(v: string | number): string {
  const s = String(v);
  return /[,"\\\n\r\t ]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const limit = (s: string, n: number) => ([...s].length <= n ? s : [...s].slice(0, n).join('').trimEnd());

/**
 * Meta (Facebook/Instagram) product catalog feed for Commerce Manager. The id is
 * `sku ?: id`, the same as the Pixel content_ids, so ads match products.
 */
export async function GET() {
  await connectDb();
  const brand = (await getCompanySetting())?.name || 'AGA Collections';
  const [products, cats] = await Promise.all([
    Product.find({ status: 'active' }).sort({ _id: 1 }).lean(),
    Category.find().select('_id title').lean(),
  ]);
  const catTitle = new Map(cats.map((c) => [c._id, c.title]));
  const rows: string[] = [['id', 'title', 'description', 'availability', 'condition', 'price', 'sale_price', 'link', 'image_link', 'brand', 'product_type', 'google_product_category'].join(',')];

  for (const p of products) {
    const imagePath = p.images.find((i) => i.is_primary)?.image_path;
    if (!imagePath) continue; // Meta requires an image

    // Store: price = selling price, sale_price = higher old price. Meta: price = regular, sale_price = discounted.
    const fv = p.variants.find((v) => Number(v.quantity ?? 0) > 0) ?? p.variants[0];
    const now = Number(fv ? (fv.price || p.price) : p.price) || 0;
    const was = Number(fv ? (fv.sale_price || p.sale_price) : p.sale_price) || 0;
    const hasDiscount = was > now;
    const regular = hasDiscount ? was : now;
    const sale = hasDiscount ? now : null;
    const inStock = p.variants.length
      ? p.variants.reduce((s, v) => s + Number(v.quantity ?? 0), 0) > 0
      : p.quantity == null ? true : Number(p.quantity) > 0;
    // A space at every tag boundary so paragraphs don't run together
    let desc = decodeEntities(String(p.description ?? '').replace(/<[^>]+>/g, ' $& ').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    if (desc === '') desc = p.name;
    const productType = p.category_ids.map((id) => catTitle.get(id)).filter(Boolean).join(' > ');
    const img = mediaUrl(imagePath);

    rows.push([
      p.sku || p._id,
      limit(p.name, 150),
      limit(desc, 4990),
      inStock ? 'in stock' : 'out of stock',
      'new',
      regular.toFixed(2) + ' PKR',
      sale !== null ? sale.toFixed(2) + ' PKR' : '',
      `${env.appUrl}/product/${p.slug}`,
      /^https?:/.test(img) ? img : env.appUrl + img,
      brand,
      productType || 'Apparel',
      'Apparel & Accessories > Clothing',
    ].map(csvField).join(','));
  }

  return new Response(rows.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=UTF-8',
      'Content-Disposition': 'inline; filename="facebook-catalog.csv"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
