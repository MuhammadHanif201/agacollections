import { z, type ZodError } from 'zod';

// Laravel's default validation messages, so shoppers see the same wording as before.
const label = (field: string) => field.replace(/_/g, ' ');
const req = (field: string, msg?: string) => ({ error: (iss: { input: unknown }) => (iss.input === undefined || iss.input === null || iss.input === '' ? msg ?? `The ${label(field)} field is required.` : `The ${label(field)} field must be a string.`) });

const requiredString = (field: string, max?: number, msg?: string) => {
  let s = z.string(req(field, msg)).trim().min(1, msg ?? `The ${label(field)} field is required.`);
  if (max) s = s.max(max, `The ${label(field)} field must not be greater than ${max} characters.`);
  return s;
};
const optionalString = (field: string, max?: number) => {
  let s = z.string().trim();
  if (max) s = s.max(max, `The ${label(field)} field must not be greater than ${max} characters.`);
  return z.preprocess((v) => (v === null || v === undefined ? undefined : v), s.optional());
};
const email = (field = 'email', max?: number, msgs?: { required?: string; email?: string }) => {
  let inner = z.email(msgs?.email ?? `The ${label(field)} field must be a valid email address.`);
  if (max) inner = inner.max(max, `The ${label(field)} field must not be greater than ${max} characters.`);
  return requiredString(field, undefined, msgs?.required).pipe(inner);
};

export function zodErrors(err: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? 'form');
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
export const firstErrors = (err: ZodError) => Object.values(zodErrors(err)).map((m) => m[0]);

export const reviewSchema = z.object({
  name: requiredString('name', 100),
  email: email('email', 150),
  rating: z.coerce.number({ error: 'The rating field is required.' }).int('The rating field must be an integer.').min(1, 'The rating field must be at least 1.').max(5, 'The rating field must not be greater than 5.'),
  comment: optionalString('comment', 1000),
});

// Pakistan mobile: +92 then 3XX (operator) then 7 digits
export const PK_PHONE = /^\+92(3\d{2})\d{7}$/;

/** Stored as +92XXXXXXXXXX like checkout (3001234567, 03001234567, 923001234567 and +92 300 1234567 all work) */
export function normalizePkPhone(raw: unknown): string {
  let digits = (typeof raw === 'string' ? raw : '').replace(/\D+/g, '');
  if (digits.length === 12 && digits.startsWith('92')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits === '' ? '' : '+92' + digits;
}

export const checkoutSchema = z.object({
  full_name: requiredString('full name', 255),
  email: email('email', 255),
  phone: requiredString('phone').refine((v) => PK_PHONE.test(v), 'The phone number must be a valid Pakistani mobile number (e.g. +923001234567).'),
  country: requiredString('country').refine((v) => v === 'PK', 'We currently deliver within Pakistan only.'),
  // Lengths match the customer/order fields (longer text used to crash checkout)
  city: requiredString('city', 100),
  address: requiredString('address', 255),
  order_notes: optionalString('order notes', 1000),
  affiliate_code: optionalString('affiliate code', 32),
});

export const contactSchema = z.object({
  name: requiredString('name'),
  email: email(),
  subject: requiredString('subject', 255),
  message: requiredString('message', 2000),
});

export const loginSchema = z.object({
  email: email(),
  password: requiredString('password'),
});

export const registerSchema = z
  .object({
    name: requiredString('name', 255),
    email: email(),
    password: z.string(req('password')).min(1, 'The password field is required.').min(8, 'The password field must be at least 8 characters.'),
    password_confirmation: z.string().optional(),
    country: requiredString('country'),
    city: requiredString('city'),
    phone: z.string({ error: 'The phone field is required.' }).min(1, 'The phone field is required.').regex(PK_PHONE, 'Please enter a valid Pakistani mobile number, for example 3001234567.'),
    address: optionalString('address'),
  })
  .refine((d) => d.password === d.password_confirmation, { path: ['password'], message: 'The password field confirmation does not match.' });

export const forgotSchema = z.object({
  email: email('email', 255, { required: 'Please enter your email address.', email: 'Please enter a valid email address.' }),
});

export const resetSchema = z
  .object({
    token: requiredString('token'),
    email: email(),
    password: z.string(req('password')).min(1, 'The password field is required.').min(8, 'Your new password must be at least 8 characters.'),
    password_confirmation: z.string().optional(),
  })
  .refine((d) => d.password === d.password_confirmation, { path: ['password'], message: 'The two passwords do not match.' });

export const passwordChangeSchema = z
  .object({
    current_password: requiredString('current password'),
    password: z.string(req('password')).min(1, 'Please enter a new password.').min(8, 'Your new password must be at least 8 characters.'),
    password_confirmation: z.string().optional(),
  })
  .refine((d) => d.password === d.password_confirmation, { path: ['password'], message: 'The two passwords do not match.' });

export const profileSchema = z.object({
  full_name: requiredString('full name', 255),
  email: email('email', 255),
  phone: z.string({ error: 'Please enter your mobile number.' }).min(1, 'Please enter your mobile number.').regex(/^\+923\d{9}$/, 'Please enter a valid Pakistani mobile number, for example 3001234567.'),
  city: optionalString('city', 255),
  address: optionalString('address', 255),
});

export const affiliateApplySchema = z.object({
  full_name: requiredString('full name', 120),
  phone: requiredString('phone', 30),
  email: z.preprocess((v) => (v === '' || v == null ? undefined : v), z.email('The email field must be a valid email address.').max(160, 'The email field must not be greater than 160 characters.').optional()),
  payment_method: z.enum(['jazzcash', 'easypaisa', 'bank'], { error: 'The selected payment method is invalid.' }),
  payment_account_number: requiredString('payment account number', 60),
  payment_account_name: requiredString('payment account name', 120),
  bank_name: optionalString('bank name', 120),
});

export const newsletterSchema = z.object({
  email: email('email', 255),
});
