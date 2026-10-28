import 'server-only';
// Eloquent-style view models for the admin views: lean documents with their relations
// attached and Dates as Carbon, so the ported Blade views read them as before.
import { carbonize, collect } from '@/lib/admin/php';
import { Category, type CategoryDoc } from '@/models/Category';
import { Customer, type CustomerDoc } from '@/models/Customer';
import { variantLabelFor, type OrderDoc } from '@/models/Order';
import { Product, type ProductDoc } from '@/models/Product';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function customersById(ids: number[]) {
  const list = ids.length ? await Customer.find({ _id: { $in: [...new Set(ids)] } }).lean() : [];
  return new Map<number, CustomerDoc>(list.map((c) => [c._id, c]));
}

export async function productsById(ids: number[]) {
  const list = ids.length ? await Product.find({ _id: { $in: [...new Set(ids)] } }).lean() : [];
  return new Map<number, ProductDoc>(list.map((p) => [p._id, p]));
}

export async function categoriesById(ids: number[]) {
  const list = ids.length ? await Category.find({ _id: { $in: [...new Set(ids)] } }).lean() : [];
  return new Map<number, CategoryDoc>(list.map((c) => [c._id, c]));
}

/** $product with images, variants (option_values), primaryImage and its categories */
export function productModel(p: ProductDoc | null | undefined, cats?: Map<number, CategoryDoc>): any {
  if (!p) return null;
  const doc = carbonize(p);
  doc.images = collect(p.images.map((i) => carbonize({ ...i, product_id: p._id })));
  doc.variants = collect([...p.variants].sort((a, b) => a._id - b._id).map((v) => carbonize({ ...v, product_id: p._id })));
  doc.primaryImage = doc.images.first((i: any) => i.is_primary) ?? null;
  if (cats) doc.category = collect(p.category_ids.map((id) => carbonize(cats.get(id))).filter(Boolean));
  return doc;
}

/** $order with customer, items (product, variant, options_label) and the contact_* accessors */
export function orderModel(o: OrderDoc, customer: CustomerDoc | null | undefined, products: Map<number, ProductDoc>): any {
  const doc = carbonize(o);
  const c = customer ? carbonize(customer) : null;
  doc.customer = c;
  doc.items = collect(o.items.map((it) => {
    const p = products.get(it.product_id);
    const v = it.variant_id ? p?.variants.find((x) => x._id === it.variant_id) ?? null : null;
    const item = carbonize({ ...it, order_id: o._id });
    item.product = productModel(p);
    item.variant = v ? carbonize({ ...v, product_id: p!._id }) : null;
    item.options_label = it.variant_label ? it.variant_label : variantLabelFor(v?.option_values);
    return item;
  }));
  // DECIMAL(10,2) columns arrive as "123.00" strings (so "0.00" is truthy in the views)
  for (const k of ['subtotal', 'shipping', 'discount', 'total']) if (doc[k] !== null && doc[k] !== undefined) doc[k] = Number(doc[k]).toFixed(2);
  for (const it of doc.items) for (const k of ['price', 'total']) if (it[k] !== null && it[k] !== undefined) it[k] = Number(it[k]).toFixed(2);
  doc.contact_name = o.shipping_name || c?.full_name || null;
  doc.contact_email = o.shipping_email || c?.email || null;
  doc.contact_phone = o.shipping_phone || c?.phone || null;
  doc.contact_address = o.shipping_address || c?.address || null;
  doc.contact_city = o.shipping_city || c?.city || null;
  return doc;
}

/** Many orders with their customers and products loaded in two queries */
export async function orderModels(orders: OrderDoc[]) {
  const [customers, products] = await Promise.all([
    customersById(orders.map((o) => o.customer_id)),
    productsById(orders.flatMap((o) => o.items.map((i) => i.product_id))),
  ]);
  return orders.map((o) => orderModel(o, customers.get(o.customer_id), products));
}

/** LIKE '%term%' on a MySQL *_ci column */
export const like = (term: string) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

/** ?page= as Laravel reads it */
export const pageParam = (url: URL, name = 'page') => {
  const n = Number(url.searchParams.get(name));
  return Number.isInteger(n) && n > 0 ? n : 1;
};
