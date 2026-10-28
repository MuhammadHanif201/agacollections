// Admin accounts (Laravel "users" table), their password-reset tokens and the audit log.
import mongoose, { Schema, type Model } from 'mongoose';

function model<T>(name: string, schema: Schema<T>, collection: string): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema, collection);
}

export interface UserDoc {
  _id: number;
  name: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  email_verified_at?: Date | null;
  password?: string | null;
  remember_token?: string | null; // sha256 of the "remember me" cookie token
  last_login_at?: Date | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

const UserSchema = new Schema<UserDoc>(
  {
    _id: Number,
    name: { type: String, required: true },
    username: String,
    email: { type: String, required: true },
    phone: String,
    email_verified_at: Date,
    password: String,
    remember_token: String,
    last_login_at: Date,
    created_at: Date,
    updated_at: Date,
  },
  { versionKey: false, strict: false },
);
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { username: { $type: 'string' } } });

export const User = model<UserDoc>('User', UserSchema, 'users');

// Laravel's password_reset_tokens table (admins): one row per email, token stored hashed
export interface AdminResetTokenDoc {
  _id: string; // email
  token: string; // bcrypt hash, as Laravel stores it
  created_at: Date;
}
export const AdminPasswordResetToken = model<AdminResetTokenDoc>(
  'AdminPasswordResetToken',
  new Schema<AdminResetTokenDoc>({ _id: String, token: { type: String, required: true }, created_at: { type: Date, required: true } }, { versionKey: false }),
  'password_reset_tokens',
);

// owen-it/laravel-auditing rows; values are JSON text like the MySQL columns
export interface AuditDoc {
  _id: number;
  user_type: string | null;
  user_id: number | null;
  event: string;
  auditable_type: string;
  auditable_id: number;
  old_values: string | null;
  new_values: string | null;
  url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  tags: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}
const AuditSchema = new Schema<AuditDoc>(
  {
    _id: Number,
    user_type: String,
    user_id: Number,
    event: { type: String, required: true },
    auditable_type: { type: String, required: true },
    auditable_id: { type: Number, required: true },
    old_values: String,
    new_values: String,
    url: String,
    ip_address: String,
    user_agent: String,
    tags: String,
    created_at: Date,
    updated_at: Date,
  },
  { versionKey: false },
);
AuditSchema.index({ created_at: -1 });
AuditSchema.index({ auditable_type: 1, auditable_id: 1 });
export const Audit = model<AuditDoc>('Audit', AuditSchema, 'audits');
