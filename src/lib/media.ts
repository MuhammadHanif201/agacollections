// Uploaded files keep the relative paths they had under storage/app/public
// (e.g. "products/abc.webp"); NEXT_PUBLIC_MEDIA_BASE_URL points at the Vercel Blob
// store that holds them. Absolute URLs (new Blob uploads) are returned unchanged.
// Used by server and client components alike, so only the public variable is read.
const base = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || '/storage').replace(/\/+$/, '');

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}/${path.replace(/^\/+/, '').replace(/^storage\//, '')}`;
}
