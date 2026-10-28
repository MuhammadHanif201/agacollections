import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentCustomer, hashPassword, verifyPassword } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { putFormState } from '@/lib/form-state';
import { isSameOrigin, throttle } from '@/lib/request';
import { readBody } from '@/lib/route';
import { Customer } from '@/models/Customer';
import { passwordChangeSchema, zodErrors } from '@/validators/store';

const to = (req: Request, path: string) => NextResponse.redirect(new URL(path, req.url), 303);
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

/** Change password from the profile page (current password required) */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return to(req, '/customer/login');
  if (!isSameOrigin(req)) return to(req, '/customer/profile/edit');
  const back = async (errors: Record<string, string[]>) => {
    await putFormState({ errors: { password: errors } });
    return to(req, '/customer/profile/edit#change-password');
  };
  if (!(await throttle('customer-password', 5))) return back({ current_password: ['Too many attempts. Please try again in a minute.'] });

  const body = await readBody(req);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) return back(zodErrors(parsed.error));
  await connectDb();
  const row = await Customer.findById(customer._id).select('password').lean();
  if (!(await verifyPassword(parsed.data.current_password, row?.password))) {
    return back({ current_password: ['Your current password is not correct.'] });
  }
  // New hash, and "remember me" on other devices stops working
  await Customer.updateOne({ _id: customer._id }, { $set: { password: await hashPassword(parsed.data.password), remember_token: sha256(randomBytes(30).toString('hex')) } });
  await setFlash('success', 'Your password has been changed.');
  return to(req, '/customer/profile/edit');
}
