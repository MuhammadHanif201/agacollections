import { NextResponse } from 'next/server';
import { getCurrentCustomer, verifyPassword } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { escapeHtml } from '@/lib/format';
import { putFormState } from '@/lib/form-state';
import { sendMail } from '@/lib/mail';
import { isSameOrigin } from '@/lib/request';
import { readBody } from '@/lib/route';
import { CI, Customer } from '@/models/Customer';
import { getCompanySetting } from '@/services/settings';
import { firstErrors, normalizePkPhone, profileSchema, zodErrors } from '@/validators/store';

const to = (req: Request, path: string) => NextResponse.redirect(new URL(path, req.url), 303);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** CustomerLoginController::updateProfile */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return to(req, '/customer/login');
  if (!isSameOrigin(req)) return to(req, '/customer/profile/edit');
  const body = await readBody(req);

  const input = {
    full_name: str(body.full_name),
    email: str(body.email),
    phone: normalizePkPhone(body.phone),
    city: str(body.city),
    address: str(body.address),
  };

  const parsed = profileSchema.safeParse(input);
  const errors = parsed.success ? {} : zodErrors(parsed.error);
  await connectDb();
  if (!errors.email && (await Customer.exists({ email: input.email.trim(), _id: { $ne: customer._id } }).collation(CI))) {
    errors.email = ['The email has already been taken.'];
  }
  // A new sign-in email needs the current password, so an open session alone cannot take the account
  const emailChanged = input.email.trim().toLowerCase() !== String(customer.email ?? '').toLowerCase();
  if (emailChanged && !errors.email) {
    const row = await Customer.findById(customer._id).select('password').lean();
    if (!(await verifyPassword(str(body.current_password), row?.password))) {
      errors.current_password = ['Enter your current password to change your email.'];
    }
  }
  if (!errors.phone && (await Customer.exists({ phone: input.phone, _id: { $ne: customer._id } }))) {
    errors.phone = ['This mobile number is already linked to another account.'];
  }
  if (!parsed.success || Object.keys(errors).length) {
    await putFormState({ old: { ...input }, errors: { default: errors } });
    const list = parsed.success ? Object.values(errors).map((m) => m[0]) : firstErrors(parsed.error);
    await setFlash('errors', 'Validation Error', [...new Set([...list, ...Object.values(errors).map((m) => m[0])])]);
    return to(req, '/customer/profile/edit');
  }

  const v = parsed.data;
  await Customer.updateOne({ _id: customer._id }, { $set: { full_name: v.full_name, email: v.email, phone: v.phone, city: v.city || null, address: v.address || null } });
  if (emailChanged && customer.email) {
    const brand = (await getCompanySetting())?.name ?? 'AGA Collections';
    await sendMail({
      to: customer.email,
      subject: `Your ${brand} email was changed`,
      html: `<p>Hello ${escapeHtml(v.full_name)},</p><p>The email on your ${escapeHtml(brand)} account was changed to <strong>${escapeHtml(v.email)}</strong>.</p><p>If you did not do this, reply to this email or contact us on WhatsApp straight away.</p>`,
    });
  }
  await setFlash('success', 'Profile updated successfully.');
  return to(req, '/customer/profile/edit');
}
