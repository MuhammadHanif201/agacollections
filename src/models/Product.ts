import mongoose, { Schema, type Model } from 'mongoose';

export interface ProductImage {
  _id: number;
  image_path: string;
  is_primary: boolean;
  created_at?: Date;
}

export interface ProductVariant {
  _id: number;
  option_values: Record<string, string>;
  sku?: string | null;
  price?: number | null;
  sale_price?: number | null;
  cost?: number | null;
  margin?: number | null;
  profit?: number | null;
  quantity?: number | null;
  is_default: boolean;
  primary_image?: string | null;
}

export interface ProductOption {
  _id: number;
  name: string;
  values: { _id: number; value: string }[];
}

export interface ProductDoc {
  _id: number;
  name: string;
  slug: string;
  description?: string | null;
  price?: number | null;
  sale_price?: number | null;
  cost?: number | null;
  margin?: number | null;
  profit?: number | null;
  sku?: string | null;
  quantity?: number | null;
  type?: string | null;
  tags: string[];
  status: 'active' | 'draft';
  views: number;
  sort_order: number;
  is_best_seller: boolean;
  is_featured: boolean;
  category_ids: number[];
  related_ids: number[];
  images: ProductImage[];
  variants: ProductVariant[];
  options: ProductOption[];
  created_at: Date;
  updated_at: Date;
}

const ImageSchema = new Schema<ProductImage>(
  { _id: Number, image_path: { type: String, required: true }, is_primary: { type: Boolean, default: false }, created_at: Date },
  { _id: false },
);

const VariantSchema = new Schema<ProductVariant>(
  {
    _id: Number,
    option_values: { type: Schema.Types.Mixed, default: {} },
    sku: String,
    price: Number,
    sale_price: Number,
    cost: Number,
    margin: Number,
    profit: Number,
    quantity: Number,
    is_default: { type: Boolean, default: false },
    primary_image: String,
  },
  { _id: false, minimize: false },
);

const OptionSchema = new Schema<ProductOption>(
  { _id: Number, name: { type: String, required: true }, values: [{ _id: Number, value: String }] },
  { _id: false },
);

const ProductSchema = new Schema<ProductDoc>(
  {
    _id: Number,
    name: { type: String, required: true, maxlength: 255 },
    slug: { type: String, required: true, maxlength: 255 },
    description: String,
    price: Number,
    sale_price: Number,
    cost: Number,
    margin: Number,
    profit: Number,
    sku: String,
    quantity: Number,
    type: String,
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'draft'], default: 'active' },
    views: { type: Number, default: 0, min: 0 },
    sort_order: { type: Number, default: 0 },
    is_best_seller: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    category_ids: { type: [Number], default: [] },
    related_ids: { type: [Number], default: [] },
    images: { type: [ImageSchema], default: [] },
    variants: { type: [VariantSchema], default: [] },
    options: { type: [OptionSchema], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false },
);

ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ status: 1, sort_order: 1, created_at: -1 });
ProductSchema.index({ category_ids: 1, status: 1 });
ProductSchema.index({ 'variants._id': 1 });

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) || mongoose.model<ProductDoc>('Product', ProductSchema, 'products');
