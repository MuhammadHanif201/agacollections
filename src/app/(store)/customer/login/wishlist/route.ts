import { NextResponse } from 'next/server';
import { setFlash } from '@/lib/flash';

/** WishlistController::index for guests: sign in first, with a message */
export async function GET(req: Request) {
  await setFlash('error', 'Please log in to view your wishlist.');
  return NextResponse.redirect(new URL('/customer/login', req.url), 303);
}
