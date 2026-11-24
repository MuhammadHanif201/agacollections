import 'server-only';
import { recordAudit } from '@/lib/admin/audit';
import { storePublic } from '@/lib/admin/storage';
import { connectDb } from '@/lib/db';
import { notifyIndexNow } from '@/lib/indexnow';
import { nextId } from '@/models/Counter';
import { Product, type ProductDoc, type ProductVariant } from '@/models/Product';

/**
 * One-off batch (owner's request, Nov 2026): the 450 GSM oversized pullover hoodie in the
 * zip-hoodie colours, at PKR 3,499 with 4,499 crossed out. Each colour is its own product,
 * like the existing "450 GSM Essential Oversized Hoodie - Black". Description, categories,
 * type, tags and cost are copied from that product; photos ship in public/images/new-hoodies.
 * Colours that already exist (same slug) are left alone, so pressing the button twice is safe.
 */
export const TEMPLATE_SLUG = '450-gsm-essential-oversized-hoodie-black';
export const NEW_HOODIE_PRICE = 3499;
export const NEW_HOODIE_COMPARE = 4499;
export const NEW_HOODIE_SIZES = ['S', 'M', 'L', 'XL'];
export const NEW_HOODIES = [
  { color: 'Sky Blue', file: 'sky-blue' },
  { color: 'Light Grey', file: 'light-grey' },
  { color: 'Purple', file: 'purple' },
  { color: 'Charcoal Grey', file: 'charcoal-grey' },
  { color: 'Off-White', file: 'off-white' },
  { color: 'Forest Green', file: 'forest-green' },
  { color: 'Chocolate Brown', file: 'chocolate-brown' },
  { color: 'Navy Blue', file: 'navy-blue' },
] as const;

const nameFor = (color: string) => `450 GSM Essential Oversized Hoodie - ${color}`;
const slugFor = (file: string) => `450-gsm-essential-oversized-hoodie-${file}`;
export const imageFor = (file: string) => `/images/new-hoodies/${file}.webp`;

export interface NewHoodieRow { color: string; name: string; slug: string; image: string; exists: boolean; created?: boolean; error?: string }

export async function newHoodiePlan() {
  await connectDb();
  const template = await Product.findOne({ slug: TEMPLATE_SLUG }).lean();
  const existing = new Set((await Product.find({ slug: { $in: NEW_HOODIES.map((h) => slugFor(h.file)) } }).select('slug').lean()).map((p) => p.slug));
  const rows: NewHoodieRow[] = NEW_HOODIES.map((h) => ({ color: h.color, name: nameFor(h.color), slug: slugFor(h.file), image: imageFor(h.file), exists: existing.has(slugFor(h.file)) }));
  return { template, rows };
}

/** the two hoodies that were on the page first (owner: they stay 1st and 2nd) */
const ORIGINAL_SLUGS = ['450-gsm-essential-oversized-hoodie-dusty-lavender', TEMPLATE_SLUG];

/**
 * Lists sort by sort_order, then newest first, so new products (sort_order 0) jump to the top.
 * Give the new colours a sort_order just after the two original hoodies (fractions, so nothing
 * else in the shop moves), in the order of NEW_HOODIES.
 */
export async function placeAfterOriginals() {
  await connectDb();
  const originals = await Product.find({ slug: { $in: ORIGINAL_SLUGS } }).select('sort_order').lean();
  const base = Math.max(0, ...originals.map((p) => Number(p.sort_order) || 0));
  for (const [i, h] of NEW_HOODIES.entries()) {
    await Product.updateOne({ slug: slugFor(h.file) }, { $set: { sort_order: base + (i + 1) / 100 } }, { timestamps: false });
  }
}

export async function createNewHoodies(origin: string, stock: number, req: Request, adminId: number) {
  const { template, rows } = await newHoodiePlan();
  if (!template) return { rows, error: `The template product (${TEMPLATE_SLUG}) was not found.` };
  const optName = template.options[0]?.name || 'Size';
  const cost = Number(template.cost) || 0;
  const profit = cost > 0 ? NEW_HOODIE_PRICE - cost : 0;
  const margin = cost > 0 ? Math.round(((NEW_HOODIE_PRICE - cost) / NEW_HOODIE_PRICE) * 10000) / 100 : 0;
  const skus = new Set((await Product.find().select('sku variants.sku').lean()).flatMap((p) => [p.sku, ...p.variants.map((v) => v.sku)]).filter(Boolean));
  const t = Math.floor(Date.now() / 1000);
  const created: string[] = [];

  for (const row of rows) {
    if (row.exists) continue;
    try {
      const res = await fetch(origin + row.image, { cache: 'no-store' });
      if (!res.ok) throw new Error(`photo not found (${res.status})`);
      const imagePath = await storePublic(`products/${row.slug}-primary-${t}.webp`, Buffer.from(await res.arrayBuffer()));

      let base = `AGA-450H-${row.color.toUpperCase().replace(/[^A-Z]/g, '')}`;
      for (let n = 2; skus.has(base); n++) base = `AGA-450H-${row.color.toUpperCase().replace(/[^A-Z]/g, '')}-${n}`;
      skus.add(base);
      const variants: ProductVariant[] = [];
      for (const [i, size] of NEW_HOODIE_SIZES.entries()) {
        const sku = `${base}-${size}`;
        skus.add(sku);
        variants.push({
          _id: await nextId('product_variants'), option_values: { [optName]: size }, sku, price: NEW_HOODIE_PRICE, sale_price: null,
          cost, margin, profit, quantity: stock, is_default: i === 0, primary_image: null,
        });
      }
      const now = new Date();
      const id = await nextId('products');
      const doc: Partial<ProductDoc> = {
        _id: id, name: row.name, slug: row.slug, description: template.description ?? null,
        price: NEW_HOODIE_PRICE, sale_price: NEW_HOODIE_COMPARE, cost, profit, margin, sku: base,
        quantity: stock * NEW_HOODIE_SIZES.length, type: template.type ?? null, tags: [...(template.tags ?? [])], status: 'active',
        views: 0, sort_order: 0, is_best_seller: false, is_featured: false,
        category_ids: [...template.category_ids], related_ids: [],
        images: [{ _id: await nextId('product_images'), image_path: imagePath, is_primary: true, created_at: now }],
        variants,
        options: [{ _id: await nextId('product_options'), name: optName, values: await Promise.all(NEW_HOODIE_SIZES.map(async (s) => ({ _id: await nextId('product_option_values'), value: s }))) }],
        created_at: now, updated_at: now,
      };
      await Product.create([doc], { timestamps: false });
      await recordAudit({ event: 'created', type: 'App\\Models\\Product', id, new: { name: row.name, slug: row.slug, price: NEW_HOODIE_PRICE, sale_price: NEW_HOODIE_COMPARE, status: 'active', id }, userId: adminId, req });
      row.created = true;
      created.push(`/product/${row.slug}`);
    } catch (e) {
      row.error = (e as Error).message;
    }
  }
  if (created.length) { await placeAfterOriginals(); await notifyIndexNow([...created, '/shop']); }
  return { rows, error: null };
}
