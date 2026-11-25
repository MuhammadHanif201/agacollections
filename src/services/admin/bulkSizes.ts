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
 * Size-only products and colour + size products with one colour are changed; products with several colours are listed as skipped.
 */
export const SIZE_SETS = {
  jeans: { label: 'Jeans', sizes: ['26', '28', '30', '32', '34', '36', '38'], match: /jean|denim/i },
  hoodies: { label: 'Hoodies', sizes: ['S', 'M', 'L', 'XL'], match: /hood/i },
  // one product with its own run (owner's request): 22 and 24 as well as 26-38
  balloon: { label: 'Balloon Baggy', sizes: ['22', '24', '26', '28', '30', '32', '34', '36', '38'], match: /^balloon-baggy-washed-jeans$/, slugOnly: true },
} as const;
export type SizeSetKey = keyof typeof SIZE_SETS;
/** products with their own size run, left out of the jeans/hoodies sets (Balloon Baggy has its own tab) */
const KEEP_OWN_SIZES = ['balloon-baggy-washed-jeans'];

// size words as stored on some products (Small, X-Large) compare as S, XL
const SIZE_WORDS: Record<string, string> = { 'extra small': 'XS', 'x-small': 'XS', small: 'S', medium: 'M', large: 'L', 'extra large': 'XL', 'x-large': 'XL', 'xx-large': 'XXL', 'extra extra large': 'XXL' };
const normSize = (s: unknown) => { const t = String(s ?? '').trim(); return SIZE_WORDS[t.toLowerCase()] ?? t.toUpperCase(); };

/** the option that holds the size: the one named "size", or the only option */
function sizeKeyOf(variants: ProductVariant[]): string | null {
  const keys = [...new Set(variants.flatMap((v) => Object.keys(v.option_values ?? {})))];
  return keys.find((k) => /size/i.test(k)) ?? (keys.length === 1 ? keys[0] : null);
}
/** the other options (e.g. Color) must have a single value, so each size maps to one row */
function fixedOthers(variants: ProductVariant[], sizeKey: string): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const v of variants) for (const [k, val] of Object.entries(v.option_values ?? {})) {
    if (k === sizeKey) continue;
    if (k in out && out[k] !== val) return null;
    out[k] = val;
  }
  return out;
}

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
  if ('slugOnly' in set) return all.filter((p) => set.match.test(p.slug));
  return all.filter((p) => {
    if (KEEP_OWN_SIZES.includes(p.slug)) return false;
    const byName = Object.values(SIZE_SETS).find((s) => !('slugOnly' in s) && s.match.test(p.name));
    if (byName) return byName === set;
    return p.category_ids.some((id) => catIds.has(id));
  });
}

function plan(p: Awaited<ReturnType<typeof familyProducts>>[number], key: SizeSetKey): SizePlanRow {
  const target = SIZE_SETS[key].sizes as readonly string[];
  const sizeKey = sizeKeyOf(p.variants);
  const sizeOf = (v: ProductVariant) => normSize(sizeKey ? v.option_values?.[sizeKey] : Object.values(v.option_values ?? {})[0]);
  const before = p.variants.map(sizeOf);
  const row: SizePlanRow = { id: p._id, name: p.name, slug: p.slug, before, after: [...target], added: [], removed: [] };
  if (!p.variants.length) return { ...row, after: before, skipped: 'no sizes set up' };
  // colour + size is fine when there is one colour (each size is one row); several colours are left alone
  if (!sizeKey || !fixedOthers(p.variants, sizeKey)) return { ...row, after: before, skipped: 'has several colours (or no size option)' };
  row.added = target.filter((s) => !before.includes(s));
  row.removed = p.variants.filter((v) => !target.includes(sizeOf(v))).map((v) => ({ size: sizeOf(v), qty: Number(v.quantity ?? 0) }));
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

    const optKey = sizeKeyOf(p.variants)!;
    const others = fixedOthers(p.variants, optKey) ?? {};
    const prices = [...new Set(p.variants.map((v) => Number(v.price) || 0).filter((n) => n > 0))];
    const newPrice = prices.length === 1 ? prices[0] : Number(p.price) || prices[0] || null;
    const tpl = p.variants[0];
    const skus = new Set(p.variants.map((v) => v.sku).filter(Boolean));
    const base = String(p.sku || tpl.sku?.replace(/-[^-]+$/, '') || `AC-${p._id}`);

    const kept = new Map<string, ProductVariant>();
    for (const v of p.variants) {
      const s = normSize(v.option_values?.[optKey]);
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
        _id: await nextId('product_variants'), option_values: { ...others, [optKey]: s }, sku,
        price: newPrice, sale_price: null, cost: tpl.cost ?? null, margin: tpl.margin ?? null, profit: tpl.profit ?? null,
        quantity: 0, is_default: false, primary_image: null,
      });
    }
    if (!next.some((v) => v.is_default)) {
      const d = next.find((v) => Number(v.quantity ?? 0) > 0) ?? next[0];
      d.is_default = true;
    }
    // the size option in the admin form follows the sizes (matched by name, else the only option)
    const sizeOpt = p.options.findIndex((o) => o.name.trim().toLowerCase() === optKey.trim().toLowerCase());
    const optIdx = sizeOpt >= 0 ? sizeOpt : p.options.length === 1 ? 0 : -1;
    const options = p.options.length
      ? p.options.map((o, i) => (i === optIdx ? { ...o, values: target.map((s) => o.values.find((x) => normSize(x.value) === s) ?? { _id: 0, value: s }) } : o))
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
