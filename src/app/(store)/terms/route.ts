import { NextResponse } from 'next/server';

export function GET(req: Request) {
  return NextResponse.redirect(new URL('/policies#terms', req.url), 301);
}
