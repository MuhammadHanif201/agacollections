import { NextResponse } from 'next/server';

/** Login codes are no longer sent (sign-in uses email and password): back to the login page */
export function GET(req: Request) {
  return NextResponse.redirect(new URL('/customer/login', req.url), 302);
}
