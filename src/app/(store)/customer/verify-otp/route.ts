import { NextResponse } from 'next/server';
import { putFormState } from '@/lib/form-state';

/** No login code is ever pending now, so this answers as the PHP did for an expired one */
export async function POST(req: Request) {
  await putFormState({ errors: { default: { otp: ['Session expired. Please login again.'] } } });
  return NextResponse.redirect(new URL('/customer/login', req.url), 303);
}
