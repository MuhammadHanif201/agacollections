'use client';

import { useLayoutEffect } from 'react';

/**
 * Each storefront page brought its own stylesheets, and the document was thrown away when
 * the visitor left. With client-side navigation React keeps every stylesheet it has
 * hoisted into <head>, so the rules of pages already visited would pile up and change
 * later pages. This keeps a page's own sheets applied only while that page is on screen.
 * (On the first load they are all applied already, so nothing changes there.)
 */
export default function StyleScope({ hrefs }: { hrefs: string[] }) {
  const key = hrefs.join('|');
  useLayoutEffect(() => {
    const want = new Set(key.split('|'));
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][data-precedence]'))
      .filter((l) => want.has(l.getAttribute('href') ?? ''));
    links.forEach((l) => { l.disabled = false; });
    return () => links.forEach((l) => { l.disabled = true; });
  }, [key]);
  return null;
}
