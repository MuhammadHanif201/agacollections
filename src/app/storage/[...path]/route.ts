import fs from 'node:fs/promises';
import path from 'node:path';
import { connectDb } from '@/lib/db';
import { MediaFile } from '@/models/MediaFile';

// Files in public/storage are served as static files. This handler covers the rest:
// admin uploads kept in Vercel Blob (looked up in media_files, then redirected to), and in
// local development without Blob, uploads written to public/storage after the build,
// which `next start` does not serve by itself.
const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg', '.pdf': 'application/pdf',
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path.map((p) => decodeURIComponent(p));
  const root = path.join(process.cwd(), 'public', 'storage');
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response('Not Found', { status: 404 });

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await connectDb();
    const row = await MediaFile.findById(parts.join('/')).lean();
    if (row?.url && /^https?:\/\//i.test(row.url)) {
      return new Response(null, { status: 308, headers: { location: row.url, 'cache-control': 'public, max-age=3600' } });
    }
  }

  try {
    const data = await fs.readFile(file);
    return new Response(data, { headers: { 'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'public, max-age=3600' } });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
