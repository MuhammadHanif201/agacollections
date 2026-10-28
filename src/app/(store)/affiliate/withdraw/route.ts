import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { isSameOrigin, throttle } from '@/lib/request';
import { Affiliate } from '@/models/Affiliate';
import { requestWithdrawal } from '@/services/affiliate';

const back = (req: Request) => NextResponse.redirect(new URL('/affiliate/dashboard', req.url), 303);

/** AffiliateController::requestWithdrawal */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.redirect(new URL('/customer/login', req.url), 303);
  if (!isSameOrigin(req)) return back(req);
  if (!(await throttle('affiliate-withdraw', 5))) {
    await setFlash('error', 'Too many attempts. Please wait a minute and try again.');
    return back(req);
  }
  await connectDb();
  const affiliate = await Affiliate.findOne({ customer_id: customer._id }).lean();
  if (!affiliate) return new NextResponse('Not Found', { status: 404 });
  if (affiliate.status !== 'approved') {
    await setFlash('error', 'Affiliate account not approved.');
    return back(req);
  }
  const error = await requestWithdrawal(affiliate);
  await setFlash(error ? 'error' : 'success', error ?? 'Withdrawal request submitted. You will be paid within 2–3 working days.');
  return back(req);
}
