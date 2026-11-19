import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The store and (later) the admin panel have their own root layouts
  experimental: { globalNotFound: true },
  // Product and category photos come from Vercel Blob (NEXT_PUBLIC_MEDIA_BASE_URL). The
  // storefront renders plain <img> tags with the original markup, so next/image is not used.
  // Basic hardening on every response: no framing by other sites (clickjacking), no MIME
  // sniffing, and only the origin is sent as referrer to other sites
  async headers() {
    // Photos, videos and theme files: browsers keep them a day and refresh them in the background for a week,
    // so repeat visits do not re-check every image. Replaced banners get new file names (or ?v=) so they show at once.
    const keepADay = [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }];
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/storage/:path*', headers: keepADay },
      { source: '/images/:path*', headers: keepADay },
      { source: '/clientside/company_logo/:path*', headers: keepADay },
    ];
  },
};

export default nextConfig;
