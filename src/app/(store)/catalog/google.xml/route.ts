import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { strTitle } from '@/lib/format';
import { decodeEntities } from '@/lib/html';
import { mediaUrl } from '@/lib/media';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { getCompanySetting } from '@/services/settings';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const limit = (s: string, n: number) => ([...s].length <= n ? s : [...s].slice(0, n).join('').trimEnd());
const abs = (u: string) => (/^https?:/.test(u) ? u : env.appUrl + u);
/** an option value by name, whatever its capitalisation (Size / SIZE / size) */
const opt = (o: Record<string, string> | undefined, ...names: string[]) => {
  for (const [k, v] of Object.entries(o ?? {})) if (names.includes(k.toLowerCase()) && v) return String(v);
  return null;
};

/**
 * Google Merchant Center product feed (RSS 2.0 with the g: namespace), for free listings in the Shopping tab.
 * One item per size/colour variant, grouped by product (item_group_id); products without variants are one item.
 * Store prices: price = selling price, sale_price = higher old price. Google: price = regular, sale_price = discounted.
 * The site's own product pages are not changed by this feed.
 */
export async function GET() {
  await connectDb();
  const company = await getCompanySetting();
  const brand = company?.name || 'AGA Collections';
  const shipFee = Number((company?.shipping_charges as Record<string, number> | undefined)?.rest_of_pakistan ?? 0);
  const [products, cats] = await Promise.all([
    Product.find({ status: 'active' }).sort({ _id: 1 }).lean(),
    Category.find().select('_id title').lean(),
  ]);
  const catTitle = new Map(cats.map((c) => [c._id, c.title]));
  const items: string[] = [];

  for (const p of products) {
    const primary = p.images.find((i) => i.is_primary)?.image_path ?? p.images[0]?.image_path;
    if (!primary) continue; // Google requires an image
    const extra = p.images.map((i) => i.image_path).filter((x) => x && x !== primary).slice(0, 10);
    let desc = decodeEntities(String(p.description ?? '').replace(/<[^>]+>/g, ' $& ').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    if (desc === '') desc = strTitle(p.name);
    const productType = p.category_ids.map((id) => catTitle.get(id)).filter(Boolean).map((t) => strTitle(String(t))).join(' > ') || 'Apparel';
    const title = strTitle(p.name); // Google flags titles written in capitals
    const link = `${env.appUrl}/product/${p.slug}`;
    const group = String(p.sku || p._id);

    const rows = p.variants.length
      ? p.variants.map((v) => ({
          id: String(v.sku || `${group}-${v._id}`),
          now: Number(v.price || p.price) || 0,
          was: Number(v.sale_price || p.sale_price) || 0,
          inStock: Number(v.quantity ?? 0) > 0,
          size: opt(v.option_values, 'size'),
          color: opt(v.option_values, 'color', 'colour'),
          image: v.primary_image || primary,
          grouped: true,
        }))
      : [{ id: group, now: Number(p.price) || 0, was: Number(p.sale_price) || 0, inStock: p.quantity == null ? true : Number(p.quantity) > 0, size: null, color: null, image: primary, grouped: false }];

    for (const r of rows) {
      if (r.now <= 0) continue;
      const hasDiscount = r.was > r.now;
      const regular = hasDiscount ? r.was : r.now;
      const fields: [string, string][] = [
        ['g:id', r.id],
        ['g:title', limit(title + (r.color && !title.toLowerCase().includes(r.color.toLowerCase()) ? ` – ${strTitle(r.color)}` : '') + (r.size ? ` – ${r.size}` : ''), 150)],
        ['g:description', limit(desc, 4990)],
        ['g:link', link],
        ['g:image_link', abs(mediaUrl(r.image))],
        ...extra.map((x): [string, string] => ['g:additional_image_link', abs(mediaUrl(x))]),
        ['g:availability', r.inStock ? 'in_stock' : 'out_of_stock'],
        ['g:price', `${regular.toFixed(2)} PKR`],
        ...(hasDiscount ? [['g:sale_price', `${r.now.toFixed(2)} PKR`] as [string, string]] : []),
        ['g:condition', 'new'],
        ['g:brand', brand],
        ['g:identifier_exists', 'no'],
        ['g:google_product_category', 'Apparel & Accessories > Clothing'],
        ['g:product_type', productType],
        ['g:gender', 'unisex'],
        ['g:age_group', 'adult'],
        ...(r.grouped ? [['g:item_group_id', group] as [string, string]] : []),
        ...(r.size ? [['g:size', r.size] as [string, string]] : []),
        ...(r.color ? [['g:color', strTitle(r.color)] as [string, string]] : []),
      ];
      const ship = `<g:shipping><g:country>PK</g:country><g:service>Standard (cash on delivery)</g:service><g:price>${shipFee.toFixed(2)} PKR</g:price></g:shipping>`;
      items.push(`<item>${fields.map(([k, v]) => `<${k}>${esc(v)}</${k}>`).join('')}${ship}</item>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(brand)}</title>
<link>${esc(env.appUrl)}</link>
<description>${esc(`${brand} products: streetwear with cash on delivery across Pakistan`)}</description>
${items.join('\n')}
</channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=UTF-8', 'Cache-Control': 'public, max-age=3600' } });
}
