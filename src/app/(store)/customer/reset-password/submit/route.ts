import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { hashPassword, loginCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { putFormState } from '@/lib/form-state';
import { isSameOrigin, throttle } from '@/lib/request';
import { readBody } from '@/lib/route';
import { CustomerPasswordResetToken } from '@/models/content';
import { CI, Customer } from '@/models/Customer';
import { resetSchema, zodErrors } from '@/validators/store';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
const EXPIRE_MS = 60 * 60 * 1000; // links work for 60 minutes

/** CustomerLoginController::resetPassword */
export async function POST(req: Request) {
  const body = await readBody(req);
  const token = typeof body.token === 'string' ? body.token : '';
  const email = typeof body.email === 'string' ? body.email : '';
  const back = async (errors: Record<string, string[]>) => {
    await putFormState({ old: { email }, errors: { default: errors } });
    return NextResponse.redirect(new URL(`/customer/reset-password/${encodeURIComponent(token)}?email=${encodeURIComponent(email)}`, req.url), 303);
  };
  if (!isSameOrigin(req)) return back({ reset: ['This reset link is invalid or has expired. Please ask for a new one.'] });
  if (!(await throttle('customer-reset', 5))) return back({ reset: ['Too many attempts. Please try again in a minute.'] });

  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return back(zodErrors(parsed.error));

  await connectDb();
  const customer = await Customer.findOne({ email: parsed.data.email.trim() }).collation(CI).lean();
  const record = customer?.email ? await CustomerPasswordResetToken.findById(customer.email).lean() : null;
  const valid = record
    && Date.now() - record.created_at.getTime() < EXPIRE_MS
    && record.token.length === 64
    && timingSafeEqual(Buffer.from(record.token), Buffer.from(sha256(parsed.data.token)));
  if (!customer || !valid) return back({ reset: ['This reset link is invalid or has expired. Please ask for a new one.'] });

  await Customer.updateOne({ _id: customer._id }, {
    $set: { password: await hashPassword(parsed.data.password), remember_token: sha256(randomBytes(30).toString('hex')) },
  });
  await CustomerPasswordResetToken.deleteOne({ _id: customer.email });

  await loginCustomer(customer._id, false);
  await setFlash('success', 'Your password has been changed and you are signed in.');
  return NextResponse.redirect(new URL('/', req.url), 303);
}
