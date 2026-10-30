import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { del, put } from '@vercel/blob';
import sharp from 'sharp';
import { connectDb } from '@/lib/db';
import { MediaFile } from '@/models/MediaFile';
import type { UploadedFile } from './form';
import { fileExtension } from './validate';

// Storage::disk('public'): Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise
// public/storage on this machine (local development). Paths stay relative
// ("products/x.webp") exactly like the old storage/app/public paths.

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
  svg: 'image/svg+xml', ico: 'image/x-icon', bmp: 'image/bmp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
};
/** A Blob store is connected: by read-write token, or by Vercel's OIDC connection (BLOB_STORE_ID) */
export const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim());
const localRoot = () => path.join(process.cwd(), 'public', 'storage');

export async function storePublic(rel: string, data: Buffer) {
  rel = rel.replace(/^\/+/, '');
  const ext = path.extname(rel).slice(1).toLowerCase();
  await connectDb();
  if (blobConfigured()) {
    const opts = { addRandomSuffix: false, allowOverwrite: true, contentType: TYPES[ext] ?? 'application/octet-stream', cacheControlMaxAge: 60 * 60 * 24 * 365 };
    let access: 'public' | 'private' = 'public';
    let blob;
    try {
      blob = await put(rel, data, { ...opts, access });
    } catch (e) {
      // a private store refuses public files: keep it private and serve it through /storage
      console.warn('Public Blob upload failed, trying private: ' + (e as Error).message);
      access = 'private';
      blob = await put(rel, data, { ...opts, access });
    }
    await MediaFile.updateOne({ _id: rel }, { $set: { url: blob.url, access, size: data.length, created_at: new Date() } }, { upsert: true });
  } else {
    const abs = path.join(localRoot(), rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, data);
    await MediaFile.updateOne({ _id: rel }, { $set: { url: '/storage/' + rel, size: data.length, created_at: new Date() } }, { upsert: true });
  }
  return rel;
}

/** Storage::disk('public')->delete($path) — a missing file is not an error */
export async function deletePublic(rel: string | null | undefined) {
  if (!rel) return;
  rel = rel.replace(/^\/+/, '');
  try {
    await connectDb();
    const row = await MediaFile.findById(rel).lean();
    if (blobConfigured()) { if (row?.url) await del(row.url); }
    else await fs.rm(path.join(localRoot(), rel), { force: true });
    await MediaFile.deleteOne({ _id: rel });
  } catch (e) {
    console.warn('Media delete failed: ' + (e as Error).message);
  }
}

/**
 * The upload hook of the old app (MediaOptimizer): JPEG / PNG / WebP pictures are
 * resized to at most 1600px, compressed and saved as WebP; other files are kept as sent.
 * `base` is the path without extension, e.g. "products/my-shirt-primary-1712345678".
 * Returns the stored relative path.
 */
export async function storeImage(file: UploadedFile, base: string, max = 1600, quality = 82): Promise<string> {
  const ext = fileExtension(file);
  const bytes = await file.bytes();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
    try {
      const out = await sharp(bytes).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).webp({ quality }).toBuffer();
      if (out.length > 0) return storePublic(`${base}.webp`, out);
    } catch (e) {
      console.warn('Image optimise failed, keeping the original: ' + (e as Error).message);
    }
  }
  return storePublic(`${base}.${ext || 'bin'}`, bytes);
}

/** $file->store('dir', 'public'): a random 40-character name with the file's extension */
export async function storeRandom(file: UploadedFile, dir: string, optimise = true): Promise<string> {
  const name = Array.from({ length: 40 }, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]).join('');
  if (optimise) return storeImage(file, `${dir}/${name}`);
  const ext = fileExtension(file) || 'bin';
  return storePublic(`${dir}/${name}.${ext === 'jpeg' ? 'jpg' : ext}`, await file.bytes());
}
