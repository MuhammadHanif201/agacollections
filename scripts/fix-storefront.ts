/**
 * Storefront content the Laravel admin set after the SQL dump was taken: category names,
 * menu order and hero banners, the Shop All banner and the About page photos; the old brand's
 * announcements in the top bar are switched off; and spelling in product names, URLs and size
 * labels is corrected; the Instagram and TikTok links are set. Run it before `fix:skus` (size labels
 * feed the variant SKUs).
 * The dump still has the old names (JERSEY holds T-shirts) and Desire's banners. Safe to run again.
 *
 *   npm run fix:storefront -- --dry-run   # print the changes only
 *   npm run fix:storefront                # write them
 *
 * Run after `import:mysql`. Reads MONGODB_URI / MONGODB_DB from .env.local (or the environment).
 * The banner files themselves come from storage/app/public (`upload:media` on production).
 */
import fs from 'node:fs';
import mongoose from 'mongoose';
import { Category } from '../src/models/Category';
import { AboutSection, CompanySetting, Headline } from '../src/models/content';
import { Product } from '../src/models/Product';

for (const f of ['.env.local', '.env']) {
  if (fs.existsSync(f)) { process.loadEnvFile(f); break; }
}

const DRY = process.argv.includes('--dry-run');

// Menu order = sort_order: the header shows the first four, the rest sit under Collections
const CATEGORIES = [
  { slugs: ['jersey', 't-shirts'], slug: 't-shirts', title: 'T-SHIRTS', sort_order: 1, banner: 'uploads/categories/zq-t-shirts.jpg' },
  { slugs: ['button-down-shirts'], slug: 'button-down-shirts', title: 'SHIRTS', sort_order: 2, banner: 'uploads/categories/zq-shirts.jpg' },
  { slugs: ['jeans'], slug: 'jeans', title: 'BAGGY JEANS', sort_order: 3, banner: 'uploads/categories/zq-jeans.jpg' },
  { slugs: ['sports-jerseys'], slug: 'sports-jerseys', title: 'FOOTBALL JERSEYS', sort_order: 4, banner: 'uploads/categories/zq-football-jerseys.jpg' },
  { slugs: ['zipper-hoodies'], slug: 'zipper-hoodies', title: 'ZIP HOODIES', sort_order: 5, banner: 'uploads/categories/zq-zip-hoodies.jpg' },
];
const SHOP_BANNER = 'banners/zq-shop.jpg';
// Footer and contact page icons, in this order; a bare site address shows the icon without a link
const SOCIAL_LINKS = [
  { platform: 'facebook', url: 'https://facebook.com' },
  { platform: 'instagram', url: 'https://www.instagram.com/agacollectionsofficial' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@agacollectionsofficial' },
];
// Desire's announcements in the dump; the top bar shows active headlines, so these are switched off
const OLD_HEADLINES = ['SEASON END SALE UPTO 45% OFF', 'PREMIUM DENIM-FAST DELIVERY THROUGH TCS-EASY EXCHANGE-LIMITED STOCK'];
// Product names and URLs with spelling mistakes in the dump (matched by the old or the new slug)
const PRODUCTS = [
  { slugs: ['coffe-brown-button-down-shirt'], slug: 'coffee-brown-button-down-shirt', name: 'COFFEE BROWN BUTTON DOWN SHIRT' },
  { slugs: ['malasiyan-green-washed-jeans'], slug: 'malaysian-green-washed-jeans', name: 'UNISEX MALAYSIAN GREEN WASHED JEANS' },
  { slugs: ['ice-blue-baggy-wahsed-jeans'], slug: 'ice-blue-baggy-washed-jeans', name: 'UNISEX ICE BLUE WIDE BAGGY WASHED JEANS' },
  { slugs: ['dirty-washed-jean'], slug: 'dirty-washed-jean', name: 'UNISEX NAVY VINTAGE WASHED BAGGY JEAN' },
  { slugs: ['dusty-sand-washed-jean'], slug: 'dusty-sand-washed-jean', name: 'UNISEX DUSTY SAND WIDE LEG JEANS' },
  { slugs: ['neavt-blue-baggy-jeans'], slug: 'navy-blue-baggy-jeans', name: 'UNISEX NAVY BLUE BAGGY JEANS' },
  { slugs: ['neavy-blue-wash-jean'], slug: 'navy-blue-wash-jean', name: 'UNISEX NAVY BLUE WASH JEAN' },
  { slugs: ['ballon-baggy-washed-jeans'], slug: 'balloon-baggy-washed-jeans', name: 'UNISEX BALLOON BAGGY WASHED JEANS' },
];
// Size labels: option name "Sizs" (kept those products out of the size filter), "S’", "samll", "Xl"
const OPTION_NAMES: Record<string, string> = { sizs: 'size' };
const OPTION_VALUES: Record<string, string> = { 's’': 's', "s'": 's', samll: 'small', xl: 'xl' };
const fixValue = (v: string) => {
  const to = OPTION_VALUES[v.toLowerCase()];
  if (to === undefined) return v;
  return v === v.toUpperCase() || /^[A-Z]/.test(v) ? to.toUpperCase() : to;
};
const ABOUT = {
  image: 'uploads/about/zq-about-hero.jpg',
  image2: 'uploads/about/zq-about-2.jpg',
  gallery_image1: 'uploads/about/zq-about-g1.jpg',
  gallery_image2: 'uploads/about/zq-about-g2.jpg',
  gallery_image3: 'uploads/about/zq-about-g3.jpg',
  gallery_image4: 'uploads/about/zq-about-g4.jpg',
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is not set (.env.local).'); process.exit(1); }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  console.log(`Connected to ${mongoose.connection.name}.${DRY ? ' Dry run.' : ''}`);
  const now = new Date();
  let changes = 0;

  for (const want of CATEGORIES) {
    const cat = await Category.findOne({ slug: { $in: want.slugs } }).sort({ _id: 1 }).lean();
    if (!cat) { console.log(`  missing category ${want.slugs.join(' / ')}, skipped`); continue; }
    const set: Record<string, unknown> = {};
    for (const k of ['slug', 'title', 'sort_order', 'banner'] as const) if (cat[k] !== want[k]) set[k] = want[k];
    if (!Object.keys(set).length) continue;
    changes++;
    console.log(`  category #${cat._id} ${cat.title}: ${Object.entries(set).map(([k, v]) => `${k} ${String(cat[k as keyof typeof cat])} → ${v}`).join(', ')}`);
    if (!DRY) await Category.updateOne({ _id: cat._id }, { $set: { ...set, updated_at: now } });
  }

  for (const want of PRODUCTS) {
    const p = await Product.findOne({ slug: { $in: [...want.slugs, want.slug] } }).sort({ _id: 1 }).lean();
    if (!p) { console.log(`  missing product ${want.slugs.join(' / ')}, skipped`); continue; }
    const set: Record<string, unknown> = {};
    if (p.name !== want.name) set.name = want.name;
    if (p.slug !== want.slug) {
      if (await Product.exists({ slug: want.slug, _id: { $ne: p._id } })) { console.log(`  product #${p._id}: slug ${want.slug} is taken, kept ${p.slug}`); }
      else set.slug = want.slug;
    }
    if (!Object.keys(set).length) continue;
    changes++;
    console.log(`  product #${p._id}: ${Object.entries(set).map(([k, v]) => `${k} ${String(p[k as keyof typeof p])} → ${v}`).join(', ')}`);
    if (!DRY) await Product.updateOne({ _id: p._id }, { $set: { ...set, updated_at: now } });
  }

  // Size labels on every product: option names, values, the variants' keys, one group per name
  for (const p of await Product.find().sort({ _id: 1 }).lean()) {
    const seen = new Set<string>();
    const options = [];
    for (const o of p.options ?? []) {
      const mapped = OPTION_NAMES[o.name.toLowerCase()];
      const name = mapped ? (/^[A-Z]/.test(o.name) ? mapped[0].toUpperCase() + mapped.slice(1) : mapped) : o.name;
      if (seen.has(name.toLowerCase())) continue; // a second "Size" group
      seen.add(name.toLowerCase());
      options.push({ ...o, name, values: o.values.map((v) => ({ ...v, value: fixValue(v.value) })) });
    }
    const variants = (p.variants ?? []).map((v) => ({
      ...v,
      option_values: Object.fromEntries(Object.entries(v.option_values ?? {}).map(([k, val]) => [OPTION_NAMES[k.toLowerCase()] ?? k, fixValue(String(val))])),
    }));
    const before = JSON.stringify([p.options, p.variants.map((v) => v.option_values)]);
    const after = JSON.stringify([options, variants.map((v) => v.option_values)]);
    if (before === after) continue;
    changes++;
    console.log(`  product #${p._id} ${p.name}: sizes ${p.options.map((o) => `${o.name}: ${o.values.map((v) => v.value).join('|')}`).join(' ; ')} → ${options.map((o) => `${o.name}: ${o.values.map((v) => v.value).join('|')}`).join(' ; ')}`);
    if (!DRY) await Product.collection.updateOne({ _id: p._id } as never, { $set: { options, variants, updated_at: now } });
  }

  const company = await CompanySetting.findOne().sort({ _id: 1 }).lean();
  if (company) {
    // Keep a profile link already set in admin (e.g. the real Facebook page); fill in the rest
    const have = new Map((company.social_links ?? []).map((l) => [l.platform, l.url]));
    const links = SOCIAL_LINKS.map((l) => ({ platform: l.platform, url: l.platform === 'facebook' && /facebook\.com\/./.test(have.get('facebook') ?? '') ? have.get('facebook')! : l.url }));
    if (JSON.stringify(links) !== JSON.stringify((company.social_links ?? []).map((l) => ({ platform: l.platform, url: l.url })))) {
      changes++;
      console.log(`  social links: ${links.map((l) => `${l.platform} ${l.url}`).join(', ')}`);
      if (!DRY) await CompanySetting.updateOne({ _id: company._id }, { $set: { social_links: links, updated_at: now } });
    }
  }
  if (company && company.default_category_banner !== SHOP_BANNER) {
    changes++;
    console.log(`  Shop All banner: ${company.default_category_banner} → ${SHOP_BANNER}`);
    if (!DRY) await CompanySetting.updateOne({ _id: company._id }, { $set: { default_category_banner: SHOP_BANNER, updated_at: now } });
  }

  const oldHeadlines = await Headline.find({ message_en: { $in: OLD_HEADLINES }, is_active: true }).lean();
  for (const h of oldHeadlines) {
    changes++;
    console.log(`  headline #${h._id} "${h.message_en}": switched off`);
    if (!DRY) await Headline.updateOne({ _id: h._id }, { $set: { is_active: false, updated_at: now } });
  }

  const about = await AboutSection.findOne().sort({ _id: 1 }).lean();
  if (about) {
    const set = Object.fromEntries(Object.entries(ABOUT).filter(([k, v]) => about[k as keyof typeof ABOUT] !== v));
    if (Object.keys(set).length) {
      changes++;
      console.log(`  About photos: ${Object.keys(set).join(', ')}`);
      if (!DRY) await AboutSection.updateOne({ _id: about._id }, { $set: { ...set, updated_at: now } });
    }
  }

  console.log(changes ? `${changes} change(s) ${DRY ? 'to make' : 'made'}.` : 'Nothing to change.');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
