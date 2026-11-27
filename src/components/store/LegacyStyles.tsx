// The storefront's original stylesheets, in the original cascade order.
//
// header.blade.php loaded, in this order: theme CSS files and inline <style> blocks,
// then @stack('styles') (each page's pushed CSS), then more header CSS, then CSS
// written inline in the page body, then the footer CSS. React 19 hoists
// <link precedence> into <head> grouped by precedence, in the order the groups are
// first seen; the layout declares every group up front (empty slot styles keep a
// group's place), and pages add their sheets to "zq-page" or "zq-inline".

import StyleScope from './StyleScope';
import GROUPS from './css-groups.json';
import BUNDLES from './css-bundles.json';

const css = (name: string) => `/legacy/css/${name}.css`;

export const PAGE_GROUP = 'zq-page';
export const INLINE_GROUP = 'zq-inline';

// The layout's stylesheets, in their original cascade order, are listed in css-groups.json:
//   base:   components/common-assets.blade.php (magnific popup, Futura, Bootstrap 5.3.0 served from this site,
//           common-assets.1) then header.blade.php <head> (animate, Futura, meanmenu, swiper, theme style.css,
//           responsive, global.css), remixicon-store.css (only the 86 icons the store uses), header.1 (#theme-style)
//           and header.2 (#product-card-style). Font Awesome was dropped: the store's icons are Remix Icon.
//   chrome: header.3 to header.6 (#dc-modern-luxe, #zq-drawer)
//   footer: footer.1, the newsletter form and rounded.css (8px corners, last so it wins over global.css)
// scripts/build-css.mjs joins each group into one minified, hashed file (css-bundles.json), so a page asks for
// 3 layout stylesheets instead of 21; it runs before `next build` and `next dev`.
// The Google Fonts sheet (Fraunces for headings, Arimo for text) only declares @font-face, so it can go first.
const BASE = [GROUPS.fonts, BUNDLES.base];
const CHROME = [BUNDLES.chrome];
const FOOTER = [BUNDLES.footer];

export function LayoutStyles({ productCardRatio }: { productCardRatio?: string }) {
  return (
    <>
      {BASE.map((href) => <link key={href} rel="stylesheet" href={href} precedence="zq-base" />)}
      {productCardRatio ? (
        <style href="zq-ratio" precedence="zq-base">{`:root{--product-card-image-ratio:${productCardRatio}}`}</style>
      ) : null}
      <style href="zq-slot-page" precedence={PAGE_GROUP}>{'/* page styles */'}</style>
      {CHROME.map((href) => <link key={href} rel="stylesheet" href={href} precedence="zq-chrome" />)}
      <style href="zq-slot-inline" precedence={INLINE_GROUP}>{'/* page inline styles */'}</style>
      {FOOTER.map((href) => <link key={href} rel="stylesheet" href={href} precedence="zq-footer" />)}
    </>
  );
}

const href = (n: string) => (/^(\/|https:)/.test(n) ? n : css(n));

/**
 * A page's own CSS: `pushed` were @push('styles'), `inline` were <style> in the page
 * body. Names are extracted blocks in /legacy/css; paths starting with "/" are files.
 */
export function PageStyles({ pushed = [], inline = [] }: { pushed?: string[]; inline?: string[] }) {
  return (
    <>
      {pushed.map((n) => <link key={n} rel="stylesheet" href={href(n)} precedence={PAGE_GROUP} />)}
      {inline.map((n) => <link key={n} rel="stylesheet" href={href(n)} precedence={INLINE_GROUP} />)}
      <StyleScope hrefs={[...pushed, ...inline].map(href)} />
    </>
  );
}
