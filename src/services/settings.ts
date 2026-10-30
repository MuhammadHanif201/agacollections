import 'server-only';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { connectDb } from '@/lib/db';
import { wallClock } from '@/lib/format';
import { Category, type CategoryDoc } from '@/models/Category';
import { CompanySetting, Headline, Policy, PopupSetting, type CompanySettingDoc, type HeadlineDoc, type PolicyDoc, type PopupSettingDoc } from '@/models/content';
import { Product } from '@/models/Product';

export type MenuCategory = CategoryDoc & { products_count: number };

/** Admin changes expire everything tagged with this (see adminAction); the TTL is the fallback */
export const CONTENT_TAG = 'store-content';
const CONTENT_TTL = 300;

const ISO_DATE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/;
/** The data cache stores JSON, which turns Dates into strings: give the documents their Dates back */
function revive<T>(v: T): T {
  if (typeof v === 'string' && ISO_DATE.test(v)) return new Date(v) as T;
  if (Array.isArray(v)) return v.map(revive) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)])) as T;
  return v;
}

/**
 * Shop-wide content that changes only when an admin edits it, so it is read once and shared
 * between requests (Next's data cache) instead of querying MongoDB on every page. A miss
 * runs the query exactly as before. React's cache() still de-duplicates inside one request.
 */
function shared<T>(key: string, load: () => Promise<T>): () => Promise<T> {
  const stored = unstable_cache(async () => { await connectDb(); return load(); }, ['store-content', key], { tags: [CONTENT_TAG], revalidate: CONTENT_TTL });
  return cache(async () => revive(await stored()));
}

export const getCompanySetting = shared<CompanySettingDoc | null>('company', async () =>
  CompanySetting.findOne().sort({ _id: 1 }).lean());

async function countRows() {
  return Product.aggregate<{ _id: number; n: number }>([
    { $match: { status: 'active' } },
    { $unwind: '$category_ids' },
    { $group: { _id: '$category_ids', n: { $sum: 1 } } },
  ]);
}

/** Active categories that have at least one active product, in the admin's order. */
export const getMenuCategories = shared<MenuCategory[]>('menu', async () => {
  const [cats, rows] = await Promise.all([
    Category.find({ status: 'active' }).sort({ sort_order: 1, _id: 1 }).lean(),
    countRows(),
  ]);
  const counts = new Map(rows.map((r) => [r._id, r.n]));
  return cats
    .map((c) => ({ ...c, products_count: counts.get(c._id) ?? 0 }))
    .filter((c) => c.products_count > 0);
});

/** The header's Hoodies menu (under /shop/hoodies): its three kinds, shown even while empty */
export const HOODIE_MENU = [
  { slug: 'plain-hoodies', label: 'Plain Hoodies' },
  { slug: 'printed-hoodies', label: 'Printed Hoodies' },
  { slug: 'zipper-hoodies', label: 'Zippers' },
];
export const getHoodieCategories = shared<CategoryDoc[]>('hoodie-menu', async () =>
  Category.find({ slug: { $in: HOODIE_MENU.map((m) => m.slug) }, status: 'active' }).sort({ _id: 1 }).lean());

const productCountRows =shared<{ _id: number; n: number }[]>('product-counts', countRows);

/** category id → number of active products in it */
export const activeProductCounts = cache(async (): Promise<Map<number, number>> => {
  const rows = await productCountRows();
  return new Map(rows.map((r) => [r._id, r.n]));
});

export const getFooterPolicies = shared<PolicyDoc[]>('footer-policies', async () =>
  Policy.find({ status: 'published' }).sort({ _id: 1 }).lean());

/** Headline::active(): schedules are Pakistan wall-clock times */
export const getActiveHeadlines = cache(async (): Promise<HeadlineDoc[]> => {
  await connectDb();
  const now = wallClock('Asia/Karachi');
  return Headline.find({
    is_active: true,
    $and: [
      { $or: [{ starts_at: null }, { starts_at: { $exists: false } }, { starts_at: { $lte: now } }] },
      { $or: [{ ends_at: null }, { ends_at: { $exists: false } }, { ends_at: { $gte: now } }] },
    ],
  })
    .sort({ sort_order: 1, _id: 1 })
    .lean();
});

/** The popup when it is switched on and inside its schedule (app clock is UTC) */
export const getActivePopup = cache(async (): Promise<PopupSettingDoc | null> => {
  await connectDb();
  const popup = await PopupSetting.findOne().sort({ _id: 1 }).lean();
  if (!popup || !popup.is_active) return null;
  const now = wallClock('UTC');
  if (popup.start_at && popup.start_at > now) return null;
  if (popup.end_at && popup.end_at < now) return null;
  return popup;
});

/** CompanySetting::getPrimaryEmail() */
export function primaryEmail(s: CompanySettingDoc | null): string | null {
  const e = normalizeEmails(s);
  return e.orders ?? e.contact ?? e.support ?? e.default ?? null;
}

/** Old rows store emails as a list; map positions to named keys like the PHP model did */
export function normalizeEmails(s: CompanySettingDoc | null): Record<string, string> {
  const emails = s?.emails;
  if (!emails) return {};
  if (Array.isArray(emails)) {
    const keys = ['default', 'support', 'sales', 'contact'];
    const out: Record<string, string> = {};
    keys.forEach((k, i) => { if (emails[i]) out[k] = emails[i]; });
    return out;
  }
  return emails;
}

/** The raw emails list as the footer shows it (array_values of whatever is stored) */
export function emailList(s: CompanySettingDoc | null): string[] {
  const e = s?.emails;
  if (!e) return [];
  return (Array.isArray(e) ? e : Object.values(e)).filter((v): v is string => typeof v === 'string' && v !== '');
}
