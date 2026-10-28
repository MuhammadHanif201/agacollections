/**
 * Import the Laravel MySQL dump into MongoDB.
 *
 *   npm run import:mysql -- ../desiyvqw_desire.sql            # import (collections must be empty)
 *   npm run import:mysql -- ../desiyvqw_desire.sql --drop     # replace existing data
 *   npm run import:mysql -- ../desiyvqw_desire.sql --dry-run  # parse and report only
 *   add --with-audits to also copy the (large) audit log
 *
 * Reads MONGODB_URI / MONGODB_DB from .env.local (or the environment).
 * Ids are kept, so order numbers, product links and customer accounts carry over,
 * and the id counters continue from the highest imported id.
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { readDump, type Row, type SqlValue } from './lib/sql-dump';
import { Category } from '../src/models/Category';
import { Customer } from '../src/models/Customer';
import { Order } from '../src/models/Order';
import { Product, type ProductDoc } from '../src/models/Product';
import { Affiliate, AffiliateClick, AffiliateCommission } from '../src/models/Affiliate';
import {
  AboutSection, CompanySetting, Coupon, Headline, NewsletterSubscriber, Policy, PopupSetting, Review, Slider, Wishlist,
} from '../src/models/content';
import { Counter } from '../src/models/Counter';

for (const f of ['.env.local', '.env']) {
  if (fs.existsSync(f)) { process.loadEnvFile(f); break; }
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const DRY = args.includes('--dry-run');
const DROP = args.includes('--drop');
const WITH_AUDITS = args.includes('--with-audits');
if (!file || !fs.existsSync(file)) {
  console.error('Usage: npm run import:mysql -- <path/to/dump.sql> [--drop] [--dry-run] [--with-audits]');
  process.exit(1);
}

// ── value helpers ──────────────────────────────────────────────────────────
const num = (v: SqlValue | undefined): number | null => (v === null || v === undefined || v === '' ? null : Number(v));
const int = (v: SqlValue | undefined): number | null => { const n = num(v); return n === null ? null : Math.trunc(n); };
const str = (v: SqlValue | undefined): string | null => (v === null || v === undefined ? null : String(v));
const bool = (v: SqlValue | undefined): boolean => v === 1 || v === '1' || v === "b'1'";
/** MySQL timestamp (UTC, the app timezone) → Date */
const date = (v: SqlValue | undefined): Date | null => {
  if (v === null || v === undefined || v === '' || String(v).startsWith('0000-00-00')) return null;
  const d = new Date(String(v).replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
};
/** Wall-clock datetime kept as text (coupon expiry, headline/popup schedules) */
const wall = (v: SqlValue | undefined): string | null => (v === null || v === undefined || v === '' || String(v).startsWith('0000') ? null : String(v));
const jsonv = <T>(v: SqlValue | undefined, fallback: T): T => {
  if (v === null || v === undefined || v === '') return fallback;
  try { const parsed = JSON.parse(String(v)); return (parsed ?? fallback) as T; } catch { return fallback; }
};
const stamps = (r: Row) => ({ created_at: date(r.created_at) ?? undefined, updated_at: date(r.updated_at) ?? undefined });
const byKey = (rows: Row[], key: string) => {
  const m = new Map<number, Row[]>();
  for (const r of rows) {
    const k = Number(r[key]);
    (m.get(k) ?? m.set(k, []).get(k)!).push(r);
  }
  return m;
};

/** Laravel cast 'tags' => 'array' (a JSON list), but older rows may hold plain text */
function tagsOf(v: SqlValue): string[] {
  if (v === null || v === '' || v === '[]') return [];
  const parsed = jsonv<unknown>(v, null);
  if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
  return String(v).split(',').map((t) => t.trim()).filter(Boolean);
}

async function main() {
  console.log(`Reading ${path.resolve(file!)} …`);
  const t = await readDump(file!);
  const rows = (name: string) => t.get(name) ?? [];
  console.log('Rows found:', [...t.entries()].filter(([k]) => !k.startsWith('audits') || WITH_AUDITS).map(([k, v]) => `${k}=${v.length}`).join(', '));

  // ── products with images, variants, options, categories, related ───────
  const imagesBy = byKey(rows('product_images'), 'product_id');
  const variantsBy = byKey(rows('product_variants'), 'product_id');
  const optionsBy = byKey(rows('product_options'), 'product_id');
  const optionValuesBy = byKey(rows('product_option_values'), 'product_option_id');
  const catsBy = byKey(rows('category_product'), 'product_id');
  const relatedBy = byKey(rows('related_product'), 'product_id');

  const products: Partial<ProductDoc>[] = rows('products').map((r) => {
    const id = Number(r.id);
    return {
      _id: id,
      name: str(r.name) ?? '',
      slug: str(r.slug) ?? String(id),
      description: str(r.description),
      price: num(r.price),
      sale_price: num(r.sale_price),
      cost: num(r.cost),
      margin: num(r.margin),
      profit: num(r.profit),
      sku: str(r.sku),
      quantity: int(r.quantity),
      type: str(r.type),
      tags: tagsOf(r.tags),
      status: (str(r.status) === 'draft' ? 'draft' : 'active') as ProductDoc['status'],
      views: int(r.views) ?? 0,
      sort_order: int(r.sort_order) ?? 0,
      is_best_seller: bool(r.is_best_seller),
      is_featured: bool(r.is_featured),
      category_ids: (catsBy.get(id) ?? []).sort((a, b) => Number(a.id) - Number(b.id)).map((c) => Number(c.category_id)),
      related_ids: (relatedBy.get(id) ?? []).map((c) => Number(c.related_id)),
      images: (imagesBy.get(id) ?? []).sort((a, b) => Number(a.id) - Number(b.id)).map((i) => ({
        _id: Number(i.id), image_path: str(i.image_path) ?? '', is_primary: bool(i.is_primary), created_at: date(i.created_at) ?? undefined,
      })),
      variants: (variantsBy.get(id) ?? []).sort((a, b) => Number(a.id) - Number(b.id)).map((v) => ({
        _id: Number(v.id),
        option_values: Object.fromEntries(Object.entries(jsonv<Record<string, unknown>>(v.option_values, {})).map(([k, val]) => [k, String(val)])),
        sku: str(v.sku),
        price: num(v.price),
        sale_price: num(v.sale_price),
        cost: num(v.cost),
        margin: num(v.margin),
        profit: num(v.profit),
        quantity: int(v.quantity),
        is_default: bool(v.is_default),
        primary_image: str(v.primary_image),
      })),
      options: (optionsBy.get(id) ?? []).map((o) => ({
        _id: Number(o.id),
        name: str(o.name) ?? '',
        values: (optionValuesBy.get(Number(o.id)) ?? []).map((ov) => ({ _id: Number(ov.id), value: str(ov.value) ?? '' })),
      })),
      ...stamps(r),
    };
  });

  // ── orders with items ───────────────────────────────────────────────────
  const itemsBy = byKey(rows('order_items'), 'order_id');
  const orders = rows('orders').map((r) => {
    const id = Number(r.id);
    return {
      _id: id,
      coupon_id: int(r.coupon_id),
      affiliate_id: int(r.affiliate_id),
      affiliate_code: str(r.affiliate_code),
      customer_id: Number(r.customer_id),
      subtotal: num(r.subtotal) ?? 0,
      shipping: num(r.shipping) ?? 0,
      discount: num(r.discount) ?? 0,
      coupon_code: str(r.coupon_code),
      total: num(r.total) ?? 0,
      payment_method: str(r.payment_method) ?? 'cod',
      shipping_name: str(r.shipping_name),
      shipping_phone: str(r.shipping_phone),
      shipping_email: str(r.shipping_email), // column added after this dump was taken on older copies
      shipping_address: str(r.shipping_address),
      shipping_city: str(r.shipping_city),
      shipping_villa: str(r.shipping_villa),
      order_notes: str(r.order_notes),
      status: (['pending', 'processing', 'completed', 'cancelled'].includes(String(r.status)) ? r.status : 'pending') as 'pending',
      items: (itemsBy.get(id) ?? []).sort((a, b) => Number(a.id) - Number(b.id)).map((i) => ({
        _id: Number(i.id),
        product_id: Number(i.product_id),
        variant_id: int(i.variant_id),
        variant_label: str(i.variant_label),
        quantity: int(i.quantity) ?? 0,
        price: num(i.price) ?? 0,
        total: num(i.total) ?? 0,
        stock_adjusted: bool(i.stock_adjusted),
        created_at: date(i.created_at) ?? undefined,
      })),
      ...stamps(r),
    };
  });

  const customers = rows('customers').map((r) => ({
    _id: Number(r.id),
    full_name: str(r.full_name) ?? '',
    email: str(r.email) || undefined,
    phone: str(r.phone) ?? '',
    country: str(r.country),
    password: str(r.password),
    remember_token: null, // Laravel's plain tokens are not reused; customers sign in again once
    city: str(r.city),
    address: str(r.address),
    villa_apartment: str(r.villa_apartment),
    ...stamps(r),
  }));

  const categories = rows('categories').map((r) => ({
    _id: Number(r.id), sort_order: int(r.sort_order) ?? 0, title: str(r.title) ?? '', slug: str(r.slug), image: str(r.image), banner: str(r.banner), status: str(r.status) ?? 'active', ...stamps(r),
  }));

  const settings = rows('company_settings').map((r) => ({
    _id: Number(r.id),
    shipping_charges: Object.fromEntries(Object.entries(jsonv<Record<string, unknown>>(r.shipping_charges, {})).map(([k, v]) => [k, Number(v)])),
    shipping_mode: str(r.shipping_mode) ?? 'flat',
    free_shipping_enabled: bool(r.free_shipping_enabled),
    free_shipping_threshold: num(r.free_shipping_threshold) ?? 0,
    name: str(r.name) ?? 'AGA Collections',
    description: str(r.description),
    logo: str(r.logo),
    favicon: str(r.favicon),
    default_category_banner: str(r.default_category_banner),
    size_chart_image: str(r.size_chart_image),
    emails: jsonv<Record<string, string> | string[]>(r.emails, {}),
    phones: jsonv<string[]>(r.phones, []),
    whatsapps: jsonv<string[]>(r.whatsapps, []),
    address: str(r.address),
    social_links: jsonv<{ platform: string; url: string }[]>(r.social_links, []),
    affiliate_enabled: r.affiliate_enabled === undefined ? true : bool(r.affiliate_enabled),
    affiliate_default_rate: num(r.affiliate_default_rate) ?? 8,
    affiliate_min_withdrawal: int(r.affiliate_min_withdrawal) ?? 1000,
    affiliate_cookie_days: int(r.affiliate_cookie_days) ?? 30,
    ...stamps(r),
  }));

  const coupons = rows('coupons').map((r) => ({
    _id: Number(r.id), code: str(r.code) ?? '', discount: num(r.discount) ?? 0, type: (str(r.type) === 'percentage' ? 'percentage' : 'fixed') as 'fixed',
    max_uses: int(r.max_uses), used_count: int(r.used_count) ?? 0, valid_until: wall(r.valid_until), ...stamps(r),
  }));
  const sliders = rows('sliders').map((r) => ({
    _id: Number(r.id), title_en: str(r.title_en), subtitle: str(r.subtitle), link: str(r.link), button_text: str(r.button_text), status: str(r.status) ?? 'active',
    media_type: (str(r.media_type) === 'video' ? 'video' : 'image') as 'image', video: str(r.video), image: str(r.image), position: int(r.position) ?? 1, ...stamps(r),
  }));
  const headlines = rows('headlines').map((r) => ({
    _id: Number(r.id), message_en: str(r.message_en) ?? '', link_url: str(r.link_url), bg_color: str(r.bg_color) ?? '#0f172a', text_color: str(r.text_color) ?? '#ffffff',
    is_active: bool(r.is_active), sort_order: int(r.sort_order) ?? 0, starts_at: wall(r.starts_at), ends_at: wall(r.ends_at), ...stamps(r),
  }));
  const policies = rows('policies').map((r) => ({
    _id: Number(r.id), key: str(r.key) ?? String(r.id), status: (str(r.status) === 'draft' ? 'draft' : 'published') as 'published', title_en: str(r.title_en), content_en: str(r.content_en), ...stamps(r),
  }));
  const popups = rows('popup_settings').map((r) => ({
    _id: Number(r.id), title: str(r.title), content: str(r.content), image_path: str(r.image_path), button_text: str(r.button_text), button_link: str(r.button_link),
    is_active: bool(r.is_active), position: (str(r.position) ?? 'center') as 'center', show_on_home: bool(r.show_on_home), start_at: wall(r.start_at), end_at: wall(r.end_at),
    dismissible: bool(r.dismissible), show_once_per_user: bool(r.show_once_per_user), delay_seconds: int(r.delay_seconds) ?? 0, ...stamps(r),
  }));
  const abouts = rows('about_sections').map((r) => {
    const doc: Record<string, unknown> = { _id: Number(r.id), ...stamps(r) };
    for (const [k, v] of Object.entries(r)) if (!['id', 'created_at', 'updated_at'].includes(k)) doc[k] = str(v);
    return doc;
  });
  const reviews = rows('reviews').map((r) => ({
    _id: Number(r.id), product_id: Number(r.product_id), name: str(r.name) ?? '', email: str(r.email) ?? '', rating: int(r.rating) ?? 5, comment: str(r.comment),
    status: (['pending', 'approved', 'rejected'].includes(String(r.status)) ? r.status : 'pending') as 'pending', ...stamps(r),
  }));
  const wishlists = rows('wishlists').map((r) => ({ _id: Number(r.id), user_id: Number(r.user_id), product_id: Number(r.product_id), ...stamps(r) }));
  const subscribers = rows('newsletter_subscribers').map((r) => ({
    _id: Number(r.id), email: (str(r.email) ?? '').toLowerCase(), status: (str(r.status) === 'unsubscribed' ? 'unsubscribed' : 'subscribed') as 'subscribed',
    ip: str(r.ip), user_agent: str(r.user_agent), referrer: str(r.referrer), ...stamps(r),
  }));
  const affiliates = rows('affiliates').map((r) => ({
    _id: Number(r.id), customer_id: int(r.customer_id), full_name: str(r.full_name) ?? '', phone: str(r.phone) ?? '', email: str(r.email),
    payment_method: (str(r.payment_method) ?? 'jazzcash') as 'jazzcash', payment_account_number: str(r.payment_account_number), payment_account_name: str(r.payment_account_name),
    bank_name: str(r.bank_name), referral_code: str(r.referral_code) ?? '', commission_rate: num(r.commission_rate), status: (str(r.status) ?? 'pending') as 'pending',
    admin_note: str(r.admin_note), approved_at: date(r.approved_at), rejected_at: date(r.rejected_at), ...stamps(r),
  }));
  const commissions = rows('affiliate_commissions').map((r) => ({
    _id: Number(r.id), affiliate_id: Number(r.affiliate_id), order_id: Number(r.order_id), rate_used: num(r.rate_used) ?? 0, base_amount: num(r.base_amount) ?? 0,
    commission_amount: num(r.commission_amount) ?? 0, status: (str(r.status) ?? 'pending') as 'pending', available_at: date(r.available_at), paid_at: date(r.paid_at),
    cancelled_at: date(r.cancelled_at), withdrawal_id: int(r.withdrawal_id), ...stamps(r),
  }));
  const clicks = rows('affiliate_clicks').map((r) => ({
    _id: Number(r.id), affiliate_id: Number(r.affiliate_id), ip: str(r.ip), user_agent: str(r.user_agent), referrer_url: str(r.referrer_url), landing_url: str(r.landing_url), created_at: date(r.created_at) ?? new Date(),
  }));

  // Tables for the admin panel and affiliate pages (later phases): copied as plain documents
  const generic = (name: string) => rows(name).map((r) => {
    const doc: Record<string, unknown> = { _id: Number(r.id) };
    for (const [k, v] of Object.entries(r)) {
      if (k === 'id') continue;
      doc[k] = /(_at|_until)$/.test(k) ? date(v) : v;
    }
    return doc;
  });
  const extra: [string, Record<string, unknown>[]][] = [
    ['users', generic('users')],
    ['affiliate_withdrawals', generic('affiliate_withdrawals')],
    ['newsletter_campaigns', generic('newsletter_campaigns')],
    ['newsletter_deliveries', generic('newsletter_deliveries')],
  ];
  if (WITH_AUDITS) extra.push(['audits', generic('audits')]);

  const plan: [mongoose.Model<never>, Record<string, unknown>[], string][] = [
    [Category as never, categories, 'categories'],
    [Product as never, products as never, 'products'],
    [Customer as never, customers, 'customers'],
    [Order as never, orders, 'orders'],
    [CompanySetting as never, settings, 'company_settings'],
    [Coupon as never, coupons, 'coupons'],
    [Slider as never, sliders, 'sliders'],
    [Headline as never, headlines, 'headlines'],
    [Policy as never, policies, 'policies'],
    [PopupSetting as never, popups, 'popup_settings'],
    [AboutSection as never, abouts, 'about_sections'],
    [Review as never, reviews, 'reviews'],
    [Wishlist as never, wishlists, 'wishlists'],
    [NewsletterSubscriber as never, subscribers, 'newsletter_subscribers'],
    [Affiliate as never, affiliates, 'affiliates'],
    [AffiliateCommission as never, commissions, 'affiliate_commissions'],
    [AffiliateClick as never, clicks, 'affiliate_clicks'],
  ];

  // Sanity checks that would break the storefront
  const problems: string[] = [];
  const slugs = new Map<string, number>();
  for (const p of products) {
    if (slugs.has(p.slug!)) problems.push(`Duplicate product slug "${p.slug}" (ids ${slugs.get(p.slug!)} and ${p._id})`);
    slugs.set(p.slug!, p._id!);
  }
  const phones = new Set<string>();
  for (const c of customers) {
    if (phones.has(c.phone)) problems.push(`Duplicate customer phone ${c.phone} (customer ${c._id})`);
    phones.add(c.phone);
  }
  const productIds = new Set(products.map((p) => p._id));
  const missingProducts = new Set(orders.flatMap((o) => o.items.map((i) => i.product_id)).filter((id) => !productIds.has(id)));
  if (missingProducts.size) console.log(`Note: ${missingProducts.size} product(s) referenced by orders no longer exist (shown as "Product #id"): ${[...missingProducts].join(', ')}`);

  console.log('\nTo import:');
  for (const [, docs, name] of plan) console.log(`  ${name.padEnd(24)} ${docs.length}`);
  for (const [name, docs] of extra) console.log(`  ${name.padEnd(24)} ${docs.length}`);
  if (problems.length) {
    console.log('\nProblems:');
    problems.forEach((p) => console.log('  - ' + p));
  }
  if (DRY) { console.log('\nDry run: nothing written.'); return; }
  if (problems.length) { console.error('\nFix the problems above (unique indexes would reject these rows).'); process.exit(1); }

  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is not set (.env.local).'); process.exit(1); }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  console.log(`\nConnected to ${mongoose.connection.name}.`);

  for (const [model, docs, name] of plan) {
    const existing = await model.estimatedDocumentCount();
    if (existing && !DROP) { console.error(`${name} already has ${existing} documents. Re-run with --drop to replace them.`); process.exit(1); }
    if (DROP) await model.deleteMany({});
    await model.syncIndexes();
    if (docs.length) await model.insertMany(docs as never[], { ordered: true, lean: true } as never);
    console.log(`  ${name}: ${docs.length}`);
  }
  const db = mongoose.connection.db!;
  for (const [name, docs] of extra) {
    if (DROP) await db.collection(name).deleteMany({});
    if (docs.length) await db.collection(name).insertMany(docs as never[]);
    console.log(`  ${name}: ${docs.length}`);
  }

  // Id counters continue after the highest imported id
  const counters: Record<string, number> = {
    categories: Math.max(0, ...categories.map((d) => d._id)),
    products: Math.max(0, ...products.map((d) => d._id!)),
    product_images: Math.max(0, ...products.flatMap((p) => p.images!.map((i) => i._id))),
    product_variants: Math.max(0, ...products.flatMap((p) => p.variants!.map((v) => v._id))),
    product_options: Math.max(0, ...products.flatMap((p) => p.options!.map((o) => o._id))),
    product_option_values: Math.max(0, ...products.flatMap((p) => p.options!.flatMap((o) => o.values.map((v) => v._id)))),
    customers: Math.max(0, ...customers.map((d) => d._id)),
    orders: Math.max(0, ...orders.map((d) => d._id)),
    order_items: Math.max(0, ...orders.flatMap((o) => o.items.map((i) => i._id))),
    company_settings: Math.max(0, ...settings.map((d) => d._id)),
    coupons: Math.max(0, ...coupons.map((d) => d._id)),
    sliders: Math.max(0, ...sliders.map((d) => d._id)),
    headlines: Math.max(0, ...headlines.map((d) => d._id)),
    policies: Math.max(0, ...policies.map((d) => d._id)),
    popup_settings: Math.max(0, ...popups.map((d) => d._id)),
    about_sections: Math.max(0, ...abouts.map((d) => Number(d._id))),
    reviews: Math.max(0, ...reviews.map((d) => d._id)),
    wishlists: Math.max(0, ...wishlists.map((d) => d._id)),
    newsletter_subscribers: Math.max(0, ...subscribers.map((d) => d._id)),
    affiliates: Math.max(0, ...affiliates.map((d) => d._id)),
    affiliate_commissions: Math.max(0, ...commissions.map((d) => d._id)),
    affiliate_clicks: Math.max(0, ...clicks.map((d) => d._id)),
  };
  for (const [name, docs] of extra) counters[name] = Math.max(0, ...docs.map((d) => Number(d._id)));
  // MySQL's AUTO_INCREMENT skips ids of deleted rows: continue from it, so new ids match the old app
  const dumpText = fs.readFileSync(file!, 'utf8');
  for (const m of dumpText.matchAll(/CREATE TABLE `(\w+)` \([\s\S]*?\) ENGINE=\w+(?: AUTO_INCREMENT=(\d+))?/g)) {
    if (m[2] && m[1] in counters) counters[m[1]] = Math.max(counters[m[1]], Number(m[2]) - 1);
  }
  // phpMyAdmin dumps set it afterwards: ALTER TABLE `x` MODIFY `id` … AUTO_INCREMENT, AUTO_INCREMENT=N;
  for (const m of dumpText.matchAll(/ALTER TABLE `(\w+)`\s+MODIFY `id`[^;]*?AUTO_INCREMENT=(\d+);/g)) {
    if (m[1] in counters) counters[m[1]] = Math.max(counters[m[1]], Number(m[2]) - 1);
  }
  for (const [seq, max] of Object.entries(counters)) {
    // A fresh import (--drop) restarts the counters; otherwise never move them backwards
    await Counter.updateOne({ _id: seq }, DROP ? { $set: { seq: max } } : { $max: { seq: max } }, { upsert: true });
  }
  console.log('\nCounters set. Import finished.');
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
