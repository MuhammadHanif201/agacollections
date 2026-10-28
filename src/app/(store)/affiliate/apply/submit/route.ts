import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { putFormState } from '@/lib/form-state';
import { isSameOrigin, throttle } from '@/lib/request';
import { readBody } from '@/lib/route';
import { Affiliate } from '@/models/Affiliate';
import { nextId } from '@/models/Counter';
import { generateReferralCode } from '@/services/affiliate';
import { affiliateApplySchema, firstErrors, zodErrors } from '@/validators/store';

const back = (req: Request) => NextResponse.redirect(new URL('/affiliate/apply', req.url), 303);
const FIELDS = ['full_name', 'phone', 'email', 'payment_method', 'payment_account_number', 'payment_account_name', 'bank_name'] as const;

/** AffiliateController::applySubmit */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return back(req);
  if (!(await throttle('affiliate-apply', 5))) {
    await setFlash('error', 'Too many attempts. Please wait a minute and try again.');
    return back(req);
  }
  const body = await readBody(req);
  const old: Record<string, string> = {};
  for (const f of FIELDS) if (typeof body[f] === 'string') old[f] = body[f] as string;

  const parsed = affiliateApplySchema.safeParse(old);
  if (!parsed.success) {
    await putFormState({ old, errors: { default: zodErrors(parsed.error) } });
    await setFlash('errors', 'Validation Error', firstErrors(parsed.error));
    return back(req);
  }
  const data = parsed.data;

  // An application must belong to an account, otherwise the affiliate can never open the dashboard
  const customer = await getCurrentCustomer();
  if (!customer) {
    await setFlash('error', 'Please log in or create an account first, then apply.');
    return back(req);
  }

  await connectDb();
  const exists = await Affiliate.findOne({ customer_id: customer._id }).lean();
  if (exists) {
    await setFlash('error', 'You already have an affiliate application — status: ' + exists.status);
    return back(req);
  }

  await Affiliate.create({
    _id: await nextId('affiliates'),
    customer_id: customer._id,
    full_name: data.full_name,
    phone: data.phone,
    email: data.email ?? customer.email,
    payment_method: data.payment_method,
    payment_account_number: data.payment_account_number,
    payment_account_name: data.payment_account_name,
    bank_name: data.bank_name ?? null,
    referral_code: await generateReferralCode(),
    status: 'pending',
  });

  await setFlash('success', 'Application submitted! We will review it and notify you shortly.');
  return back(req);
}
