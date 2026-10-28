/**
 * Copy the Laravel uploads (storage/app/public) to Vercel Blob, keeping each file's
 * relative path, and record the paths in the media_files collection.
 *
 *   npm run upload:media -- ../storage/app/public             # upload new files
 *   npm run upload:media -- ../storage/app/public --dry-run   # list what would be uploaded
 *
 * Needs BLOB_READ_WRITE_TOKEN and MONGODB_URI (.env.local). Afterwards set
 * NEXT_PUBLIC_MEDIA_BASE_URL to the store's public URL that this script prints.
 * It also lists files the database points to that were not found locally.
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { put } from '@vercel/blob';
import { MediaFile } from '../src/models/MediaFile';
import { Product } from '../src/models/Product';
import { Category } from '../src/models/Category';
import { AboutSection, CompanySetting, PopupSetting, Slider } from '../src/models/content';

for (const f of ['.env.local', '.env']) {
  if (fs.existsSync(f)) { process.loadEnvFile(f); break; }
}

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--'));
const DRY = args.includes('--dry-run');
if (!root || !fs.statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('Usage: npm run upload:media -- <path/to/storage/app/public> [--dry-run]');
  process.exit(1);
}

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.pdf': 'application/pdf',
};

function walk(dir: string, base = dir, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else if (e.isFile() && !e.name.startsWith('.')) out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

/** Every media path the store data refers to (to report files that are missing) */
async function referencedPaths(): Promise<Set<string>> {
  const refs = new Set<string>(['banners/zq-hero-poster.jpg', 'banners/zq-hero-poster-m.jpg', 'banners/zq-hero-clothes.mp4', 'banners/zq-hero-clothes-poster.jpg',
    'banners/zq-contact.jpg', 'banners/zq-contact-m.jpg', 'banners/zq-jeans.jpg', 'banners/zq-jeans-m.jpg', 'banners/zq-shop.jpg']);
  const add = (p?: string | null) => { if (p && !/^https?:/.test(p)) refs.add(p.replace(/^\/+/, '')); };
  for (const p of await Product.find().select('images variants').lean()) {
    p.images.forEach((i) => add(i.image_path));
    p.variants.forEach((v) => add(v.primary_image));
  }
  for (const c of await Category.find().lean()) { add(c.image); add(c.banner); }
  for (const s of await Slider.find().lean()) { add(s.image); add(s.video); }
  for (const s of await CompanySetting.find().lean()) { add(s.logo); add(s.favicon); add(s.default_category_banner); add(s.size_chart_image); }
  for (const a of await AboutSection.find().lean()) for (const k of ['image', 'image2', 'gallery_image1', 'gallery_image2', 'gallery_image3', 'gallery_image4'] as const) add(a[k]);
  for (const p of await PopupSetting.find().lean()) add(p.image_path);
  return refs;
}

async function main() {
  const files = walk(root!);
  console.log(`${files.length} files under ${path.resolve(root!)}`);

  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is not set (.env.local).'); process.exit(1); }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  const have = new Set(files);
  const missing = [...(await referencedPaths())].filter((p) => !have.has(p));
  if (missing.length) {
    console.log(`\n${missing.length} file(s) the database refers to are not in this folder (copy them from the live server's storage/app/public):`);
    missing.forEach((m) => console.log('  - ' + m));
  }

  const done = new Set((await MediaFile.find().select('_id').lean()).map((m) => m._id));
  const todo = files.filter((f) => !done.has(f));
  console.log(`\n${todo.length} to upload (${files.length - todo.length} already uploaded).`);
  if (DRY) { await mongoose.disconnect(); return; }
  if (!process.env.BLOB_READ_WRITE_TOKEN) { console.error('BLOB_READ_WRITE_TOKEN is not set.'); process.exit(1); }

  let baseUrl = '';
  for (const rel of todo) {
    const abs = path.join(root!, rel);
    const ext = path.extname(rel).toLowerCase();
    const blob = await put(rel, fs.readFileSync(abs), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: TYPES[ext] ?? 'application/octet-stream',
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    baseUrl ||= blob.url.slice(0, blob.url.length - rel.length - 1);
    await MediaFile.updateOne({ _id: rel }, { $set: { url: blob.url, size: fs.statSync(abs).size, created_at: new Date() } }, { upsert: true });
    console.log('  ' + rel);
  }
  if (baseUrl) console.log(`\nDone. Set NEXT_PUBLIC_MEDIA_BASE_URL=${baseUrl}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
