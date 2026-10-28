import 'server-only';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { env } from './env';
import { mediaUrl } from './media';
import { getCompanySetting } from '@/services/settings';

// components/meta.blade.php: titles, descriptions, robots, Open Graph, Twitter and
// structured data for each page type.

export type MetaPage =
  | 'default' | 'home' | 'shop' | 'category' | 'product' | 'about' | 'contact' | 'policies'
  | 'cart' | 'checkout' | 'wishlist' | 'login' | 'otp' | 'thankyou' | 'dashboard';

export interface MetaProduct {
  price?: string | number;
  currency?: string;
  in_stock?: boolean;
  reviews_count?: number;
  avg_rating?: number;
  sku?: string | null;
  images?: string[];
  image?: string;
  category?: string | null;
  category_url?: string | null;
}

export interface MetaOptions {
  page?: MetaPage;
  metaTitle?: string | null;
  metaDesc?: string | null;
  image?: string | null;
  type?: string;
  metaProduct?: MetaProduct | null;
  seoTitle?: string | null;
  robots?: string | null;
  /** the request has ?search= (internal search results are not indexed) */
  hasSearch?: boolean;
}

const RANGE = 'baggy jeans, oversized tees, button-down shirts, football jerseys and zip-up hoodies';

async function currentUrl(): Promise<string> {
  const h = await headers();
  const path = h.get('x-zq-path') ?? '/';
  return env.appUrl + (path === '/' ? '/' : path.replace(/\/+$/, ''));
}

async function base(opts: MetaOptions) {
  const s = await getCompanySetting();
  const brand = s?.name ?? process.env.APP_NAME ?? 'AGA Collections';
  const page = opts.page ?? 'default';
  const t = opts.metaTitle ?? null;
  const productTitle = t ? ([...t].length <= 28 ? `${t} – Buy Online in Pakistan | ${brand}` : `${t} | ${brand} Pakistan`) : `Product | ${brand}`;
  const maps: Record<MetaPage, { title: string; desc: string; robots: string }> = {
    default: { title: `${brand} | Streetwear Clothing in Pakistan`, desc: `Shop ${RANGE} at ${brand}. Cash on delivery across Pakistan.`, robots: 'index, follow' },
    home: { title: `${brand} | Baggy Jeans, Oversized Tees & Streetwear in Pakistan`, desc: `Shop ${RANGE} at ${brand}, a streetwear label from Lahore. Cash on delivery across Pakistan.`, robots: 'index, follow' },
    shop: { title: `Shop All Streetwear | ${brand} Pakistan`, desc: `Browse the full ${brand} collection: ${RANGE}. Cash on delivery across Pakistan.`, robots: 'index, follow' },
    category: { title: `${t ?? 'Collection'} | ${brand} Pakistan`, desc: `Shop ${t ?? 'our collection'} at ${brand}. Cash on delivery across Pakistan.`, robots: 'index, follow' },
    product: { title: productTitle, desc: `Buy ${t ?? 'this item'} online at ${brand}. Cash on delivery across Pakistan.`, robots: 'index, follow' },
    about: { title: `About ${brand} | Our Story`, desc: `The story behind ${brand}, a Lahore streetwear label making ${RANGE}.`, robots: 'index, follow' },
    contact: { title: `Contact ${brand} | Order Help on WhatsApp & Email`, desc: `Questions about sizing or an order? Contact ${brand} on WhatsApp, by email or through our contact form.`, robots: 'index, follow' },
    policies: { title: `Policies | ${brand} — Shipping, Returns, Privacy & Terms`, desc: `Read ${brand}'s shipping, return and exchange, payment, privacy and terms policies.`, robots: 'index, follow' },
    cart: { title: `Your Bag | ${brand}`, desc: 'Review the items in your bag before checkout.', robots: 'noindex, nofollow' },
    checkout: { title: `Checkout | ${brand}`, desc: `Complete your ${brand} order. Cash on delivery across Pakistan.`, robots: 'noindex, nofollow' },
    wishlist: { title: `My Wishlist | ${brand}`, desc: `Your saved ${brand} items.`, robots: 'noindex, nofollow' },
    login: { title: `Login | ${brand}`, desc: `Sign in to your ${brand} account to track orders and check out faster.`, robots: 'noindex, nofollow' },
    otp: { title: `Verify Code | ${brand}`, desc: `Enter your one-time code to verify your ${brand} account.`, robots: 'noindex, nofollow' },
    thankyou: { title: `Order Confirmed | ${brand}`, desc: `Thank you for your order at ${brand}.`, robots: 'noindex, nofollow' },
    dashboard: { title: `My Account | ${brand}`, desc: `Manage your ${brand} orders, wishlist and profile.`, robots: 'noindex, nofollow' },
  };
  const p = maps[page] ?? maps.default;
  const title = opts.seoTitle || p.title;
  const description = (opts.metaDesc ?? p.desc).replace(/\s+/g, ' ').trim();
  let robots = opts.robots || p.robots;
  if (opts.hasSearch) robots = 'noindex, follow';

  const defaultImg = s?.logo
    ? absolute(mediaUrl(s.logo))
    : s?.favicon ? absolute(mediaUrl(s.favicon)) : `${env.appUrl}/clientside/company_logo/default-logo.png`;
  // The 1200x630 share card (storage/logos/zayqora-share.jpg) when it was uploaded, else the logo
  let image = opts.image ?? (process.env.SHARE_IMAGE_PATH ? absolute(mediaUrl(process.env.SHARE_IMAGE_PATH)) : defaultImg);
  if (image && !/^https?:\/\//i.test(image)) image = env.appUrl + (image.startsWith('/') ? image : '/' + image);
  const ogType = opts.type && opts.type !== 'website' ? opts.type : page === 'product' ? 'product' : 'website';
  const url = await currentUrl();

  const sameAs = (s?.social_links ?? [])
    .map((x) => x?.url)
    .filter((u): u is string => typeof u === 'string' && /^https?:\/\/[^/]+\/[^/\s]+/i.test(u));
  return { s, brand, page, title, description, robots, image, ogType, url, sameAs, defaultImg };
}

export async function buildMetadata(opts: MetaOptions): Promise<Metadata> {
  const b = await base(opts);
  const twUrl = b.sameAs.find((u) => /(twitter|x)\.com\//i.test(u));
  const twHandle = twUrl?.match(/(?:twitter|x)\.com\/([^/?]+)/i)?.[1];
  const fav = b.s?.favicon ? absolute(mediaUrl(b.s.favicon)) : '/clientside/company_logo/favicon.png';
  return {
    metadataBase: new URL(env.appUrl),
    title: b.title,
    description: b.description,
    robots: b.robots,
    authors: [{ name: b.brand }],
    alternates: { canonical: b.url },
    openGraph: {
      // Next accepts no "product" type; product pages add og:type themselves (<JsonLd>)
      ...(b.ogType === 'product' ? {} : { type: b.ogType as 'website' }),
      url: b.url,
      title: b.title,
      description: b.description,
      images: b.image ? [{ url: b.image, alt: opts.metaTitle ?? b.brand }] : undefined,
      siteName: b.brand,
      locale: 'en_PK',
    },
    twitter: {
      card: 'summary_large_image',
      title: b.title,
      description: b.description,
      images: b.image ? [b.image] : undefined,
      site: twHandle ? '@' + twHandle : undefined,
    },
    icons: {
      icon: [{ url: fav, type: 'image/png' }],
      apple: b.s?.favicon ? [{ url: fav }] : undefined,
    },
    manifest: '/site.webmanifest',
  };
}

function absolute(u: string) {
  return /^https?:/.test(u) ? u : env.appUrl + u;
}

/** The <script type="application/ld+json"> blocks from meta.blade.php */
export async function JsonLd(opts: MetaOptions) {
  const b = await base(opts);
  const s = b.s;
  const baseUrl = env.appUrl;
  const addr = s?.address ?? '';
  const phone = s?.phones?.[0] ?? '';
  const waNum = s?.whatsapps?.[0] ?? null;
  const city = addr.toLowerCase().includes('lahore') ? 'Lahore' : 'Pakistan';
  const defaultImg = b.defaultImg;
  const blocks: Record<string, unknown>[] = [];

  const org: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'ClothingStore'],
    '@id': baseUrl + '/#store',
    name: b.brand,
    url: baseUrl,
    logo: { '@type': 'ImageObject', url: defaultImg },
    image: defaultImg,
    description: s?.description || `Streetwear from ${b.brand}: ${RANGE}.`,
    areaServed: 'PK',
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash on Delivery',
  };
  if (addr) org.address = { '@type': 'PostalAddress', streetAddress: addr, addressLocality: city, addressCountry: 'PK' };
  if (phone) {
    org.telephone = phone;
    org.contactPoint = { '@type': 'ContactPoint', telephone: phone, contactType: 'customer service', areaServed: 'PK', availableLanguage: ['English', 'Urdu'] };
  }
  if (b.sameAs.length) org.sameAs = b.sameAs;
  blocks.push(org);

  if (b.page === 'home') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: b.brand,
      url: baseUrl,
      inLanguage: 'en-PK',
      publisher: { '@id': baseUrl + '/#store' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: baseUrl + '/shop?search={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    });
  }

  if (['shop', 'category', 'product'].includes(b.page)) {
    const items: Record<string, unknown>[] = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: baseUrl + '/shop' },
    ];
    if (b.page === 'category' && opts.metaTitle) items.push({ '@type': 'ListItem', position: 3, name: opts.metaTitle, item: b.url });
    if (b.page === 'product') {
      let pos = 3;
      const mp = opts.metaProduct;
      if (mp?.category && mp.category_url) items.push({ '@type': 'ListItem', position: pos++, name: mp.category, item: mp.category_url });
      items.push({ '@type': 'ListItem', position: pos, name: opts.metaTitle ?? 'Product', item: b.url });
    }
    blocks.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items });
  }

  if (b.page === 'product' && opts.metaProduct) {
    const mp = opts.metaProduct;
    const shipFee = Number((s?.shipping_charges as Record<string, number> | undefined)?.rest_of_pakistan ?? 0);
    const nextYear = new Date();
    nextYear.setUTCFullYear(nextYear.getUTCFullYear() + 1);
    const product: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: opts.metaTitle ?? '',
      description: b.description,
      url: b.url,
      brand: { '@type': 'Brand', name: b.brand },
      offers: {
        '@type': 'Offer',
        url: b.url,
        priceCurrency: mp.currency ?? 'PKR',
        price: mp.price ?? '0',
        priceValidUntil: nextYear.toISOString().slice(0, 10),
        itemCondition: 'https://schema.org/NewCondition',
        availability: 'https://schema.org/' + ((mp.in_stock ?? true) ? 'InStock' : 'OutOfStock'),
        seller: { '@id': baseUrl + '/#store' },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
          shippingRate: { '@type': 'MonetaryAmount', value: shipFee.toFixed(2), currency: 'PKR' },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'DAY' },
            transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 8, unitCode: 'DAY' },
          },
        },
      },
    };
    if (mp.images?.length) product.image = mp.images;
    else if (mp.image) product.image = mp.image;
    if (mp.sku) product.sku = mp.sku;
    if (mp.category) product.category = mp.category;
    if (mp.reviews_count && mp.reviews_count > 0) {
      product.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: (mp.avg_rating ?? 0).toFixed(1),
        reviewCount: String(mp.reviews_count),
        bestRating: '5',
        worstRating: '1',
      };
    }
    blocks.push(product);
  }

  if (b.page === 'contact') {
    const local: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'ClothingStore'],
      name: b.brand,
      url: baseUrl,
      image: defaultImg,
      logo: defaultImg,
    };
    if (addr) local.address = { '@type': 'PostalAddress', streetAddress: addr, addressLocality: city, addressCountry: 'PK' };
    if (phone) local.telephone = phone;
    if (waNum) local.contactPoint = { '@type': 'ContactPoint', telephone: waNum, contactType: 'customer service', availableLanguage: ['English', 'Urdu'] };
    if (b.sameAs.length) local.sameAs = b.sameAs;
    blocks.push(local);
  }

  const mp = b.page === 'product' ? opts.metaProduct : null;
  return (
    <>
      {/* Open Graph product tags (property=, as before); React places them in <head> */}
      {mp && (
        <>
          <meta property="og:type" content="product" />
          <meta property="product:price:amount" content={String(mp.price ?? '')} />
          <meta property="product:price:currency" content={mp.currency ?? 'PKR'} />
          <meta property="product:availability" content={(mp.in_stock ?? true) ? 'in stock' : 'out of stock'} />
        </>
      )}
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }} />
      ))}
    </>
  );
}
