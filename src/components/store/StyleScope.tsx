'use client';

import { useLayoutEffect } from 'react';

/**
 * Each storefront page brought its own stylesheets, and the document was thrown away when
 * the visitor left. With client-side navigation React keeps every stylesheet it has
 * hoisted into <head>, so the rules of pages already visited would pile up and change
 * later pages. This keeps a page's own sheets applied only while that page is on screen.
 * (On the first load they are all applied already, so nothing changes there.)
 *
 * Sheets are switched off with media="not all", not `disabled`: re-enabling a disabled
 * <link> makes the browser load it again, and the page showed unstyled meanwhile. A sheet
 * the next page also uses (same page, new ?sort=) is left on.
 */
const uses = new Map<string, number>();

function linksFor(hrefs: Set<string>) {
  return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][data-precedence]'))
    .filter((l) => hrefs.has(l.getAttribute('href') ?? ''));
}

export default function StyleScope({ hrefs }: { hrefs: string[] }) {
  const key = hrefs.join('|');
  useLayoutEffect(() => {
    const want = new Set(key.split('|'));
    want.forEach((h) => uses.set(h, (uses.get(h) ?? 0) + 1));
    linksFor(want).forEach((l) => {
      l.disabled = false;
      if (l.media === 'not all') l.removeAttribute('media');
    });
    return () => {
      want.forEach((h) => uses.set(h, (uses.get(h) ?? 1) - 1));
      // After the next page's own effects in this commit: switch off what no page uses now
      queueMicrotask(() => {
        linksFor(want).forEach((l) => {
          if ((uses.get(l.getAttribute('href') ?? '') ?? 0) <= 0) l.media = 'not all';
        });
      });
    };
  }, [key]);
  return null;
}
