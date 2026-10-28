import 'server-only';
import type { PipelineStage } from 'mongoose';
import { connectDb } from '@/lib/db';
import { Category, type CategoryDoc } from '@/models/Category';
import { Product, type ProductDoc } from '@/models/Product';
import { activeProductCounts } from './settings';

export const PER_PAGE = 18;

type Query = Record<string, string | string[] | undefined>;

const scalar = (v: string | string[] | undefined): string | null => (typeof v === 'string' ? v : null);
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** ?size= accepts a string, JSON array, comma list or size[]=… */
function parseSizes(q: Query): string[] {
  let raw: unknown = q['size'] ?? q['size[]'] ?? [];
  if (typeof raw === 'string') {
    const str = raw;
    try {
      const j = JSON.parse(str);
      raw = Array.isArray(j) ? j : str.split(/\s*,\s*/).filter(Boolean);
    } catch {
      raw = str.split(/\s*,\s*/).filter(Boolean);
    }
  }
  const list = (Array.isArray(raw) ? raw : []).filter((v) => typeof v === 'string' || typeof v === 'number').map((v) => String(v).trim()).filter(Boolean);
  return [...new Set(list)];
}

/**
 * The price a shopper sees on the card: the first size in stock (else the first size),
 * falling back to the product price when that size has none.
 */
const shownPriceExpr = {
  $let: {
    vars: {
      v: {
        $ifNull: [
          { $first: { $sortArray: { input: { $filter: { input: '$variants', cond: { $gt: [{ $ifNull: ['$$this.quantity', 0] }, 0] } } }, sortBy: { _id: 1 } } } },
          { $first: { $sortArray: { input: '$variants', sortBy: { _id: 1 } } } },
        ],
      },
    },
    in: {
      $cond: [
        { $and: [{ $ne: ['$$v', null] }, { $ne: [{ $ifNull: ['$$v.price', 0] }, 0] }] },
        '$$v.price',
        '$price',
      ],
    },
  },
};

export interface ShopResult {
  products: ProductDoc[];
  total: number;
  page: number;
  lastPage: number;
  selectedCategory: CategoryDoc | null;
  mainCategories: (CategoryDoc & { products_count: number })[];
}

/** ClientController::shop. Returns null when the category slug is unknown or hidden (404). */
export async function shopQuery(slug: string | null, q: Query): Promise<ShopResult | null> {
  await connectDb();
  let selectedCategory: CategoryDoc | null = null;
  if (slug) {
    selectedCategory = await Category.findOne({ slug, status: 'active' }).lean();
    if (!selectedCategory) return null;
  }

  const counts = await activeProductCounts();
  const mainCategories = (await Category.find({ status: 'active' }).sort({ sort_order: 1, _id: 1 }).lean())
    .map((c) => ({ ...c, products_count: counts.get(c._id) ?? 0 }))
    .filter((c) => c.products_count > 0);

  const search = scalar(q.search);
  const sizesUp = parseSizes(q).map((s) => s.toUpperCase());
  const wantKids = sizesUp.includes('KIDS') || sizesUp.includes('KID');
  const sizes = sizesUp.filter((s) => s !== 'KIDS' && s !== 'KID');
  const color = scalar(q.color);
  const tag = scalar(q.tag);
  const sort = scalar(q.sort);
  const minPrice = Number(scalar(q.min_price) ?? 0) || 0;
  const maxPriceRaw = scalar(q.max_price);
  // No upper bound unless the shopper sets one (a fixed 10,000 cap hid dearer products)
  const maxPrice = maxPriceRaw === null || maxPriceRaw === '' ? null : Number(maxPriceRaw) || 0;
  const kidName = { name: { $regex: 'kid', $options: 'i' } };

  const and: Record<string, unknown>[] = [{ status: 'active' }];
  if (selectedCategory) {
    and.push(wantKids ? { $or: [{ category_ids: selectedCategory._id }, kidName] } : { category_ids: selectedCategory._id });
  } else if (wantKids) {
    and.push(kidName);
  }
  if (search) {
    const re = { $regex: escapeRegex(search), $options: 'i' };
    and.push({ $or: [{ name: re }, { description: re }, { sku: re }, { tags: re }] });
  }
  if (wantKids || sizes.length) {
    const or: Record<string, unknown>[] = [];
    if (sizes.length) {
      or.push({
        variants: {
          $elemMatch: {
            $or: sizes.flatMap((s) => [
              { 'option_values.size': { $regex: `^${escapeRegex(s)}$`, $options: 'i' } },
              { 'option_values.Size': { $regex: `^${escapeRegex(s)}$`, $options: 'i' } },
            ]),
          },
        },
      });
    }
    if (wantKids) or.push(kidName);
    and.push({ $or: or });
  }
  if (color) {
    const re = { $regex: `^${escapeRegex(color)}$`, $options: 'i' };
    and.push({ variants: { $elemMatch: { $or: [{ 'option_values.color': re }, { 'option_values.Color': re }] } } });
  }
  if (tag) and.push({ tags: { $regex: escapeRegex(tag), $options: 'i' } });

  const pipeline: PipelineStage[] = [
    { $match: { $and: and } },
    { $addFields: { __shown: shownPriceExpr } },
    { $match: { __shown: maxPrice === null ? { $gte: minPrice } : { $gte: minPrice, $lte: maxPrice } } },
  ];
  if (sort === 'rating') {
    pipeline.push(
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product_id', as: '__reviews', pipeline: [{ $project: { rating: 1 } }] } },
      { $addFields: { __avg: { $avg: '$__reviews.rating' } } },
    );
  }
  const sortStage: Record<string, 1 | -1> =
    sort === 'price_low_high' ? { __shown: 1, _id: 1 }
    : sort === 'price_high_low' ? { __shown: -1, _id: 1 }
    : sort === 'latest' ? { created_at: -1, _id: 1 }
    : sort === 'rating' ? { __avg: -1, _id: 1 }
    : sort ? { _id: 1 }
    // Default: curated AGA Collections order, newest first among equals
    : { sort_order: 1, created_at: -1, _id: 1 };
  pipeline.push({ $sort: sortStage });

  const page = Math.max(1, parseInt(scalar(q.page) ?? '1', 10) || 1);
  pipeline.push({
    $facet: {
      total: [{ $count: 'n' }],
      items: [{ $skip: (page - 1) * PER_PAGE }, { $limit: PER_PAGE }, { $project: { __reviews: 0, __shown: 0, __avg: 0 } }],
    },
  });

  const [res] = await Product.aggregate<{ total: { n: number }[]; items: ProductDoc[] }>(pipeline);
  const total = res?.total[0]?.n ?? 0;
  return {
    products: res?.items ?? [],
    total,
    page,
    lastPage: Math.max(1, Math.ceil(total / PER_PAGE)),
    selectedCategory,
    mainCategories,
  };
}

/** Laravel's pagination window (onEachSide = 3) as used by pagination::bootstrap-4 */
export function paginationElements(current: number, last: number): (number[] | '...')[] {
  const onEachSide = 3;
  const window = onEachSide + 4;
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (last <= 1) return [];
  if (last < onEachSide * 2 + 8) return [range(1, last)];
  if (current <= window) return [range(1, window + onEachSide), '...', range(last - 1, last)];
  if (current > last - window) return [range(1, 2), '...', range(last - (window + (onEachSide - 1)), last)];
  return [range(1, 2), '...', range(current - onEachSide, current + onEachSide), '...', range(last - 1, last)];
}
