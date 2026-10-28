import fs from 'node:fs/promises';
import path from 'node:path';

// Local development without Vercel Blob: uploads are written to public/storage after the
// build, which `next start` does not serve by itself. Files that existed at build time are
// still served as static files; this handler covers the ones added since.
const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg', '.pdf': 'application/pdf',
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const root = path.join(process.cwd(), 'public', 'storage');
  const file = path.resolve(root, ...(await params).path.map((p) => decodeURIComponent(p)));
  if (!file.startsWith(root + path.sep)) return new Response('Not Found', { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new Response(data, { headers: { 'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'public, max-age=3600' } });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
