import mongoose, { Schema, type Model } from 'mongoose';

export interface CustomerDoc {
  _id: number;
  full_name: string;
  email?: string | null;
  phone: string;
  country?: string | null;
  password?: string | null; // bcrypt hash; existing Laravel $2y$ hashes verify unchanged
  remember_token?: string | null;
  city?: string | null;
  address?: string | null;
  villa_apartment?: string | null;
  created_at: Date;
  updated_at: Date;
}

const CustomerSchema = new Schema<CustomerDoc>(
  {
    _id: Number,
    full_name: { type: String, required: true, maxlength: 255 },
    email: { type: String, maxlength: 255 },
    phone: { type: String, required: true, maxlength: 255 },
    country: { type: String, maxlength: 2 },
    password: String,
    remember_token: String,
    city: String,
    address: String,
    villa_apartment: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, versionKey: false },
);

/** MySQL compared emails case-insensitively (utf8mb4_unicode_ci); queries pass this collation */
export const CI = { locale: 'en', strength: 2 } as const;

// Same unique keys as MySQL; email may be empty on old rows, like a NULL there
CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ email: 1 }, { unique: true, collation: CI, partialFilterExpression: { email: { $type: 'string' } } });

export const Customer: Model<CustomerDoc> =
  (mongoose.models.Customer as Model<CustomerDoc>) || mongoose.model<CustomerDoc>('Customer', CustomerSchema, 'customers');
