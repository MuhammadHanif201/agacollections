import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { setFlash } from '@/lib/flash';
import { putFormState } from '@/lib/form-state';
import { sendMail } from '@/lib/mail';
import { isSameOrigin, throttle } from '@/lib/request';
import { readBody } from '@/lib/route';
import { passwordResetHtml } from '@/emails/templates';
import { CustomerPasswordResetToken } from '@/models/content';
import { CI, Customer } from '@/models/Customer';
import { getCompanySetting } from '@/services/settings';
import { forgotSchema, zodErrors } from '@/validators/store';

const to = (req: Request, path: string) => NextResponse.redirect(new URL(path, req.url), 303);
const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

/** CustomerLoginController::sendResetLink */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return to(req, '/customer/forgot-password');
  const body = await readBody(req);
  const email = typeof body.email === 'string' ? body.email : '';
  const fail = async (msg: string | Record<string, string[]>) => {
    await putFormState({ old: { email }, errors: { default: typeof msg === 'string' ? { email: [msg] } : msg } });
    return to(req, '/customer/forgot-password');
  };
  if (!(await throttle('customer-forgot', 5))) return fail('Too many attempts. Please try again in a minute.');

  const parsed = forgotSchema.safeParse({ email });
  if (!parsed.success) return fail(zodErrors(parsed.error));
  const address = parsed.data.email.trim().toLowerCase();

  await connectDb();
  const customer = await Customer.findOne({ email: address }).collation(CI).lean();
  if (customer?.email) {
    // One link a minute (the broker's throttle)
    const existing = await CustomerPasswordResetToken.findById(customer.email).lean();
    if (existing && Date.now() - existing.created_at.getTime() < 60_000) {
      return fail('A reset link was just sent. Please wait a minute before asking for another one.');
    }
    const token = randomBytes(32).toString('hex');
    await CustomerPasswordResetToken.updateOne(
      { _id: customer.email },
      { $set: { token: sha256(token), created_at: new Date() } },
      { upsert: true },
    );
    try {
      const brand = (await getCompanySetting())?.name ?? 'AGA Collections';
      const url = `${env.appUrl}/customer/reset-password/${token}?email=${encodeURIComponent(customer.email)}`;
      await sendMail({
        to: customer.email,
        subject: `Reset your ${brand} password`,
        html: passwordResetHtml(brand, { full_name: customer.full_name, email: customer.email }, url),
      });
    } catch (e) {
      console.error('Customer reset email failed: ' + (e as Error).message);
      return fail('Sorry, we could not send the email right now. Please try again in a few minutes or message us on WhatsApp.');
    }
  }

  // Same answer whether or not the email has an account, so nobody can check who shops here
  await setFlash('success', 'If an account uses that email, a link to reset the password is on its way. Please check your inbox and spam folder.');
  return to(req, '/customer/forgot-password');
}
