import 'server-only';
import mongoose from 'mongoose';
import { dbBool, dbDecimal, laravelDirty, recordAudit, type AuditInput } from '@/lib/admin/audit';
import { phpJson } from '@/lib/admin/html';
import { bool, isUpload, list, str, type FormInput, type UploadedFile } from '@/lib/admin/form';
import { Paginator, Str, carbonize, collect } from '@/lib/admin/php';
import { deletePublic, storeImage, storePublic } from '@/lib/admin/storage';
import { validate, type Errors } from '@/lib/admin/validate';
import { fileExtension } from '@/lib/admin/validate';
import { connectDb } from '@/lib/db';
import { Category } from '@/models/Category';
import { nextId } from '@/models/Counter';
import { Order } from '@/models/Order';
import { Product, type ProductDoc, type ProductImage, type ProductOption, type ProductVariant } from '@/models/Product';
import sharp from 'sharp';
import { categoriesById, like, pageParam, productModel } from './models';

/* eslint-disable @typescript-eslint/no-explicit-any */

const T = 'App\\Models\\Product';
const dec = (n: number | null | undefined) => (n === null || n === undefined ? null : Number(n).toFixed(2));

/** DECIMAL columns come out of MySQL as "123.00" (what the edit form fields show) */
function withDecimals(p: any) {
  for (const k of ['price', 'sale_price', 'cost', 'profit', 'margin']) p[k] = dec(p[k]);
  for (const v of p.variants ?? []) for (const k of ['price', 'sale_price', 'cost', 'profit', 'margin']) v[k] = dec(v[k]);
  return p;
}

async function existingTags() {
  const all = await Product.find().sort({ _id: 1 }).select('tags').lean();
  const tags = [...new Set(all.flatMap((p) => (Array.isArray(p.tags) ? p.tags : [])).map((t) => String(t).trim()).filter((t) => t !== ''))];
  return collect(tags.length ? tags : ['summer', 'shirt', 'cotton', 'men', 'sport']);
}

async function allProducts() {
  return collect((await Product.find().sort({ _id: 1 }).lean()).map((p) => productModel(p)));
}

/** ProductController::index */
export async function productIndexData(url: URL) {
  await connectDb();
  const q = url.searchParams;
  const filter: Record<string, unknown> = {};
  const filled = (k: string) => (q.get(k) ?? '').trim() !== '';
  if (filled('name')) filter.name = like(q.get('name')!.trim());
  if (filled('price')) filter.price = Number(q.get('price'));
  if (filled('status')) filter.status = q.get('status')!.trim();
  if (filled('category_id')) filter.category_ids = Number(q.get('category_id'));

  const categories = collect((await Category.find().sort({ title: 1, _id: 1 }).collation({ locale: 'en', strength: 2 }).lean()).map(carbonize));
  const all = await Product.find(filter).sort({ _id: 1 }).lean();
  const totalStockSum = all.reduce((s, p) => s + (p.variants.length ? p.variants.reduce((a, v) => a + Number(v.quantity ?? 0), 0) : Number(p.quantity ?? 0)), 0);
  const cats = await categoriesById(all.flatMap((p) => p.category_ids));

  let products: any;
  if (q.get('show') === 'all') {
    products = collect(all.map((p) => productModel(p, cats)));
  } else {
    const perPage = 10;
    const page = pageParam(url);
    const sorted = [...all].sort((a, b) => b.created_at.getTime() - a.created_at.getTime() || b._id - a._id);
    products = Paginator.make(sorted.slice((page - 1) * perPage, page * perPage).map((p) => productModel(p, cats)), all.length, perPage, page)
      .appends(Object.fromEntries(q));
  }
  return { products, totalStockSum, categories };
}

/** ProductController::create */
export async function productCreateData() {
  await connectDb();
  return {
    categories: collect((await Category.find().sort({ _id: 1 }).lean()).map(carbonize)),
    allProducts: await allProducts(),
    existingTags: await existingTags(),
  };
}

/** ProductController::edit */
export async function productEditData(id: number) {
  await connectDb();
  const p = await Product.findById(id).lean();
  if (!p) return null;
  const cats = await categoriesById(p.category_ids);
  const product = withDecimals(productModel(p, cats));
  const related = await Product.find({ _id: { $in: p.related_ids ?? [] } }).sort({ _id: 1 }).lean();
  product.relatedProducts = collect(related.map((r) => productModel(r)));
  const orderCount = (await Order.aggregate<{ n: number }>([{ $unwind: '$items' }, { $match: { 'items.product_id': id } }, { $count: 'n' }]))[0]?.n ?? 0;
  return {
    product,
    productVariants: product.variants,
    categories: collect((await Category.find().sort({ _id: 1 }).lean()).map(carbonize)),
    allProducts: await allProducts(),
    existingTags: await existingTags(),
    orderCount,
  };
}

function tagsFrom(input: FormInput, strict: boolean): string[] {
  const raw = str(input, 'tags');
  if (!raw) return [];
  try {
    const decoded = JSON.parse(raw);
    if (!Array.isArray(decoded)) return [];
    return decoded.filter((t) => (strict ? t && t.value : t && t.value !== undefined && t.value !== null)).map((t) => String(t.value));
  } catch { return []; }
}

const num = (v: string | null) => (v === null || v === '' ? null : Number(v));
const unix = () => Math.floor(Date.now() / 1000);

/** Variant pictures were saved as JPEG (quality 80) or kept as WebP, without resizing */
async function storeVariantImage(file: UploadedFile, base: string) {
  if (fileExtension(file) === 'webp') return storePublic(`${base}.webp`, await file.bytes());
  return storePublic(`${base}.jpg`, await sharp(await file.bytes()).jpeg({ quality: 80 }).toBuffer());
}

/** audit values of a product image / option / size, as their models stored them */
const imageAudit = (event: 'created' | 'deleted', productId: number, img: ProductImage): AuditInput =>
  event === 'created'
    ? { event, type: 'App\\Models\\ProductImage', id: img._id, new: { image_path: img.image_path, is_primary: img.is_primary ? 1 : 0, product_id: productId, id: img._id } }
    : { event, type: 'App\\Models\\ProductImage', id: img._id, old: { id: img._id, product_id: productId, image_path: img.image_path, is_primary: img.is_primary ? 1 : 0 } };
const optionAudits = (productId: number, options: ProductOption[]): AuditInput[] => options.flatMap((o) => [
  { event: 'created' as const, type: 'App\\Models\\ProductOption', id: o._id, new: { name: o.name, product_id: productId, id: o._id } },
  ...o.values.map((v) => ({ event: 'created' as const, type: 'App\\Models\\ProductOptionValue', id: v._id, new: { value: v.value, product_option_id: o._id, id: v._id } })),
]);
/** A size as MySQL returned it (for the "old" side of an audit row) */
const variantDb = (v: ProductVariant) => ({
  option_values: phpJson(v.option_values ?? {}), sku: v.sku ?? null, price: dbDecimal(v.price), cost: dbDecimal(v.cost), margin: dbDecimal(v.margin),
  profit: dbDecimal(v.profit), quantity: v.quantity ?? null, is_default: dbBool(v.is_default), primary_image: v.primary_image ?? null,
});
/** A size as the PHP set it from the form (the "new" side): form fields stay text */
const variantTyped = (row: any, decoded: Record<string, string>, cost: string | null, margin: number, profit: number, isDefault: boolean, image: string | null, update: boolean) => ({
  option_values: phpJson(decoded),
  sku: update ? row?.sku || null : row?.sku ?? null,
  price: update ? row?.price || null : row?.price ?? null,
  quantity: row?.quantity ?? 0,
  cost, margin, profit, is_default: isDefault, primary_image: image,
});
const VARIANT_COLUMNS = ['option_values', 'sku', 'price', 'sale_price', 'cost', 'margin', 'profit', 'quantity', 'is_default', 'primary_image'];
const PRODUCT_COLUMNS = ['name', 'slug', 'description', 'price', 'sale_price', 'cost', 'margin', 'profit', 'sku', 'quantity', 'type', 'tags', 'status', 'is_best_seller', 'is_featured'];

const optionsKey = (o: Record<string, unknown> | null | undefined) =>
  JSON.stringify(Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k.trim().toLowerCase(), String(v ?? '').trim().toLowerCase()]).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))));

const imageRules = 'nullable|image|mimes:jpeg,png,jpg,gif,webp';

export async function validateProduct(input: FormInput, id: number | null): Promise<Errors> {
  const rules: Record<string, any> = {
    name: 'required|string|max:255',
    category_ids: 'required|array',
    description: 'nullable|string',
    price: 'nullable|numeric|min:0',
    sale_price: 'nullable|numeric|min:0',
    cost: 'nullable|numeric|min:0',
    profit: 'nullable|numeric|min:0',
    margin: 'nullable|numeric|min:0',
    primary_image: id ? imageRules + '|max:2048' : imageRules,
    'additional_images.*': id ? imageRules + '|max:2048' : imageRules,
    type: 'nullable|string|max:255',
    tags: 'nullable|string',
    status: 'nullable|in:active,draft',
    'options.*.name': 'nullable|string|max:255',
    'options.*.values': 'nullable|string|max:255',
    'variants.*.option_values': 'nullable|string',
    'variants.*.sku': 'nullable|string|max:255',
    'variants.*.price': 'nullable|numeric|min:0',
    'variants.*.quantity': id ? 'nullable|numeric|min:0' : 'nullable|integer|min:0',
    'variant_images.*': imageRules + '|max:2048',
  };
  if (id) {
    rules.slug = ['nullable', 'string', 'max:255', { name: 'unique', test: async (v: unknown) => !(await Product.exists({ slug: String(v), _id: { $ne: id } })) }];
    rules.sku = ['nullable', 'string', 'max:255', { name: 'unique', test: async (v: unknown) => !(await Product.exists({ sku: String(v), _id: { $ne: id } })) }];
  }
  return validate(input, rules);
}

function buildOptions(input: FormInput, skipEmpty: boolean, ids: { opt: () => Promise<number>; val: () => Promise<number> }) {
  return (async () => {
    const out: ProductOption[] = [];
    for (const opt of list(input, 'options') as any[]) {
      if (!opt || typeof opt !== 'object') continue;
      if (skipEmpty ? !opt.name || !opt.values : opt.name === undefined || opt.values === undefined || opt.name === null || opt.values === null) continue;
      const o: ProductOption = { _id: await ids.opt(), name: opt.name, values: [] };
      for (let val of String(opt.values).split(',')) {
        val = val.trim();
        if (skipEmpty && val === '') continue;
        o.values.push({ _id: await ids.val(), value: val });
      }
      out.push(o);
    }
    return out;
  })();
}

const relatedIds = (input: FormInput) => (list(input, 'related_products') as any[]).map(Number).filter((n) => Number.isInteger(n));

/** ProductController::store */
export async function storeProduct(input: FormInput, req: Request, adminId: number) {
  const tags = tagsFrom(input, false);
  const name = str(input, 'name')!;
  const price = num(str(input, 'price')) ?? 0;
  const cost = num(str(input, 'cost')) ?? 0;
  const profit = cost > 0 ? price - cost : 0;
  const margin = price > 0 && cost >= 0 ? Math.round(((price - cost) / price) * 100 * 100) / 100 : 0;
  const slug = str(input, 'slug') || Str.slug(name);
  const now = new Date();
  const id = await nextId('products');
  const t = unix();
  const s = Str.slug(name);
  const created: string[] = [];

  try {
    const images: ProductImage[] = [];
    if (isUpload(input.primary_image)) {
      const p = await storeImage(input.primary_image, `products/${s}-primary-${t}`); created.push(p);
      images.push({ _id: await nextId('product_images'), image_path: p, is_primary: true, created_at: now });
    }
    for (const [i, img] of Object.entries((input.additional_images ?? {}) as Record<string, unknown>)) {
      if (!isUpload(img)) continue;
      const p = await storeImage(img, `products/${s}-additional-${i}-${t}`); created.push(p);
      images.push({ _id: await nextId('product_images'), image_path: p, is_primary: false, created_at: now });
    }
    const options = await buildOptions(input, false, { opt: () => nextId('product_options'), val: () => nextId('product_option_values') });
    const variants: ProductVariant[] = [];
    const vImgs = (input.variant_images ?? {}) as Record<string, unknown>;
    for (const [index, v] of Object.entries((input.variants ?? {}) as Record<string, any>)) {
      let decoded: Record<string, string> = {};
      try { decoded = JSON.parse(v?.option_values ?? '{}') || {}; } catch { decoded = {}; }
      let img: string | null = null;
      if (isUpload(vImgs[index])) { img = await storeVariantImage(vImgs[index] as UploadedFile, `products/variants/${s}-v${index}-${t}`); created.push(img); }
      variants.push({
        _id: await nextId('product_variants'), option_values: decoded, sku: v?.sku ?? null, price: num(v?.price ?? null), quantity: Number(v?.quantity ?? 0),
        cost, margin, profit, is_default: str(input, 'default_variant') !== null && Number(str(input, 'default_variant')) === Number(index), primary_image: img,
      } as ProductVariant);
    }
    const doc: Partial<ProductDoc> = {
      _id: id, name, slug, description: str(input, 'description'), price, sale_price: num(str(input, 'sale_price')), cost, profit, margin,
      sku: str(input, 'sku'), quantity: Number(str(input, 'quantity') ?? 0), is_best_seller: 'is_best_seller' in input, is_featured: 'is_featured' in input,
      type: str(input, 'type') || 'General Sports Product', tags, status: (str(input, 'status') ?? 'active') as 'active',
      views: 0, sort_order: 0, category_ids: (list(input, 'category_ids') as any[]).map(Number), related_ids: 'related_products' in input ? relatedIds(input) : [],
      images, variants, options, created_at: now, updated_at: now,
    };
    if (variants.length) doc.quantity = variants.reduce((a, v) => a + Number(v.quantity ?? 0), 0);
    await Product.create([doc], { timestamps: false });
    // Audit rows hold the values as the PHP set them: form fields as text, computed ones as numbers
    const rawPrice = str(input, 'price') ?? 0, rawCost = str(input, 'cost') ?? 0;
    const typedQty = 'quantity' in input ? str(input, 'quantity') : 0;
    await recordAudit({ event: 'created', type: T, id, new: {
      name, slug, description: doc.description, price: rawPrice, sale_price: str(input, 'sale_price'), cost: rawCost, profit, margin, sku: doc.sku,
      quantity: typedQty, is_best_seller: doc.is_best_seller, is_featured: doc.is_featured, type: doc.type, tags: phpJson(tags), status: doc.status, id,
    }, userId: adminId, req });
    // the related rows, in the order the PHP created them
    const rawRows = Object.values((input.variants ?? {}) as Record<string, any>);
    const rows: AuditInput[] = [
      ...images.map((img) => imageAudit('created', id, img)),
      ...optionAudits(id, options),
      ...variants.map((v, i) => ({ event: 'created' as const, type: 'App\\Models\\ProductVariant', id: v._id, new: {
        product_id: id, ...variantTyped(rawRows[i], v.option_values, rawCost === 0 ? '0' : String(rawCost), margin, profit, v.is_default, v.primary_image ?? null, false), id: v._id,
      } })),
    ];
    const sync = laravelDirty({ quantity: typedQty }, { quantity: doc.quantity }, ['quantity']);
    if (variants.length && sync.changed) rows.push({ event: 'updated', type: T, id, old: sync.old, new: sync.new });
    for (const a of rows) await recordAudit({ ...a, userId: adminId, req });
    return { ok: true as const };
  } catch (e) {
    for (const p of created) await deletePublic(p);
    return { ok: false as const, message: 'Something went wrong: ' + (e as Error).message };
  }
}

/** ProductController::update */
export async function updateProduct(id: number, input: FormInput, req: Request, adminId: number) {
  await connectDb();
  const before = await Product.findById(id).lean();
  if (!before) return { ok: false as const, notFound: true };
  const tags = tagsFrom(input, true);
  const name = str(input, 'name')!;
  const s = Str.slug(name);
  const t = unix();
  const now = new Date();
  const toDelete: string[] = [];
  const created: string[] = [];
  const pre: AuditInput[] = [];
  const post: AuditInput[] = [];
  try {
    let images = [...before.images];
    if (bool(input, 'remove_primary_image')) {
      const primary = images.find((i) => i.is_primary);
      if (primary) { toDelete.push(primary.image_path); images = images.filter((i) => i !== primary); pre.push(imageAudit('deleted', id, primary)); }
    }
    const removeIds = (list(input, 'remove_additional_ids') as any[]).map((x) => parseInt(String(x), 10));
    if (removeIds.length) {
      for (const img of images.filter((i) => removeIds.includes(i._id) && !i.is_primary)) { toDelete.push(img.image_path); pre.push(imageAudit('deleted', id, img)); }
      images = images.filter((i) => !(removeIds.includes(i._id) && !i.is_primary));
    }
    const price = num(str(input, 'price'));
    const cost = num(str(input, 'cost'));
    const profit = (cost ?? 0) > 0 ? (price ?? 0) - (cost ?? 0) : 0;
    const margin = (cost ?? 0) > 0 && (price ?? 0) > 0 ? Math.round((((price ?? 0) - (cost ?? 0)) / (price ?? 1)) * 100 * 100) / 100 : 0;

    if (isUpload(input.primary_image)) {
      images = images.filter((i) => !i.is_primary); // the old row goes, its file stays (as before)
      const p = await storeImage(input.primary_image, `products/${s}-primary-${t}`); created.push(p);
      images.push({ _id: await nextId('product_images'), image_path: p, is_primary: true, created_at: now });
      post.push(imageAudit('created', id, images[images.length - 1]));
    }
    const additional = Object.entries((input.additional_images ?? {}) as Record<string, unknown>).filter(([, f]) => isUpload(f));
    if (additional.length) {
      images = images.filter((i) => i.is_primary);
      for (const [i, img] of additional) {
        const p = await storeImage(img as UploadedFile, `products/${s}-additional-${i}-${t}`); created.push(p);
        images.push({ _id: await nextId('product_images'), image_path: p, is_primary: false, created_at: now });
        post.push(imageAudit('created', id, images[images.length - 1]));
      }
    }
    const options = await buildOptions(input, true, { opt: () => nextId('product_options'), val: () => nextId('product_option_values') });
    post.push(...optionAudits(id, options));

    let variants = [...before.variants];
    // Sizes priced the same as the product follow a change of the product price; a size with
    // its own price keeps it (the form re-sends every size's old price with the new product price)
    const oldPrice = before.price != null ? Number(before.price) : null;
    const followPrice = price !== null && oldPrice !== null && price !== oldPrice;
    if ('variants' in input) {
      const updated: number[] = [];
      const next: ProductVariant[] = [];
      const vImgs = (input.variant_images ?? {}) as Record<string, unknown>;
      const removeImg = (input.remove_variant_image ?? {}) as Record<string, unknown>;
      for (const [index, raw] of Object.entries((input.variants ?? {}) as Record<string, any>)) {
        const v = followPrice && raw?.price && Number(raw.price) === oldPrice ? { ...raw, price: String(price) } : raw;
        let decoded: Record<string, string> = {};
        try { decoded = JSON.parse(v?.option_values ?? '{}') || {}; } catch { decoded = {}; }
        const dbId = v?.id ? parseInt(String(v.id), 10) : null;
        let existing = dbId ? before.variants.find((x) => x._id === dbId) : undefined;
        if (!existing) { const key = optionsKey(decoded); existing = before.variants.find((x) => !updated.includes(x._id) && optionsKey(x.option_values) === key); }
        let img = existing?.primary_image ?? null;
        if (isUpload(vImgs[index])) {
          if (img) toDelete.push(img);
          img = await storeVariantImage(vImgs[index] as UploadedFile, `products/variants/${s}-v${index}-${t}`); created.push(img);
        } else if (index in removeImg) {
          if (img) toDelete.push(img);
          img = null;
        }
        const data = {
          option_values: decoded, sku: v?.sku || null, price: v?.price ? Number(v.price) : null, quantity: Number(v?.quantity ?? 0),
          cost, margin, profit, is_default: String(str(input, 'default_variant') ?? '') === String(index), primary_image: img,
        };
        const typedRow = variantTyped(v, decoded, str(input, 'cost'), margin, profit, data.is_default, img, true);
        if (existing) {
          next.push({ ...existing, ...data } as ProductVariant); updated.push(existing._id);
          const d = laravelDirty(variantDb(existing), typedRow, VARIANT_COLUMNS);
          if (d.changed) post.push({ event: 'updated', type: 'App\\Models\\ProductVariant', id: existing._id, old: d.old, new: d.new });
        } else {
          const nid = await nextId('product_variants'); next.push({ _id: nid, ...data } as ProductVariant); updated.push(nid);
          post.push({ event: 'created', type: 'App\\Models\\ProductVariant', id: nid, new: { ...typedRow, product_id: id, id: nid } });
        }
      }
      variants = next;
    }

    const set: Partial<ProductDoc> = {
      name, slug: str(input, 'slug') || s, description: str(input, 'description'), price, sale_price: num(str(input, 'sale_price')), cost, profit, margin,
      sku: str(input, 'sku') || null, quantity: Number(str(input, 'quantity') ?? 0), is_best_seller: 'is_best_seller' in input, is_featured: 'is_featured' in input,
      type: str(input, 'type'), tags, status: str(input, 'status') as 'active',
      category_ids: (list(input, 'category_ids') as any[]).map(Number), images, options, variants, updated_at: now,
    };
    if ('related_products' in input) set.related_ids = relatedIds(input);
    if (variants.length) set.quantity = variants.reduce((a, v) => a + Number(v.quantity ?? 0), 0);

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Product.updateOne({ _id: id }, { $set: set }, { session, timestamps: false });
      });
    } finally { await session.endSession(); }
    for (const p of toDelete) await deletePublic(p);

    // Two audit rows, as before: the form's values, then the stock total of the sizes
    const dbRow = {
      name: before.name, slug: before.slug, description: before.description ?? null, price: dbDecimal(before.price), sale_price: dbDecimal(before.sale_price),
      cost: dbDecimal(before.cost), margin: dbDecimal(before.margin), profit: dbDecimal(before.profit), sku: before.sku ?? null, quantity: before.quantity ?? null,
      type: before.type ?? null, tags: phpJson(before.tags ?? []), status: before.status, is_best_seller: dbBool(before.is_best_seller), is_featured: dbBool(before.is_featured),
    };
    const typedQty = 'quantity' in input ? str(input, 'quantity') : 0;
    const typedRow = {
      name, slug: set.slug, description: set.description, price: str(input, 'price'), sale_price: str(input, 'sale_price'), cost: str(input, 'cost'), profit, margin,
      sku: set.sku, quantity: typedQty, is_best_seller: set.is_best_seller, is_featured: set.is_featured, type: set.type, tags: phpJson(tags), status: set.status,
    };
    const first = laravelDirty(dbRow, typedRow, PRODUCT_COLUMNS);
    for (const a of pre) await recordAudit({ ...a, userId: adminId, req });
    if (first.changed) await recordAudit({ event: 'updated', type: T, id, old: first.old, new: first.new, userId: adminId, req });
    for (const a of post) await recordAudit({ ...a, userId: adminId, req });
    const sync = laravelDirty({ quantity: typedQty }, { quantity: set.quantity }, ['quantity']);
    if (variants.length && sync.changed) await recordAudit({ event: 'updated', type: T, id, old: sync.old, new: sync.new, userId: adminId, req });
    return { ok: true as const };
  } catch (e) {
    for (const p of created) await deletePublic(p);
    return { ok: false as const, message: 'Something went wrong: ' + (e as Error).message };
  }
}

/** ProductController::destroy */
export async function destroyProduct(id: number, req: Request, adminId: number) {
  await connectDb();
  const p = await Product.findById(id).lean();
  if (!p) return { notFound: true as const };
  const orderCount = (await Order.aggregate<{ n: number }>([{ $unwind: '$items' }, { $match: { 'items.product_id': id } }, { $count: 'n' }]))[0]?.n ?? 0;
  if (orderCount > 0) return { blocked: `Cannot delete "${p.name}" — it appears in ${orderCount} order(s). Set the product status to Inactive instead.` };
  await Product.deleteOne({ _id: id });
  await Product.updateMany({ related_ids: id }, { $pull: { related_ids: id } });
  // the products row as MySQL held it, in column order
  await recordAudit({ event: 'deleted', type: T, id, userId: adminId, req, old: {
    id, name: p.name, slug: p.slug, description: p.description ?? null, price: dbDecimal(p.price), sale_price: dbDecimal(p.sale_price), cost: dbDecimal(p.cost),
    margin: dbDecimal(p.margin), profit: dbDecimal(p.profit), sku: p.sku ?? null, quantity: p.quantity ?? null, type: p.type ?? null, tags: phpJson(p.tags ?? []),
    status: p.status, views: p.views ?? 0, sort_order: p.sort_order ?? 0, is_best_seller: dbBool(p.is_best_seller), is_featured: dbBool(p.is_featured),
  } });
  return { ok: true as const };
}

/** ProductController::sort (query-builder updates: no audit rows, as before) */
export async function sortProducts(order: unknown[]) {
  await connectDb();
  await Promise.all(order.map((id, i) => Product.updateOne({ _id: Number(id) }, { $set: { sort_order: i + 1 } }, { timestamps: false })));
}
