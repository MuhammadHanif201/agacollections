import { NextResponse } from 'next/server';
import { getCurrentCustomer, logoutCustomer } from '@/lib/auth';
import { setFlash } from '@/lib/flash';
import { isSameOrigin } from '@/lib/request';

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.redirect(new URL('/customer/dashboard', req.url), 303);
  const customer = await getCurrentCustomer();
  await logoutCustomer(customer?._id ?? null);
  await setFlash('success', 'Logged out.');
  return NextResponse.redirect(new URL('/customer/login', req.url), 303);
}
