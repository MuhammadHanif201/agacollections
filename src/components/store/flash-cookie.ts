// Client side of lib/flash.ts: one-time messages set by the server for the next page.
export interface FlashValue {
  type: 'success' | 'error' | 'errors' | 'newsletter_success' | 'newsletter_error';
  text: string;
  list?: string[];
}

export function readFlash(): FlashValue | null {
  const m = document.cookie.match(/(?:^|;\s*)zq_flash=([^;]*)/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as FlashValue;
  } catch {
    return null;
  }
}

export function clearFlash() {
  document.cookie = 'zq_flash=; Max-Age=0; path=/; SameSite=Lax';
}
