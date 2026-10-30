import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { blobConfigured } from '@/lib/admin/storage';
import { connectDb } from '@/lib/db';
import { MediaFile } from '@/models/MediaFile';

/** Storage::disk('public')->exists($path) */
export async function mediaExists(p: string | null | undefined): Promise<boolean> {
  if (!p) return false;
  const rel = p.replace(/^\/+/, '');
  await connectDb();
  if (await MediaFile.exists({ _id: rel })) return true;
  // Without Blob the files live in public/storage, often copied there by hand and not
  // listed in media_files, so look on disk as Laravel's local disk did
  if (blobConfigured()) return false;
  const root = path.join(process.cwd(), 'public', 'storage');
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(root + path.sep)) return false;
  return fs.access(abs).then(() => true, () => false);
}
