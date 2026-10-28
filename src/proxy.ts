import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { connectDb } from '@/lib/db';
import { Affiliate, AffiliateClick, AFFILIATE_COOKIE } from '@/models/Affiliate';
import { CompanySetting } from '@/models/content';
import { nextId } from '@/models/Counter';

const SESSION_COOKIE = 'zq_session';

/**
 * Runs before storefront pages:
 *  - passes the path on to pages (canonical URLs)
 *  - CaptureAffiliateReferral: ?ref=CODE from an approved affiliate sets the referral
 *    cookie for the configured number of days and logs the click
 */
export async function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-zq-path', request.nextUrl.pathname);

  // Every visitor gets a session cookie on the first request (as Laravel did), so pages
  // can remember things like the page to return to after signing in
  let newToken: string | null = null;
  if (!request.cookies.get(SESSION_COOKIE)) {
    newToken = randomBytes(32).toString('base64url');
    const existing = headers.get('cookie');
    headers.set('cookie', (existing ? existing + '; ' : '') + `${SESSION_COOKIE}=${newToken}`);
  }

  const response = NextResponse.next({ request: { headers } });
  if (newToken) {
    response.cookies.set(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Number(process.env.SESSION_LIFETIME || 10080) * 60,
    });
  }

  const ref = request.nextUrl.searchParams.get('ref');
  if (ref && ref.trim() !== '' && request.method === 'GET') {
    try {
      await connectDb();
      const code = ref.trim().toUpperCase();
      const affiliate = await Affiliate.findOne({ referral_code: code, status: 'approved' }).lean();
      if (affiliate) {
        const setting = await CompanySetting.findOne().sort({ _id: 1 }).select('affiliate_cookie_days').lean();
        const days = Math.max(Number(setting?.affiliate_cookie_days ?? 30), 1);
        response.cookies.set(AFFILIATE_COOKIE, affiliate.referral_code, {
          maxAge: days * 24 * 3600,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
        // Tracking must never break the request
        try {
          await AffiliateClick.create({
            _id: await nextId('affiliate_clicks'),
            affiliate_id: affiliate._id,
            ip: (request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '').slice(0, 45) || null,
            user_agent: (request.headers.get('user-agent') ?? '').slice(0, 512),
            referrer_url: (request.headers.get('referer') ?? '').slice(0, 1024),
            landing_url: request.nextUrl.href.slice(0, 1024),
            created_at: new Date(),
          });
        } catch { /* ignore */ }
      }
    } catch { /* ignore: the page still loads */ }
  }
  return response;
}

export const config = {
  // Pages only: skip Next internals, API-style endpoints and static files
  matcher: ['/((?!_next/|legacy/|clientside/|adminSide/|images/|storage/|favicon.ico|site.webmanifest|.*\\.(?:css|js|png|jpg|jpeg|webp|avif|svg|ico|woff2?|ttf|mp4)$).*)'],
};
