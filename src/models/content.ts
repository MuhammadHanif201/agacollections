// Smaller storefront collections: settings, coupons, banners, policies, reviews, wishlist, newsletter.
import mongoose, { Schema, type Model } from 'mongoose';

const ts = { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false } as const;

function model<T>(name: string, schema: Schema<T>, collection: string): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema, collection);
}

// ── Company settings (one document) ────────────────────────────────────────
export interface SocialLink {
  platform: string;
  url: string;
}
export interface CompanySettingDoc {
  _id: number;
  shipping_charges: Record<string, number>;
  shipping_mode: string;
  free_shipping_enabled: boolean;
  free_shipping_threshold: number;
  name: string;
  description?: string | null;
  logo?: string | null;
  favicon?: string | null;
  default_category_banner?: string | null;
  size_chart_image?: string | null;
  emails: Record<string, string> | string[];
  phones: string[];
  whatsapps: string[];
  address?: string | null;
  social_links: SocialLink[];
  affiliate_enabled: boolean;
  affiliate_default_rate: number;
  affiliate_min_withdrawal: number;
  affiliate_cookie_days: number;
  created_at: Date;
  updated_at: Date;
}
export const CompanySetting = model<CompanySettingDoc>(
  'CompanySetting',
  new Schema<CompanySettingDoc>(
    {
      _id: Number,
      shipping_charges: { type: Schema.Types.Mixed, default: {} },
      shipping_mode: { type: String, default: 'uae' },
      free_shipping_enabled: { type: Boolean, default: false },
      free_shipping_threshold: { type: Number, default: 0 },
      name: { type: String, required: true },
      description: String,
      logo: String,
      favicon: String,
      default_category_banner: String,
      size_chart_image: String,
      emails: { type: Schema.Types.Mixed, default: {} },
      phones: { type: [String], default: [] },
      whatsapps: { type: [String], default: [] },
      address: String,
      social_links: { type: [{ _id: false, platform: String, url: String }], default: [] },
      affiliate_enabled: { type: Boolean, default: true },
      affiliate_default_rate: { type: Number, default: 8 },
      affiliate_min_withdrawal: { type: Number, default: 1000 },
      affiliate_cookie_days: { type: Number, default: 30 },
    },
    { ...ts, minimize: false },
  ),
  'company_settings',
);

// ── Coupons ────────────────────────────────────────────────────────────────
export interface CouponDoc {
  _id: number;
  code: string;
  discount: number;
  type: 'fixed' | 'percentage';
  max_uses?: number | null;
  used_count: number;
  /** Wall-clock Pakistan time exactly as the admin typed it, stored as "YYYY-MM-DD HH:mm:ss" */
  valid_until?: string | null;
  created_at: Date;
  updated_at: Date;
}
const CouponSchema = new Schema<CouponDoc>(
  {
    _id: Number,
    code: { type: String, required: true },
    discount: { type: Number, required: true },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    max_uses: { type: Number, min: 0 },
    used_count: { type: Number, default: 0, min: 0 },
    valid_until: String,
  },
  ts,
);
CouponSchema.index({ code: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
export const Coupon = model<CouponDoc>('Coupon', CouponSchema, 'coupons');

// ── Sliders ────────────────────────────────────────────────────────────────
export interface SliderDoc {
  _id: number;
  title_en?: string | null;
  subtitle?: string | null;
  link?: string | null;
  button_text?: string | null;
  status: string;
  media_type: 'image' | 'video';
  video?: string | null;
  image?: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}
export const Slider = model<SliderDoc>(
  'Slider',
  new Schema<SliderDoc>(
    {
      _id: Number,
      title_en: String,
      subtitle: String,
      link: String,
      button_text: String,
      status: { type: String, default: 'active' },
      media_type: { type: String, enum: ['image', 'video'], default: 'image' },
      video: String,
      image: String,
      position: { type: Number, default: 1 },
    },
    ts,
  ),
  'sliders',
);

// ── Headlines (announcement ticker) ────────────────────────────────────────
export interface HeadlineDoc {
  _id: number;
  message_en: string;
  link_url?: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
  /** Pakistan wall-clock time "YYYY-MM-DD HH:mm:ss", as entered in the admin */
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: Date;
  updated_at: Date;
}
export const Headline = model<HeadlineDoc>(
  'Headline',
  new Schema<HeadlineDoc>(
    {
      _id: Number,
      message_en: { type: String, required: true, maxlength: 255 },
      link_url: String,
      bg_color: { type: String, default: '#0f172a' },
      text_color: { type: String, default: '#ffffff' },
      is_active: { type: Boolean, default: true },
      sort_order: { type: Number, default: 0 },
      starts_at: String,
      ends_at: String,
    },
    ts,
  ),
  'headlines',
);

// ── Policies ───────────────────────────────────────────────────────────────
export interface PolicyDoc {
  _id: number;
  key: string;
  status: 'published' | 'draft';
  title_en?: string | null;
  content_en?: string | null;
  created_at: Date;
  updated_at: Date;
}
const PolicySchema = new Schema<PolicyDoc>(
  {
    _id: Number,
    key: { type: String, required: true },
    status: { type: String, enum: ['published', 'draft'], default: 'published' },
    title_en: String,
    content_en: String,
  },
  ts,
);
PolicySchema.index({ key: 1 }, { unique: true });
export const Policy = model<PolicyDoc>('Policy', PolicySchema, 'policies');

// ── Popup ──────────────────────────────────────────────────────────────────
export interface PopupSettingDoc {
  _id: number;
  title?: string | null;
  content?: string | null;
  image_path?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  is_active: boolean;
  position: 'center' | 'top' | 'bottom' | 'fullscreen';
  show_on_home: boolean;
  start_at?: string | null;
  end_at?: string | null;
  dismissible: boolean;
  show_once_per_user: boolean;
  delay_seconds: number;
  created_at: Date;
  updated_at: Date;
}
export const PopupSetting = model<PopupSettingDoc>(
  'PopupSetting',
  new Schema<PopupSettingDoc>(
    {
      _id: Number,
      title: String,
      content: String,
      image_path: String,
      button_text: String,
      button_link: String,
      is_active: { type: Boolean, default: false },
      position: { type: String, enum: ['center', 'top', 'bottom', 'fullscreen'], default: 'center' },
      show_on_home: { type: Boolean, default: true },
      start_at: String,
      end_at: String,
      dismissible: { type: Boolean, default: true },
      show_once_per_user: { type: Boolean, default: true },
      delay_seconds: { type: Number, default: 0 },
    },
    ts,
  ),
  'popup_settings',
);

// ── About page ─────────────────────────────────────────────────────────────
export interface AboutSectionDoc {
  _id: number;
  title?: string | null;
  content?: string | null;
  image?: string | null;
  image2?: string | null;
  gallery_image1?: string | null;
  gallery_image2?: string | null;
  gallery_image3?: string | null;
  gallery_image4?: string | null;
  brand_subtitle?: string | null;
  brand_title?: string | null;
  brand_body1?: string | null;
  brand_body2?: string | null;
  brand_cta?: string | null;
  brand_stat1_value?: string | null;
  brand_stat1_label?: string | null;
  brand_stat2_value?: string | null;
  brand_stat2_label?: string | null;
  brand_stat3_value?: string | null;
  brand_stat3_label?: string | null;
  brand_stat4_value?: string | null;
  brand_stat4_label?: string | null;
  created_at: Date;
  updated_at: Date;
}
const aboutFields: Record<string, typeof String> = {};
for (const f of [
  'title', 'content', 'image', 'image2', 'gallery_image1', 'gallery_image2', 'gallery_image3', 'gallery_image4',
  'brand_subtitle', 'brand_title', 'brand_body1', 'brand_body2', 'brand_cta',
  'brand_stat1_value', 'brand_stat1_label', 'brand_stat2_value', 'brand_stat2_label',
  'brand_stat3_value', 'brand_stat3_label', 'brand_stat4_value', 'brand_stat4_label',
]) aboutFields[f] = String;
export const AboutSection = model<AboutSectionDoc>(
  'AboutSection',
  new Schema<AboutSectionDoc>({ _id: Number, ...aboutFields }, ts),
  'about_sections',
);

// ── Reviews ────────────────────────────────────────────────────────────────
export interface ReviewDoc {
  _id: number;
  product_id: number;
  name: string;
  email: string;
  rating: number;
  comment?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}
const ReviewSchema = new Schema<ReviewDoc>(
  {
    _id: Number,
    product_id: { type: Number, required: true },
    name: { type: String, required: true, maxlength: 255 },
    email: { type: String, required: true, maxlength: 255 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  ts,
);
ReviewSchema.index({ product_id: 1, status: 1, created_at: -1 });
export const Review = model<ReviewDoc>('Review', ReviewSchema, 'reviews');

// ── Wishlist ───────────────────────────────────────────────────────────────
export interface WishlistDoc {
  _id: number;
  user_id: number; // customer id (column name kept from MySQL)
  product_id: number;
  created_at: Date;
  updated_at: Date;
}
const WishlistSchema = new Schema<WishlistDoc>(
  { _id: Number, user_id: { type: Number, required: true }, product_id: { type: Number, required: true } },
  ts,
);
WishlistSchema.index({ user_id: 1, product_id: 1 });
export const Wishlist = model<WishlistDoc>('Wishlist', WishlistSchema, 'wishlists');

// ── Newsletter subscribers ─────────────────────────────────────────────────
export interface NewsletterSubscriberDoc {
  _id: number;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  ip?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  created_at: Date;
  updated_at: Date;
}
const NewsletterSubscriberSchema = new Schema<NewsletterSubscriberDoc>(
  {
    _id: Number,
    email: { type: String, required: true, maxlength: 255 },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
    ip: { type: String, maxlength: 45 },
    user_agent: { type: String, maxlength: 512 },
    referrer: { type: String, maxlength: 512 },
  },
  ts,
);
NewsletterSubscriberSchema.index({ email: 1 }, { unique: true });
export const NewsletterSubscriber = model<NewsletterSubscriberDoc>('NewsletterSubscriber', NewsletterSubscriberSchema, 'newsletter_subscribers');

// ── Customer password reset tokens ─────────────────────────────────────────
export interface PasswordResetTokenDoc {
  _id: string; // email
  token: string; // bcrypt hash of the token (as Laravel stores it)
  created_at: Date;
}
export const CustomerPasswordResetToken = model<PasswordResetTokenDoc>(
  'CustomerPasswordResetToken',
  new Schema<PasswordResetTokenDoc>({ _id: String, token: { type: String, required: true }, created_at: { type: Date, required: true } }, { versionKey: false }),
  'customer_password_reset_tokens',
);
