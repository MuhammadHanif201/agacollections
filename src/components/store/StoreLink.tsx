'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes, MouseEvent } from 'react';

// Storefront URLs that are real pages. Everything else (route handlers such as /logout,
// /policy/{key}, /storage/..., downloads, other sites, tel:, #anchors) must stay a plain
// link: client navigation only works for pages, and prefetching a route handler would run it.
const PAGE_ROUTES = [
  /^\/$/,
  /^\/shop(\/[^/]+)*$/,
  /^\/product\/[^/]+$/,
  /^\/(cart|checkout|wishlist|about-us|contact-us|policies|affiliate)$/,
  /^\/affiliate\/(apply|dashboard)$/,
  /^\/customer\/(dashboard|forgot-password|login|orders|profile\/edit)$/,
  /^\/customer\/orders\/[^/]+$/,
];

function isPage(href: string): boolean {
  if (!href.startsWith('/') || href.startsWith('//')) return false;
  return PAGE_ROUTES.some((re) => re.test(href.split(/[?#]/)[0]));
}

/** A plain click on a link to the page that is already open */
function isCurrentPage(e: MouseEvent, href: string): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const to = new URL(href, window.location.href);
  return to.pathname === window.location.pathname && to.search === window.location.search;
}

/**
 * Drop-in replacement for <a> in the storefront: pages are opened with client-side
 * navigation (no full reload, header and footer stay mounted), anything else renders the
 * exact same <a> as before. prefetch is off so a page does not fire a request per link
 * on load; the route is still fetched when the visitor hovers or taps a link.
 */
export default function StoreLink({ href, onClick, ...rest }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href?: string }) {
  if (href && isPage(href) && !rest.target && !('download' in rest)) {
    return (
      <Link
        href={href}
        prefetch={false}
        onClick={(e) => {
          onClick?.(e);
          // The page is on screen already and its scripts are bound to it: a reload used to
          // bring the visitor back to the top, so do that instead of rendering it again
          if (!e.defaultPrevented && isCurrentPage(e, href)) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        {...rest}
      />
    );
  }
  return <a href={href} onClick={onClick} {...rest} />;
}
