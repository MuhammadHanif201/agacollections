import mongoose, { Schema, type Model } from 'mongoose';

export interface CategoryDoc {
  _id: number;
  sort_order: number;
  title: string;
  slug?: string | null;
  image?: string | null;
  banner?: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

const CategorySchema = new Schema<CategoryDoc>(
  {
    _id: Number,
    sort_order: { type: Number, default: 0 },
    title: { type: String, required: true, maxlength: 255 },
    slug: String,
    image: String,
    banner: String,
    status: { type: String, default: 'active' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false },
);

CategorySchema.index({ slug: 1 });
CategorySchema.index({ status: 1, sort_order: 1 });

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) || mongoose.model<CategoryDoc>('Category', CategorySchema, 'categories');
