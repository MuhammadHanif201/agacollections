import { NextResponse } from 'next/server';
import { setFlash } from '@/lib/flash';

// Checkout codes are switched off (orders are placed directly, as in the PHP), so no code
// is ever pending: the page sends shoppers back to checkout, and a submitted code is wrong.

export function GET(req: Request) {
  return NextResponse.redirect(new URL('/checkout', req.url), 302);
}

export async function POST(req: Request) {
  await setFlash('error', 'Invalid OTP. Please try again.');
  return NextResponse.redirect(new URL('/checkout', req.url), 303);
}
