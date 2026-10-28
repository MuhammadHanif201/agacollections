import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

/** Generated so the Sitemap line always points at this site's own domain (APP_URL) */
export function GET() {
  const lines = [
    'User-agent: *',
    'Disallow: /admin/',
    'Disallow: /customer/',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /otp/',
    'Disallow: /thankyou/',
    'Disallow: /*?search=',
    'Allow: /',
    '',
    `Sitemap: ${env.appUrl}/sitemap.xml`,
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=UTF-8' } });
}
