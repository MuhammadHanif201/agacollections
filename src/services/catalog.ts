import 'server-only';
import { cache } from 'react';
import { connectDb } from '@/lib/db';
import { Category } from '@/models/Category';
import { Wishlist } from '@/models/content';
import { Product, type ProductDoc, type ProductVariant } from '@/models/Product';
import type { CardProduct } from '@/types/catalog';

export type { CardProduct };

/** Variant shown on cards: first size in stock, else the first one */
export function firstAvailableVariant(p: Pick<ProductDoc, 'variants'>): ProductVariant | null {
  if (!p.variants.length) return null;
  return p.variants.find((v) => Number(v.quantity ?? 0) > 0) ?? p.variants[0];
}

/** Price a shopper sees on the card (variant price, else product price) */
export function shownPrice(p: Pick<ProductDoc, 'variants' | 'price'>): number {
  const fv = firstAvailableVariant(p);
  return Number(fv ? (fv.price || p.price) : p.price) || 0;
}

export function isInStock(p: Pick<ProductDoc, 'variants' | 'quantity'>): boolean {
  return p.variants.length ? p.variants.some((v) => Number(v.quantity ?? 0) > 0) : Number(p.quantity ?? 0) > 0;
}

const categoryCache = cache(async () => {
  await connectDb();
  const cats = await Category.find().select('_id title slug status').lean();
  return new Map(cats.map((c) => [c._id, c]));
});

/** Plain, serialisable data for product cards (also used by client components) */
export async function toCards(products: ProductDoc[]): Promise<CardProduct[]> {
  const cats = await categoryCache();
  return products.map((p) => {
    const fv = firstAvailableVariant(p);
    return {
      id: p._id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price ?? 0),
      sale_price: p.sale_price != null ? Number(p.sale_price) : null,
      quantity: Number(p.quantity ?? 0),
      images: [...p.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary)).map((i) => i.image_path),
      primary_image: p.images.find((i) => i.is_primary)?.image_path ?? null,
      categories: p.category_ids.flatMap((id) => {
        const c = cats.get(id);
        return c ? [{ title: c.title, slug: c.slug ?? '' }] : [];
      }),
      variants: p.variants.map((v) => ({
        id: v._id,
        option_values: v.option_values ?? {},
        quantity: Number(v.quantity ?? 0),
        price: v.price != null ? Number(v.price) : null,
        sale_price: v.sale_price != null ? Number(v.sale_price) : null,
      })),
      first_variant_id: fv?._id ?? null,
    };
  });
}

/** Product ids on this customer's wishlist */
export async function wishlistIds(customerId: number | null | undefined): Promise<number[]> {
  if (!customerId) return [];
  await connectDb();
  const rows = await Wishlist.find({ user_id: customerId }).select('product_id').lean();
  return [...new Set(rows.map((r) => r.product_id))];
}

/** "Has stock" filter used by the homepage sections */
export const inStockFilter = {
  $or: [
    { variants: { $size: 0 }, quantity: { $gt: 0 } },
    { 'variants.quantity': { $gt: 0 } },
  ],
};

export { Product };
