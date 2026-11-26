import sharp from 'sharp';
import { mediaUrl } from '@/lib/media';

// Small versions of product photos for product cards and gallery thumbnails: /thumb/600/products/abc.webp is the
// photo at /storage/products/abc.webp made 600px wide. Made from the full photo the first time it is asked for,
// then kept by the CDN for a year (photo file names carry a timestamp, so a replaced photo gets a new name).
// New uploads need nothing extra. If the full photo can't be read, the browser is sent to it instead.
const WIDTHS = new Set([600]);
const SAFE = /^[\w./-]+\.(webp|jpe?g|png)$/i;

export async function GET(req: Request, { params }: { params: Promise<{ w: string; path: string[] }> }) {
  const { w, path } = await params;
  const rel = path.map((p) => decodeURIComponent(p)).join('/');
  const width = Number(w);
  // only the sizes the store uses and only image files under storage, so nobody can make the server resize other things
  if (!WIDTHS.has(width) || !SAFE.test(rel) || rel.split('/').includes('..')) return new Response('Not Found', { status: 404 });

  const full = mediaUrl(rel);
  const src = /^https?:\/\//i.test(full) ? full : new URL(full, req.url).toString();
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`source ${res.status}`);
    const out = await sharp(Buffer.from(await res.arrayBuffer()))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    return new Response(new Uint8Array(out), {
      headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
    });
  } catch {
    return new Response(null, { status: 307, headers: { location: full, 'cache-control': 'no-store' } });
  }
}
