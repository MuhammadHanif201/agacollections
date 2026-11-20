import 'server-only';
import { connectDb } from '@/lib/db';
import { notifyIndexNow } from '@/lib/indexnow';
import { Category } from '@/models/Category';
import { nextId } from '@/models/Counter';
import { Product, type ProductVariant } from '@/models/Product';

/**
 * Bulk size lists per product family (owner's request): every jeans product sold in waist 26-38,
 * every hoodie in S-XL. Sizes the product already has keep their stock, price, SKU and image;
 * missing sizes are added with stock 0 at the product's price; sizes outside the list are removed.
 * Only products whose variants have a single option (size) are changed; others are listed as skipped.
 */
export const SIZE_SETS = {
  jeans: { label: 'Jeans', sizes: ['26', '28', '30', '32', '34', '36', '38'], match: /jean|denim/i },
  hoodies: { label: 'Hoodies', sizes: ['S', 'M', 'L', 'XL'], match: /hood/i },
} as const;
export type SizeSetKey = keyof typeof SIZE_SETS;
/** products with their own size run, left out of the bulk tool (Balloon Baggy is sold in 22, 24, 26) */
const KEEP_OWN_SIZES = ['balloon-baggy-washed-jeans'];

// size words as stored on some products (Small, X-Large) compare as S, XL
const SIZE_WORDS: Record<string, string> = { 'extra small': 'XS', 'x-small': 'XS', small: 'S', medium: 'M', large: 'L', 'extra large': 'XL', 'x-large': 'XL', 'xx-large': 'XXL', 'extra extra large': 'XXL' };
const normSize = (s: unknown) => { const t = String(s ?? '').trim(); return SIZE_WORDS[t.toLowerCase()] ?? t.toUpperCase(); };

export interface SizePlanRow {
  id: number; name: string; slug: string;
  before: string[]; after: string[]; added: string[]; removed: { size: string; qty: number }[];
  skipped?: string;
}

async function familyProducts(key: SizeSetKey) {
  await connectDb();
  const set = SIZE_SETS[key];
  const cats = await Category.find().select('_id title slug').lean();
  const catIds = new Set(cats.filter((c) => set.match.test(`${c.title} ${(c as { slug?: string }).slug ?? ''}`)).map((c) => c._id));
  const all = await Product.find().sort({ _id: 1 }).lean();
  // by product name first (a product can sit in extra categories), then by category
  return all.filter((p) => {
    if (KEEP_OWN_SIZES.includes(p.slug)) return false;
    const byName = Object.values(SIZE_SETS).find((s) => s.match.test(p.name));
    if (byName) return byName === set;
    return p.category_ids.some((id) => catIds.has(id));
  });
}

function plan(p: Awaited<ReturnType<typeof familyProducts>>[number], key: SizeSetKey): SizePlanRow {
  const target = SIZE_SETS[key].sizes as readonly string[];
  const before = p.variants.map((v) => normSize(Object.values(v.option_values ?? {})[0]));
  const row: SizePlanRow = { id: p._id, name: p.name, slug: p.slug, before, after: [...target], added: [], removed: [] };
  if (!p.variants.length) return { ...row, after: before, skipped: 'no sizes set up' };
  if (p.variants.some((v) => Object.keys(v.option_values ?? {}).length !== 1)) return { ...row, after: before, skipped: 'has more than one option (e.g. colour + size)' };
  row.added = target.filter((s) => !before.includes(s));
  row.removed = p.variants.filter((v) => !target.includes(normSize(Object.values(v.option_values ?? {})[0])))
    .map((v) => ({ size: normSize(Object.values(v.option_values ?? {})[0]), qty: Number(v.quantity ?? 0) }));
  return row;
}

export async function sizePlan(key: SizeSetKey) {
  return (await familyProducts(key)).map((p) => plan(p, key));
}

export async function applySizes(key: SizeSetKey) {
  const target = SIZE_SETS[key].sizes as readonly string[];
  const products = await familyProducts(key);
  const rows: SizePlanRow[] = [];
  const changedSlugs: string[] = [];
  for (const p of products) {
    const row = plan(p, key);
    rows.push(row);
    if (row.skipped || (!row.added.length && !row.removed.length)) continue;

    const optKey = Object.keys(p.variants[0].option_values)[0];
    const prices = [...new Set(p.variants.map((v) => Number(v.price) || 0).filter((n) => n > 0))];
    const newPrice = prices.length === 1 ? prices[0] : Number(p.price) || prices[0] || null;
    const tpl = p.variants[0];
    const skus = new Set(p.variants.map((v) => v.sku).filter(Boolean));
    const base = String(p.sku || tpl.sku?.replace(/-[^-]+$/, '') || `AC-${p._id}`);

    const kept = new Map<string, ProductVariant>();
    for (const v of p.variants) {
      const s = normSize(Object.values(v.option_values ?? {})[0]);
      if (target.includes(s) && !kept.has(s)) kept.set(s, v);
    }
    const next: ProductVariant[] = [];
    for (const s of target) {
      const have = kept.get(s);
      if (have) { next.push(have); continue; }
      let sku = `${base}-${s}`;
      for (let n = 2; skus.has(sku); n++) sku = `${base}-${s}-${n}`;
      skus.add(sku);
      next.push({
        _id: await nextId('product_variants'), option_values: { [optKey]: s }, sku,
        price: newPrice, sale_price: null, cost: tpl.cost ?? null, margin: tpl.margin ?? null, profit: tpl.profit ?? null,
        quantity: 0, is_default: false, primary_image: null,
      });
    }
    if (!next.some((v) => v.is_default)) {
      const d = next.find((v) => Number(v.quantity ?? 0) > 0) ?? next[0];
      d.is_default = true;
    }
    // the option list shown in the admin form follows the sizes
    const options = p.options.length
      ? p.options.map((o, i) => (i === 0 ? { ...o, values: target.map((s) => o.values.find((x) => normSize(x.value) === s) ?? { _id: 0, value: s }) } : o))
      : p.options;
    for (const o of options) for (const v of o.values) if (!v._id) v._id = await nextId('product_option_values');

    await Product.updateOne(
      { _id: p._id },
      { $set: { variants: next, options, quantity: next.reduce((a, v) => a + Number(v.quantity ?? 0), 0), updated_at: new Date() } },
    );
    changedSlugs.push(`/product/${p.slug}`);
  }
  if (changedSlugs.length) await notifyIndexNow([...changedSlugs, '/shop']);
  return rows;
}
