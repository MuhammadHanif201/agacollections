import { NextResponse } from 'next/server';
import { loginCustomer, verifyPassword } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { pullIntended, putFormState } from '@/lib/form-state';
import { isSameOrigin, throttle } from '@/lib/request';
import { readBody } from '@/lib/route';
import { CI, Customer } from '@/models/Customer';
import { loginSchema, zodErrors } from '@/validators/store';

const to = (req: Request, path: string) => NextResponse.redirect(new URL(path, req.url), 303);

/** CustomerLoginController::login */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return to(req, '/customer/login');
  const body = await readBody(req);
  const email = typeof body.email === 'string' ? body.email : '';
  if (!(await throttle('customer-login', 5))) {
    await putFormState({ old: { email }, errors: { default: { login: ['Too many login attempts. Please try again in a minute.'] } } });
    return to(req, '/customer/login');
  }

  const parsed = loginSchema.safeParse({ email, password: body.password });
  if (!parsed.success) {
    await putFormState({ old: { email }, errors: { default: zodErrors(parsed.error) } });
    return to(req, '/customer/login');
  }

  await connectDb();
  const customer = await Customer.findOne({ email: parsed.data.email }).collation(CI).select('_id password').lean();
  if (!customer || !(await verifyPassword(parsed.data.password, customer.password))) {
    await putFormState({ old: { email }, errors: { default: { login: ['Invalid email or password.'] } } });
    return to(req, '/customer/login');
  }

  const target = await pullIntended('/');
  await loginCustomer(customer._id, body.remember === '1' || body.remember === 'on' || body.remember === true);
  await setFlash('success', 'Welcome back!');
  return to(req, target);
}
