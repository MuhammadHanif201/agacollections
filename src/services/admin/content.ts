import 'server-only';
import sharp from 'sharp';
import { createRow, deleteRow, updateRow, wallDate, type Who } from '@/lib/admin/crud';
import { bool, isUpload, str, type FormInput, type UploadedFile } from '@/lib/admin/form';
import { Carbon, Paginator, Str, carbonize, collect } from '@/lib/admin/php';
import { deletePublic, storeImage, storePublic, storeRandom } from '@/lib/admin/storage';
import { connectDb } from '@/lib/db';
import { Category } from '@/models/Category';
import { AboutSection, Coupon, Headline, Policy, PopupSetting, Review, Slider } from '@/models/content';
import { Product } from '@/models/Product';
import { like, pageParam, productModel } from './models';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Datetime-cast columns kept as wall-clock text, read back as Carbon */
const wall = (doc: any, fields: string[]) => {
  for (const f of fields) if (typeof doc[f] === 'string' && doc[f]) doc[f] = Carbon.parse(doc[f]);
  return doc;
};
const dec2 = (n: unknown) => (n === null || n === undefined ? null : Number(n).toFixed(2));
const unix = () => Math.floor(Date.now() / 1000);
const num = (v: string | null) => (v === null ? null : Number(v));

// ── Categories (CategoryController) ───────────────────────────────────────
async function categoryModel(c: any) {
  const doc = carbonize(c);
  const n = await Product.countDocuments({ category_ids: c._id });
  doc.products = () => ({ count: () => n });
  return doc;
}

export async function categoryIndexData(url: URL) {
  await connectDb();
  const q = url.searchParams;
  const f: Record<string, unknown> = {};
  const filled = (k: string) => (q.get(k) ?? '').trim() !== '';
  if (filled('title')) f.title = like(q.get('title')!.trim());
  if (filled('slug')) f.slug = like(q.get('slug')!.trim());
  if (filled('status')) f.status = q.get('status')!.trim();
  const rows = await Category.find(f).sort({ sort_order: 1, _id: 1 }).lean();
  return { categories: collect(await Promise.all(rows.map(categoryModel))) };
}

export async function categoryEditData(id: number) {
  await connectDb();
  const c = await Category.findById(id).lean();
  return c ? { category: await categoryModel(c) } : null;
}

const categoryImage = (file: UploadedFile, title: string, banner: boolean) => storeImage(file, `uploads/categories/${Str.slug(title)}-${banner ? 'banner-' : ''}${unix()}`);

export async function storeCategory(input: FormInput, who: Who) {
  const title = str(input, 'title')!;
  const image = isUpload(input.image) ? await categoryImage(input.image, title, false) : null;
  const banner = isUpload(input.banner) ? await categoryImage(input.banner, title, true) : null;
  await createRow(Category, 'categories', 'App\\Models\\Category', { title, slug: Str.slug(title), image, banner, status: str(input, 'status') ?? 'active' }, who, { sort_order: 0 }, { typed: headlineTyped(input) });
}

export async function updateCategory(before: any, input: FormInput, who: Who) {
  const title = str(input, 'title')!;
  const attrs: Record<string, unknown> = { title, status: str(input, 'status'), slug: Str.slug(title) };
  if (isUpload(input.image)) { await deletePublic(before.image); attrs.image = await categoryImage(input.image, title, false); }
  if (isUpload(input.banner)) { await deletePublic(before.banner); attrs.banner = await categoryImage(input.banner, title, true); }
  await updateRow(Category, 'App\\Models\\Category', before, attrs, who);
}

export async function destroyCategory(before: any, who: Who) {
  await deletePublic(before.image);
  await deletePublic(before.banner);
  await deleteRow(Category, 'App\\Models\\Category', before, who);
  await Product.updateMany({ category_ids: before._id }, { $pull: { category_ids: before._id } }, { timestamps: false });
}

export async function sortCategories(order: unknown[]) {
  await connectDb();
  await Promise.all(order.map((id, i) => Category.updateOne({ _id: Number(id) }, { $set: { sort_order: i + 1 } }, { timestamps: false })));
}

// ── Coupons (CouponController) ────────────────────────────────────────────
export async function couponIndexData() {
  await connectDb();
  const rows = await Coupon.find().sort({ created_at: -1, _id: -1 }).lean();
  return { coupons: collect(rows.map((c) => wall(carbonize({ ...c, discount: dec2(c.discount) }), ['valid_until']))) };
}

export async function couponEditData(id: number) {
  await connectDb();
  const c = await Coupon.findById(id).lean();
  return c ? { coupon: wall(carbonize({ ...c, discount: dec2(c.discount) }), ['valid_until']) } : null;
}

export async function storeCoupon(input: FormInput, who: Who) {
  // Coupon::create($request->all()): the fillable fields that were sent
  const attrs: Record<string, unknown> = {};
  for (const k of ['code', 'discount', 'type', 'max_uses', 'used_count', 'valid_until']) {
    if (!(k in input)) continue;
    const v = str(input, k);
    attrs[k] = k === 'valid_until' ? wallDate(v) : k === 'discount' || k === 'max_uses' || k === 'used_count' ? num(v) : v;
  }
  // the audit keeps the form's text ("25"); used_count left out falls back to the column default
  const typed = Object.fromEntries(Object.keys(attrs).filter((k) => k !== 'valid_until').map((k) => [k, str(input, k)]));
  const defaults = attrs.used_count === undefined || attrs.used_count === null ? { used_count: 0 } : {};
  if (attrs.used_count === null) { delete attrs.used_count; delete typed.used_count; }
  await createRow(Coupon, 'coupons', 'App\\Models\\Coupon', attrs, who, defaults, { typed });
}

export async function updateCoupon(before: any, input: FormInput, who: Who) {
  await updateRow(Coupon, 'App\\Models\\Coupon', before, {
    code: str(input, 'code'), discount: num(str(input, 'discount')), type: str(input, 'type'), max_uses: num(str(input, 'max_uses')), valid_until: wallDate(str(input, 'valid_until')),
  }, who, { decimals: ['discount'], typed: { discount: str(input, 'discount'), max_uses: str(input, 'max_uses') } });
}

export const destroyCoupon = (before: any, who: Who) => deleteRow(Coupon, 'App\\Models\\Coupon', before, who, { decimals: ['discount'] });

// ── Sliders (SliderController) ────────────────────────────────────────────
export async function sliderIndexData() {
  await connectDb();
  return { sliders: collect((await Slider.find().sort({ position: 1, _id: 1 }).lean()).map(carbonize)) };
}

export async function nextSliderPosition() {
  await connectDb();
  const top = await Slider.findOne().sort({ position: -1 }).select('position').lean();
  return (top?.position ?? 0) + 1;
}

export async function storeSlider(input: FormInput, who: Who) {
  const mediaType = str(input, 'media_type') ?? 'image';
  const image = mediaType !== 'video' && isUpload(input.image) ? await storeRandom(input.image, 'uploads/sliders') : null;
  const video = mediaType === 'video' && isUpload(input.video) ? await storeRandom(input.video, 'uploads/sliders/videos', false) : null;
  await createRow(Slider, 'sliders', 'App\\Models\\Slider', {
    title_en: str(input, 'title_en'), subtitle: str(input, 'subtitle'), link: str(input, 'link'), button_text: str(input, 'button_text'),
    media_type: mediaType, image, video, position: num(str(input, 'position')), status: str(input, 'status'),
  }, who, {}, { typed: { position: str(input, 'position') } });
}

export async function updateSlider(before: any, input: FormInput, who: Who) {
  const mediaType = str(input, 'media_type') ?? before.media_type ?? 'image';
  const attrs: Record<string, unknown> = {};
  if (mediaType === 'video') {
    if (isUpload(input.video)) { await deletePublic(before.video); attrs.video = await storeRandom(input.video, 'uploads/sliders/videos', false); }
    if (before.media_type === 'image' && before.image) { await deletePublic(before.image); attrs.image = null; }
  } else {
    if (isUpload(input.image)) { await deletePublic(before.image); attrs.image = await storeRandom(input.image, 'uploads/sliders'); }
    if (before.media_type === 'video' && before.video) { await deletePublic(before.video); attrs.video = null; }
  }
  Object.assign(attrs, {
    media_type: mediaType, title_en: str(input, 'title_en'), subtitle: str(input, 'subtitle'), link: str(input, 'link'),
    button_text: str(input, 'button_text'), position: num(str(input, 'position')), status: str(input, 'status'),
  });
  await updateRow(Slider, 'App\\Models\\Slider', before, attrs, who, { typed: { position: str(input, 'position') } });
}

export async function destroySlider(before: any, who: Who) {
  await deletePublic(before.image);
  await deletePublic(before.video);
  await deleteRow(Slider, 'App\\Models\\Slider', before, who);
}

// ── Headlines (HeadlineController) ────────────────────────────────────────
export async function headlineIndexData(url: URL) {
  await connectDb();
  const q = url.searchParams.get('q');
  const active = url.searchParams.get('is_active');
  const f: Record<string, unknown> = {};
  if (q) f.message_en = like(q);
  if (active !== null && active !== '') f.is_active = Boolean(parseInt(active, 10) || 0);
  const perPage = 20;
  const page = pageParam(url);
  const [total, rows] = await Promise.all([
    Headline.countDocuments(f),
    Headline.find(f).sort({ sort_order: 1, created_at: -1, _id: 1 }).skip((page - 1) * perPage).limit(perPage).lean(),
  ]);
  return { headlines: Paginator.make(rows.map((h) => wall(carbonize(h), ['starts_at', 'ends_at'])), total, perPage, page).withQueryString() };
}

export async function headlineEditData(id: number) {
  await connectDb();
  const h = await Headline.findById(id).lean();
  return h ? { headline: wall(carbonize(h), ['starts_at', 'ends_at']) } : null;
}

export const headlineRules = {
  message_en: 'required|string|max:255',
  link_url: 'nullable|url|max:255',
  bg_color: 'nullable|string|max:20',
  text_color: 'nullable|string|max:20',
  is_active: 'sometimes|boolean',
  sort_order: 'nullable|integer|min:0',
  starts_at: 'nullable|date',
  ends_at: 'nullable|date|after_or_equal:starts_at',
};

function headlineAttrs(input: FormInput) {
  // $request->validate() returns only the validated keys that were sent
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(headlineRules)) {
    if (!(k in input)) continue;
    const v = str(input, k);
    out[k] = k === 'sort_order' ? num(v) : k === 'starts_at' || k === 'ends_at' ? wallDate(v) : v;
  }
  out.is_active = bool(input, 'is_active');
  return out;
}

/** sort_order stays the form's text in the audit log */
const headlineTyped = (input: FormInput) => ('sort_order' in input ? { sort_order: str(input, 'sort_order') } : {});

export async function storeHeadline(input: FormInput, who: Who) {
  const attrs = headlineAttrs(input);
  // column defaults for keys the form left out
  await createRow(Headline, 'headlines', 'App\\Models\\Headline', attrs, who, { bg_color: '#0f172a', text_color: '#ffffff', sort_order: 0 });
}

export const updateHeadline = (before: any, input: FormInput, who: Who) => updateRow(Headline, 'App\\Models\\Headline', before, headlineAttrs(input), who, { typed: headlineTyped(input) });
export const toggleHeadline = (before: any, who: Who) => updateRow(Headline, 'App\\Models\\Headline', before, { is_active: !before.is_active }, who);
export const destroyHeadline = (before: any, who: Who) => deleteRow(Headline, 'App\\Models\\Headline', before, who);

// ── Policies (PolicyController) ───────────────────────────────────────────
export async function policyIndexData() {
  await connectDb();
  return { policies: collect((await Policy.find().sort({ _id: 1 }).lean()).map(carbonize)) };
}
export async function policyByKey(key: string) {
  await connectDb();
  return Policy.findOne({ key }).lean();
}
export const storePolicy = (input: FormInput, who: Who) =>
  createRow(Policy, 'policies', 'App\\Models\\Policy', { key: str(input, 'key'), title_en: str(input, 'title_en'), content_en: str(input, 'content_en'), status: str(input, 'status') }, who);
export const updatePolicy = (before: any, input: FormInput, who: Who) =>
  updateRow(Policy, 'App\\Models\\Policy', before, { status: str(input, 'status'), title_en: str(input, 'title_en'), content_en: str(input, 'content_en') }, who);
export const destroyPolicy = (before: any, who: Who) => deleteRow(Policy, 'App\\Models\\Policy', before, who);

// ── Popup (PopupSettingController) ────────────────────────────────────────
export async function popupRow() {
  await connectDb();
  return PopupSetting.findOne().sort({ _id: 1 }).lean();
}

export async function createDefaultPopup(who: Who) {
  await createRow(PopupSetting, 'popup_settings', 'App\\Models\\PopupSetting', {
    title: 'Welcome to our store!', content: 'Check out our latest offers and products!', is_active: false, show_on_home: true,
    show_once_per_user: true, dismissible: true, delay_seconds: 2, position: 'center',
  }, who);
}

export async function updatePopup(before: any, input: FormInput, who: Who) {
  let path: string | null = null;
  if (isUpload(input.image_path)) {
    const file = input.image_path;
    // $file->store('popup_images') then re-saved as JPEG (quality 80) under the same name
    const name = await storeRandom(file, 'popup_images', false);
    const ext = name.split('.').pop()!.toLowerCase();
    if (ext !== 'webp') {
      try { await storePublic(name, await sharp(await file.bytes()).jpeg({ quality: 80 }).toBuffer()); } catch { /* keep the original */ }
    }
    path = name;
  }
  await updateRow(PopupSetting, 'App\\Models\\PopupSetting', before, {
    title: str(input, 'title') ?? 'Default Popup Title', content: str(input, 'content'), button_text: str(input, 'button_text'), button_link: str(input, 'button_link'),
    position: str(input, 'position'), delay_seconds: num(str(input, 'delay_seconds')) ?? 0, start_at: wallDate(str(input, 'start_at')), end_at: wallDate(str(input, 'end_at')),
    is_active: 'is_active' in input, show_on_home: 'show_on_home' in input, dismissible: 'dismissible' in input, show_once_per_user: 'show_once_per_user' in input,
    image_path: path ?? before.image_path ?? null,
  }, who, { typed: { delay_seconds: str(input, 'delay_seconds') ?? 0 } });
}

export const popupModel = (p: any) => wall(carbonize(p), ['start_at', 'end_at']);

// ── About page (AboutController) ──────────────────────────────────────────
export async function aboutRow(who: Who | null) {
  await connectDb();
  const row = await AboutSection.findOne().sort({ _id: 1 }).lean();
  if (row) return row;
  const id = await createRow(AboutSection, 'about_sections', null, {}, who ?? { req: new Request('http://localhost/'), adminId: null });
  return (await AboutSection.findById(id).lean())!;
}

export const ABOUT_IMAGES = ['image', 'image2', 'gallery_image1', 'gallery_image2', 'gallery_image3', 'gallery_image4'];
export const ABOUT_TEXT = ['title', 'content', 'brand_subtitle', 'brand_title', 'brand_body1', 'brand_body2', 'brand_cta',
  'brand_stat1_value', 'brand_stat1_label', 'brand_stat2_value', 'brand_stat2_label', 'brand_stat3_value', 'brand_stat3_label', 'brand_stat4_value', 'brand_stat4_label'];

export async function updateAbout(before: any, input: FormInput, who: Who) {
  const attrs: Record<string, unknown> = {};
  for (const k of ABOUT_TEXT) if (k in input) attrs[k] = str(input, k);
  for (const f of ABOUT_IMAGES) {
    if (!isUpload(input[f])) continue;
    await deletePublic(before[f]);
    attrs[f] = await storeRandom(input[f] as UploadedFile, 'uploads/about', false);
  }
  await updateRow(AboutSection, null, before, attrs, who);
}

// ── Reviews (ReviewController admin side) ─────────────────────────────────
export async function reviewIndexData(url: URL) {
  await connectDb();
  const status = url.searchParams.get('status') ?? 'all';
  const f: Record<string, unknown> = status !== 'all' ? { status } : {};
  const perPage = 30;
  const page = pageParam(url);
  const [total, rows, pendingCount, approvedCount, totalCount] = await Promise.all([
    Review.countDocuments(f),
    Review.find(f).sort({ created_at: -1, _id: -1 }).skip((page - 1) * perPage).limit(perPage).lean(),
    Review.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'approved' }),
    Review.countDocuments(),
  ]);
  const products = await Product.find({ _id: { $in: rows.map((r) => r.product_id) } }).lean();
  const reviews = rows.map((r) => {
    const doc = carbonize(r);
    doc.product = productModel(products.find((p) => p._id === r.product_id));
    return doc;
  });
  return { reviews: Paginator.make(reviews, total, perPage, page).withQueryString(), status, pendingCount, approvedCount, totalCount };
}

export const setReviewStatus = (before: any, status: string, who: Who) => updateRow(Review, 'App\\Models\\Review', before, { status }, who);
export const destroyReview = (before: any, who: Who) => deleteRow(Review, 'App\\Models\\Review', before, who);

export const headlineModel = (h: any) => wall(carbonize(h), ['starts_at', 'ends_at']);
