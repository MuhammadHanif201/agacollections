import sharp from 'sharp';
import { mediaUrl } from '@/lib/media';

// Product photos are WebP, which Outlook and some phone mail apps cannot show. Order emails
// link here instead: /email-image/products/<file>.webp.jpg is that photo as a small JPEG
// (4:5, like the email's thumbnails). The CDN keeps each result, so it is converted once.
// Paths ending in .jpg skip the proxy, so no session cookie stops the CDN from caching.

const ALLOWED = /^(products|uploads|banners|categories)\/[\w.-]+(\/[\w.-]+)*\.(webp|png|jpe?g|avif)$/i;

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.map((p) => decodeURIComponent(p)).join('/').replace(/\.jpg$/i, '');
  if (!ALLOWED.test(rel) || rel.includes('..')) return new Response('Not Found', { status: 404 });

  const src = mediaUrl(rel);
  // the photo from this same site (or the media host), whatever domain served this request
  const res = await fetch(src.startsWith('http') ? src : new URL(req.url).origin + src).catch(() => null);
  if (!res?.ok) return new Response('Not Found', { status: 404 });

  const jpg = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize({ width: 240, height: 300, fit: 'cover' })
    .flatten({ background: '#f3f1ec' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
  });
}
