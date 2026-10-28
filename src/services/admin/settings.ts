import 'server-only';
import bcrypt from 'bcryptjs';
import { verifyPassword } from '@/lib/auth';
import { createRow, deleteRow, updateRow, type Who } from '@/lib/admin/crud';
import { bool, isUpload, str, type FormInput } from '@/lib/admin/form';
import { carbonize, collect, filled } from '@/lib/admin/php';
import { storeRandom } from '@/lib/admin/storage';
import { validate, type Errors } from '@/lib/admin/validate';
import { connectDb } from '@/lib/db';
import { CompanySetting } from '@/models/content';
import { CI } from '@/models/Customer';
import { User } from '@/models/User';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Store settings (CompanySettingController) ─────────────────────────────
export async function settingRow() {
  await connectDb();
  return CompanySetting.findOne().sort({ _id: 1 }).lean();
}

const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});
const vals = (v: unknown): any[] => (Array.isArray(v) ? v : Object.values(obj(v)));

export const settingUpdateRules = {
  name: 'required|string|max:255',
  description: 'nullable|string',
  address: 'nullable|string',
  emails: 'nullable|array',
  phones: 'nullable|array',
  whatsapps: 'nullable|array',
  social_links: 'nullable|array',
  'social_links.*.platform': 'nullable|string',
  'social_links.*.url': 'nullable|url',
  logo: 'nullable|image|max:2048',
  favicon: 'nullable|image|max:2048',
  shipping_mode: 'required|string|in:flat,by_region',
  shipping_charges: 'nullable|array',
  'shipping_charges.*': 'nullable|numeric|min:0',
};

export const settingStoreRules = {
  name: 'required|string|max:255',
  description: 'nullable|string',
  logo: 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
  default_category_banner: 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
  size_chart_image: 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
  emails: 'nullable|array',
  phones: 'nullable|array',
  whatsapps: 'nullable|array',
  address: 'nullable|string',
  shipping_charges: 'nullable|numeric|min:0',
  social_links: 'nullable|array',
  'social_links.*.platform': 'required_with:social_links.*.url|string|max:50',
  'social_links.*.url': 'required_with:social_links.*.platform|url',
};

/** CompanySettingController::store (CompanySetting::create($validated)) */
export async function storeSetting(input: FormInput, who: Who) {
  const attrs: Record<string, unknown> = {};
  for (const k of ['name', 'description', 'address', 'emails', 'phones', 'whatsapps', 'shipping_charges', 'social_links']) {
    if (!(k in input)) continue;
    const v = input[k];
    attrs[k] = k === 'phones' || k === 'whatsapps' || k === 'social_links' ? vals(v) : v;
  }
  if (isUpload(input.logo)) attrs.logo = await storeRandom(input.logo, 'company', false);
  await createRow(CompanySetting, 'company_settings', 'App\\Models\\CompanySetting', attrs, who);
}

const ALLOWED_ZONES = ['karachi', 'lahore', 'islamabad', 'other_major', 'rest_of_pakistan', 'remote'];
const BY_REGION_ONLY = ['karachi', 'lahore', 'islamabad', 'other_major', 'remote'];

/** CompanySettingController::update; returns an error message for the "back with error" case */
export async function updateSetting(before: any, input: FormInput, who: Who): Promise<string | null> {
  const mode = str(input, 'shipping_mode')!;
  const shipping: Record<string, number> = {};
  for (const [code, value] of Object.entries(obj(input.shipping_charges))) {
    if (value === null || value === '') continue;
    if (!ALLOWED_ZONES.includes(code)) continue;
    if (mode === 'flat' && BY_REGION_ONLY.includes(code)) continue;
    const n = Number(value);
    if (typeof value !== 'string' || !Number.isFinite(n) || n < 0) {
      return code.replace(/_/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase()) + ' shipping cost must be a non-negative number.';
    }
    shipping[code] = n;
  }
  const attrs: Record<string, unknown> = {};
  if (isUpload(input.logo)) attrs.logo = await storeRandom(input.logo, 'logos', false);
  if (isUpload(input.favicon)) attrs.favicon = await storeRandom(input.favicon, 'favicon', false);
  if (isUpload(input.default_category_banner)) attrs.default_category_banner = await storeRandom(input.default_category_banner, 'banners', false);
  if (isUpload(input.size_chart_image)) attrs.size_chart_image = await storeRandom(input.size_chart_image, 'size-charts', false);
  else if (bool(input, 'remove_size_chart')) attrs.size_chart_image = null;

  attrs.free_shipping_enabled = 'free_shipping_enabled' in input;
  attrs.free_shipping_threshold = Number(str(input, 'free_shipping_threshold') ?? 0) || 0;
  attrs.name = str(input, 'name');
  attrs.description = str(input, 'description');
  attrs.address = str(input, 'address');
  const emails: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(input.emails))) { const t = String(v ?? '').trim(); if (t !== '') emails[k] = t; }
  attrs.emails = Object.keys(emails).length ? emails : null;
  attrs.phones = vals(input.phones).filter((p) => filled(p) && p !== '0');
  attrs.whatsapps = vals(input.whatsapps).filter((p) => filled(p) && p !== '0');
  attrs.social_links = vals(input.social_links).filter((l: any) => l && filled(l.platform) && filled(l.url)).map((l: any) => ({ platform: l.platform, url: l.url }));
  attrs.shipping_charges = Object.keys(shipping).length ? shipping : null;
  attrs.shipping_mode = mode;
  await updateRow(CompanySetting, 'App\\Models\\CompanySetting', before, attrs, who, { decimals: ['free_shipping_threshold', 'affiliate_default_rate'] });
  return null;
}

// ── Admin users and own profile (ProfileController) ───────────────────────
const PHONE = 'regex:/^(\\+?92|0)?3[0-9]{9}$/';

/** 03XXXXXXXXX / +923XXXXXXXXX / 923… → stored as 3XXXXXXXXX */
export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const p = phone.replace(/[\s\-.()]/g, '').replace(/^\+?92/, '').replace(/^0+/, '');
  return p || null;
}

const uniqueUser = (field: 'email' | 'username', ignore: number | null) => ({
  name: 'unique',
  test: async (v: unknown) => !(await User.findOne({ [field]: String(v), ...(ignore ? { _id: { $ne: ignore } } : {}) }).collation(CI).lean()),
});

// Passwords and remember tokens are kept out of the audit log
const auditable = (a: Record<string, unknown>) => Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'password' && k !== 'remember_token'));

export async function adminsIndexData() {
  await connectDb();
  const users = await User.find().select('-password -remember_token').sort({ created_at: -1, _id: -1 }).lean();
  return { users: collect(users.map(carbonize)) };
}

export async function validateAdmin(input: FormInput, id: number | null): Promise<Errors> {
  return validate(input, {
    adminName: 'required|string|max:255',
    adminUsername: ['nullable', 'string', 'alpha_dash', 'min:3', 'max:50', uniqueUser('username', id)],
    adminEmail: ['required', 'email', uniqueUser('email', id)],
    adminPassword: id ? 'nullable|string|min:8|confirmed' : 'required|string|min:8|confirmed',
    adminPhone: ['nullable', PHONE],
  }, {
    messages: {
      'adminName.required': 'Full name is required.',
      'adminUsername.alpha_dash': 'Username may only contain letters, numbers, dashes, and underscores.',
      'adminUsername.unique': 'This username is already taken.',
      'adminEmail.required': 'Email address is required.',
      'adminEmail.unique': id ? 'This email is already in use.' : 'This email is already registered.',
      'adminPassword.required': 'Password is required.',
      'adminPassword.min': 'Password must be at least 8 characters.',
      'adminPassword.confirmed': 'Password confirmation does not match.',
      'adminPhone.regex': 'Enter a valid Pakistan number: 03XXXXXXXXX or +923XXXXXXXXX.',
    },
  });
}

export async function storeAdmin(input: FormInput, who: Who) {
  const attrs = {
    name: str(input, 'adminName'),
    username: str(input, 'adminUsername')?.toLowerCase() ?? null,
    email: str(input, 'adminEmail'),
    password: await bcrypt.hash(str(input, 'adminPassword') ?? '', 12),
    phone: normalizePhone(str(input, 'adminPhone')),
  };
  const id = await createRow(User, 'users', null, attrs, who, { email_verified_at: null, remember_token: null, last_login_at: null });
  const { recordAudit } = await import('@/lib/admin/audit');
  await recordAudit({ event: 'created', type: 'App\\Models\\User', id, new: { ...auditable(attrs), id }, userId: who.adminId, req: who.req });
}

async function saveUser(before: any, attrs: Record<string, unknown>, who: Who) {
  const { dirty, recordAudit } = await import('@/lib/admin/audit');
  const d = dirty(before, attrs);
  if (!d.changed) return;
  await User.updateOne({ _id: before._id }, { $set: { ...d.new, updated_at: new Date() } });
  const old = auditable(d.old), now = auditable(d.new);
  if (Object.keys(now).length || 'password' in d.new) await recordAudit({ event: 'updated', type: 'App\\Models\\User', id: before._id, old, new: now, userId: who.adminId, req: who.req });
}

export async function updateAdmin(before: any, input: FormInput, who: Who) {
  const attrs: Record<string, unknown> = {
    name: str(input, 'adminName'),
    username: str(input, 'adminUsername')?.toLowerCase() ?? null,
    email: str(input, 'adminEmail'),
    phone: normalizePhone(str(input, 'adminPhone')),
  };
  if (str(input, 'adminPassword')) attrs.password = await bcrypt.hash(str(input, 'adminPassword')!, 12);
  await saveUser(before, attrs, who);
}

export async function deleteAdmin(before: any, who: Who) {
  await deleteRow(User, 'App\\Models\\User', auditable(before) as any, who);
}

/** ProfileController::profileUpdate: field errors, or null when saved */
export async function updateProfile(before: any, input: FormInput, who: Who): Promise<Errors | null> {
  const changingPassword = filled(str(input, 'current_password')) || filled(str(input, 'new_password')) || filled(str(input, 'confirm_password'));
  const rules: Record<string, any> = {
    name: 'required|string|max:255',
    username: ['nullable', 'string', 'alpha_dash', 'min:3', 'max:50', uniqueUser('username', before._id)],
    email: ['required', 'email', uniqueUser('email', before._id)],
    phone: ['nullable', PHONE],
  };
  const messages: Record<string, string> = {
    'name.required': 'Full name is required.',
    'username.alpha_dash': 'Username may only contain letters, numbers, dashes, and underscores.',
    'username.min': 'Username must be at least 3 characters.',
    'username.unique': 'This username is already taken.',
    'email.required': 'Email is required.',
    'email.unique': 'This email is already in use.',
    'phone.regex': 'Enter a valid Pakistan number: 03XXXXXXXXX or +923XXXXXXXXX.',
  };
  if (changingPassword) {
    rules.current_password = 'required';
    rules.new_password = 'required|min:8|confirmed';
    messages['current_password.required'] = 'Current password is required.';
    messages['new_password.min'] = 'New password must be at least 8 characters.';
    messages['new_password.confirmed'] = 'Password confirmation does not match.';
  }
  const errors = await validate(input, rules, { messages });
  if (Object.keys(errors).length) return errors;
  const attrs: Record<string, unknown> = {};
  if (changingPassword) {
    const full = await User.findById(before._id).select('password').lean();
    if (!(await verifyPassword(str(input, 'current_password') ?? '', full?.password))) return { current_password: ['Current password is incorrect.'] };
    attrs.password = await bcrypt.hash(str(input, 'new_password')!, 12);
  }
  Object.assign(attrs, { name: str(input, 'name'), username: str(input, 'username')?.toLowerCase() ?? null, email: str(input, 'email'), phone: normalizePhone(str(input, 'phone')) });
  await saveUser(before, attrs, who);
  return null;
}
