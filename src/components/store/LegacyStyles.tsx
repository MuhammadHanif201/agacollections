// The storefront's original stylesheets, in the original cascade order.
//
// header.blade.php loaded, in this order: theme CSS files and inline <style> blocks,
// then @stack('styles') (each page's pushed CSS), then more header CSS, then CSS
// written inline in the page body, then the footer CSS. React 19 hoists
// <link precedence> into <head> grouped by precedence, in the order the groups are
// first seen; the layout declares every group up front (empty slot styles keep a
// group's place), and pages add their sheets to "zq-page" or "zq-inline".

const css = (name: string) => `/legacy/css/${name}.css`;

export const PAGE_GROUP = 'zq-page';
export const INLINE_GROUP = 'zq-inline';

const BASE = [
  // components/common-assets.blade.php
  '/clientside/common_assets/css/magnific-popup.css',
  '/clientside/common_assets/css/fontawesome-all.min.css',
  '/clientside/common_assets/css/futura-std-font.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  '/clientside/common_assets/fonts/remixicon.css',
  css('components__common-assets.1'),
  // header.blade.php <head>
  '/clientside/zayqora/assets/css/animate.min.css',
  '/clientside/zayqora/assets/css/futura-std-font.css',
  '/clientside/zayqora/assets/css/meanmenu.css',
  '/clientside/zayqora/assets/css/swiper-bundle.min.css',
  '/clientside/zayqora/assets/css/style.css',
  '/clientside/zayqora/assets/css/responsive.css',
  '/clientside/zayqora/css/global.css',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Work+Sans:wght@500&family=Arimo:wght@400;700&display=swap',
  // remixicon.css was linked a second time here; the query keeps that later position in the cascade
  '/clientside/common_assets/fonts/remixicon.css?again',
  css('clientside__zayqora__layout__header.1'), // #theme-style
  css('clientside__zayqora__layout__header.2'), // #product-card-style
];

const CHROME = [
  css('clientside__zayqora__layout__header.3'),
  css('clientside__zayqora__layout__header.4'),
  css('clientside__zayqora__layout__header.5'), // #dc-modern-luxe
  css('clientside__zayqora__layout__header.6'), // #zq-drawer
];

const FOOTER = [
  css('clientside__zayqora__layout__footer.1'),
  css('components__newsletter-form.1'),
];

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

const href = (n: string) => (n.startsWith('/') ? n : css(n));

/**
 * A page's own CSS: `pushed` were @push('styles'), `inline` were <style> in the page
 * body. Names are extracted blocks in /legacy/css; paths starting with "/" are files.
 */
export function PageStyles({ pushed = [], inline = [] }: { pushed?: string[]; inline?: string[] }) {
  return (
    <>
      {pushed.map((n) => <link key={n} rel="stylesheet" href={href(n)} precedence={PAGE_GROUP} />)}
      {inline.map((n) => <link key={n} rel="stylesheet" href={href(n)} precedence={INLINE_GROUP} />)}
    </>
  );
}
