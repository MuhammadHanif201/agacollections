import { NextResponse } from 'next/server';
import { hashPassword, loginCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { setFlash } from '@/lib/flash';
import { putFormState } from '@/lib/form-state';
import { sendMail } from '@/lib/mail';
import { isSameOrigin, throttle } from '@/lib/request';
import { readBody } from '@/lib/route';
import { customerWelcomeHtml } from '@/emails/templates';
import { nextId } from '@/models/Counter';
import { CI, Customer } from '@/models/Customer';
import { getCompanySetting } from '@/services/settings';
import { normalizePkPhone, registerSchema, zodErrors } from '@/validators/store';

const to = (req: Request, path: string) => NextResponse.redirect(new URL(path, req.url), 303);
const OLD_FIELDS = ['name', 'email', 'country', 'city', 'phone', 'address'] as const;

/** CustomerLoginController::register */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return to(req, '/customer/login');
  const body = await readBody(req);
  const old: Record<string, string> = {};
  for (const f of OLD_FIELDS) if (typeof body[f] === 'string') old[f] = body[f] as string;
  const back = async (errors: Record<string, string[]>) => {
    await putFormState({ old, errors: { register: errors }, flags: { show_register: true } });
    return to(req, '/customer/login');
  };

  if (!(await throttle('customer-register', 5))) return back({ register: ['Too many attempts. Please try again in a minute.'] });

  // Same +92 form as checkout and the profile page, so one number is one account
  if (typeof body.phone === 'string') body.phone = normalizePkPhone(body.phone);
  const parsed = registerSchema.safeParse(body);
  const errors = parsed.success ? {} : zodErrors(parsed.error);
  await connectDb();
  // unique:customers,email and unique:customers,phone
  if (typeof body.email === 'string' && !errors.email && (await Customer.exists({ email: body.email.trim() }).collation(CI))) {
    errors.email = ['The email has already been taken.'];
  }
  if (typeof body.phone === 'string' && body.phone && !errors.phone && (await Customer.exists({ phone: body.phone }))) {
    errors.phone = ['The phone has already been taken.'];
  }
  if (!parsed.success || Object.keys(errors).length) return back(errors);
  const v = parsed.data;

  let customerId: number;
  try {
    customerId = await nextId('customers');
    await Customer.create({
      _id: customerId,
      full_name: v.name,
      email: v.email,
      phone: v.phone,
      city: v.city,
      country: v.country,
      address: v.address ?? null,
      password: await hashPassword(v.password),
    });
  } catch (e) {
    // Never show database/technical errors to shoppers
    console.error('Customer sign-up failed: ' + (e as Error).message);
    return back({ register: ['Sorry, we could not create your account right now. Please try again in a moment.'] });
  }

  // Welcome email: failure does not stop the sign-up
  try {
    const brand = (await getCompanySetting())?.name ?? '';
    await sendMail({ to: v.email, subject: 'Welcome to ' + brand, html: customerWelcomeHtml(brand, { full_name: v.name, email: v.email }, env.appUrl + '/customer/login') });
  } catch (e) {
    console.warn('Customer welcome email failed: ' + (e as Error).message);
  }

  await loginCustomer(customerId, false);
  await setFlash('success', 'Account created — welcome!');
  return to(req, '/');
}
