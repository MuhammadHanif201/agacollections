import 'server-only';
import { cookies } from 'next/headers';

export type FlashType = 'success' | 'error' | 'errors' | 'newsletter_success' | 'newsletter_error';
export interface Flash {
  type: FlashType;
  text: string;
  list?: string[];
}

export const FLASH_COOKIE = 'zq_flash';

/** The pending flash, for pages that also show it inline (it stays for the browser's toast) */
export async function peekFlash(): Promise<Flash | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Flash; // already decoded by Next
  } catch {
    return null;
  }
}

/**
 * One-time message for the next page, like Laravel's session()->flash().
 * The page's <FlashMessages> reads and removes it in the browser.
 */
export async function setFlash(type: FlashType, text: string, list?: string[]) {
  const value: Flash = { type, text, ...(list ? { list } : {}) };
  // Next URL-encodes cookie values itself; the browser side decodes once
  (await cookies()).set(FLASH_COOKIE, JSON.stringify(value), {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60,
  });
}
