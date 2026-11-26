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

/** A smaller copy of a photo (the full photo is up to 1600px): /thumb/600/products/abc.webp, made by app/thumb from the
 *  full photo and cached. Widths: 600 (default, cards), 400 (cards on phones, via cardSrcSet) and 200 (menu, drawer and
 *  gallery thumbnails). Absolute URLs and non-image files are returned as mediaUrl gives them. */
export type ThumbWidth = 200 | 400 | 600;
export function thumbUrl(path: string | null | undefined, width: ThumbWidth = 600): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || !/\.(webp|jpe?g|png)$/i.test(path)) return mediaUrl(path);
  return `/thumb/${width}/${path.replace(/^\/+/, '').replace(/^storage\//, '')}`;
}

/** srcset for a product card photo: phones (2 cards a row) take the 400px copy, wider screens the 600px one */
export function cardSrcSet(path: string | null | undefined): string | undefined {
  const a = thumbUrl(path, 400);
  return a.startsWith('/thumb/') ? `${a} 400w, ${thumbUrl(path, 600)} 600w` : undefined;
}
export const CARD_SIZES = '(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw';
