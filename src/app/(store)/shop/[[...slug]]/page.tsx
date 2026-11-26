// clientside/zayqora/shop.blade.php (all products and /shop/{category})
import { notFound, permanentRedirect } from 'next/navigation';
import { env } from '@/lib/env';
import { mediaUrl } from '@/lib/media';
import { plural, strTitle } from '@/lib/format';
import { buildMetadata, JsonLd, type MetaOptions } from '@/lib/seo';
import { PageStyles } from '@/components/store/LegacyStyles';
import Pagination from '@/components/store/Pagination';
import ProductCard from '@/components/store/ProductCard';
import ShopInteractions from '@/components/store/ShopInteractions';
import SortSelect from '@/components/store/SortSelect';
import ZqHero from '@/components/store/ZqHero';
import { shownPrice, toCards } from '@/services/catalog';
import { Product } from '@/models/Product';
import { mediaExists } from '@/services/media';
import { categoryTitle, getCompanySetting, getMenuCategories } from '@/services/settings';
import { shopQuery } from '@/services/shop';
import StoreLink from '@/components/store/StoreLink';
import { SWAPPED_M, swapBanner } from '@/lib/banners';

type Props = { params: Promise<{ slug?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTER_KEYS = ['size', 'color', 'tag', 'sort', 'min_price', 'max_price'];

// Search-focused title, description and intro per category (keyed by slug)
function catSeo(brand: string): Record<string, { title: string; desc: string; intro: string }> {
  return {
    jeans: {
      title: `Baggy Jeans for Men & Women in Pakistan | ${brand}`,
      desc: `Shop unisex baggy, wide leg, cargo and washed jeans at ${brand}: ice blue, black, grey, navy and white. Cash on delivery across Pakistan.`,
      intro: 'Unisex baggy jeans in wide leg, balloon and cargo fits, in washes from light ice blue to washed black.',
    },
    't-shirts': {
      title: `Oversized & Down Shoulder T-Shirts in Pakistan | ${brand}`,
      desc: `Oversized down shoulder tees with jersey numbers, varsity prints and bold graphics. Shop ${brand} T-shirts with cash on delivery across Pakistan.`,
      intro: 'Oversized down shoulder tees with jersey numbers, varsity stripes and bold graphic prints.',
    },
    'button-down-shirts': {
      title: `Oversized Button Down Shirts in Pakistan | ${brand}`,
      desc: 'Relaxed oversized button-down shirts in black, white, coffee brown, hot pink and yellow. Lightweight and breathable. Cash on delivery across Pakistan.',
      intro: 'Relaxed, oversized button-down shirts in clean colours, made from lightweight, breathable fabric.',
    },
    'sports-jerseys': {
      title: `Sports Jerseys in Pakistan | ${brand}`,
      desc: `Barcelona and Real Madrid inspired sports jerseys in a breathable, oversized fit. Order online at ${brand} with cash on delivery across Pakistan.`,
      intro: 'Sports jerseys in breathable, sweat-wicking fabric with an oversized street fit.',
    },
    'zipper-hoodies': {
      title: `Zip Up Hoodies in Pakistan | ${brand}`,
      desc: `Unisex zip-up hoodies: the soft fleece Essential Zip Hoodie in 11 colours, plus printed zips. Order online at ${brand} with cash on delivery across Pakistan.`,
      intro: 'Unisex zip-up hoodies: the soft fleece Essential Zip Hoodie in 11 colours, with an oversized fit, full-length zip and front pockets, plus printed zip hoodies.',
    },
  };
}

const LINES: Record<string, string> = {
  jeans: 'Baggy, wide-leg and washed denim.',
  't-shirts': 'Oversized and graphic tees.',
  'button-down-shirts': 'Relaxed button-downs in clean colours.',
  'sports-jerseys': 'Sports jerseys, styled for the street.',
  'zipper-hoodies': 'Zip hoodies for every day.',
  hoodies: 'Plain, printed and zip hoodies.',
  'plain-hoodies': 'Heavyweight plain hoodies.',
  'printed-hoodies': 'Bold graphic print hoodies.',
};
const POSITIONS: Record<string, string> = { 'button-down-shirts': 'center 35%', 't-shirts': 'center 40%' };
// Questions shoppers (and AI search) ask, answered from the store's own policies (Policies page: COD only,
// TCS/Leopards/BlueEx, 2–4 / 4–6 working days, 7-day exchange, no cash refunds)
function shopFaqs(o: { brand: string; what: string; intro: string | null; from: number | null; count: number; whatsapp: string | null }) {
  const rs = (n: number) => 'Rs. ' + n.toLocaleString('en-PK');
  const wa = o.whatsapp ? ` on WhatsApp (${o.whatsapp})` : ' on WhatsApp';
  const f: { q: string; a: string }[] = [
    {
      q: `Where can I buy ${o.what} online in Pakistan?`,
      a: `${o.brand} sells ${o.what} online at agacollections.com${o.count ? ` (${o.count} ${o.count === 1 ? 'style' : 'styles'})` : ''}${o.from ? `, from ${rs(o.from)}` : ''}, with cash on delivery to every city in Pakistan. ${o.intro ?? ''}`.trim(),
    },
  ];
  if (o.from) f.push({ q: `How much do ${o.brand} ${o.what} cost?`, a: `Prices start at ${rs(o.from)}. All prices are in Pakistani rupees and the delivery charge is shown at checkout.` });
  f.push(
    { q: 'Is cash on delivery available?', a: `Yes. Every order is cash on delivery: you pay the courier in cash when your parcel arrives, anywhere in Pakistan.` },
    { q: 'How long does delivery take?', a: '2–4 working days to Karachi, Lahore and Islamabad, and 4–6 working days to other cities. Orders are shipped with TCS, Leopards Courier or BlueEx.' },
    { q: 'Can I exchange the size or colour?', a: `Yes, within 7 days of delivery, if the item is unused, unwashed and has its tags on. Message us${wa} with your order number and we arrange a pickup. Return shipping is paid by the customer unless the item was defective or wrong. Sale or discounted items cannot be exchanged, and there are no cash refunds (defective or wrong items get a replacement or store credit).` },
    { q: 'How do I choose my size?', a: `Our fits are oversized and unisex. Message us${wa} with your height and usual size and we will help you pick the right one.` },
  );
  return f;
}

// Search titles (Google result and browser tab): what people type, plus the starting price and COD.
// The price is read live from the category's products, so it follows price changes; with no price it is left out.
const SEARCH_TITLES: Record<string, (from: string) => string> = {
  jeans: (f) => `Baggy Jeans in Pakistan${f} | Cash on Delivery`,
  't-shirts': (f) => `Oversized T-Shirts in Pakistan${f} | COD`,
  'button-down-shirts': (f) => `Button Down Shirts in Pakistan${f} | COD`,
  'sports-jerseys': (f) => `Sports Jerseys in Pakistan${f} | Cash on Delivery`,
  'zipper-hoodies': (f) => `Zip Up Hoodies in Pakistan${f} | Cash on Delivery`,
  hoodies: () => 'Hoodies in Pakistan – Plain, Printed & Zip | Cash on Delivery',
  'plain-hoodies': (f) => `Plain Hoodies in Pakistan${f} | Cash on Delivery`,
  'printed-hoodies': (f) => `Printed Hoodies in Pakistan${f} | Cash on Delivery`,
};
/** " – From Rs. 2,999": the lowest price shoppers see on the category's active products ('' when none) */
async function fromPrice(catId: number): Promise<string> {
  const ps = await Product.find({ status: 'active', category_ids: catId }, { price: 1, variants: 1 }).lean();
  const n = ps.map((p) => shownPrice(p)).filter((x) => x > 0);
  return n.length ? ` – From Rs. ${Math.min(...n).toLocaleString('en-PK')}` : '';
}

// Old category URLs that moved (the T-shirts category was /shop/jersey)
const MOVED: Record<string, string> = { jersey: 't-shirts' };

async function load(props: Props) {
  const [{ slug }, query] = await Promise.all([props.params, props.searchParams]);
  const slugStr = slug?.length ? slug.map(decodeURIComponent).join('/') : null;
  const result = await shopQuery(slugStr, query);
  if (!result) {
    if (slugStr && MOVED[slugStr]) {
      const qs = new URLSearchParams(Object.entries(query).flatMap(([k, v]) => (v === undefined ? [] : [v].flat().map((x) => [k, x])))).toString();
      permanentRedirect(`/shop/${MOVED[slugStr]}${qs ? '?' + qs : ''}`);
    }
    notFound();
  }
  const company = await getCompanySetting();
  const brand = company?.name ?? 'AGA Collections';
  const cat = result.selectedCategory;
  const metaTitle = cat ? strTitle(categoryTitle(cat)) : null;
  const seo = cat ? catSeo(brand)[cat.slug ?? ''] ?? null : null;
  const search = typeof query.search === 'string' && query.search !== '' ? query.search : null;
  const titleFn = cat ? SEARCH_TITLES[cat.slug ?? ''] : undefined;
  const searchTitle = cat && titleFn ? titleFn(await fromPrice(cat._id)) : null;
  const meta: MetaOptions = {
    page: cat ? 'category' : 'shop',
    metaTitle,
    seoTitle: cat ? searchTitle ?? seo?.title ?? `${metaTitle} | ${brand} Pakistan` : `Shop Streetwear Online in Pakistan | ${brand}`,
    metaDesc: cat
      ? seo?.desc ?? `Shop ${metaTitle} at ${brand}. Cash on delivery across Pakistan.`
      : `Shop the full ${brand} collection: baggy jeans, oversized tees, button-down shirts, sports jerseys and zip-up hoodies. Cash on delivery across Pakistan.`,
    // An empty category is thin content: keep it out of search results
    robots: cat && result.total === 0 ? 'noindex, follow' : null,
    // Shop All (and a category without a banner) shares the Shop All banner as a 1200x630 card, instead of the logo
    image: cat?.banner ? absolute(mediaUrl(swapBanner(cat.banner)!)) : '/clientside/share/shop-3.jpg',
    hasSearch: typeof query.search === 'string' && query.search !== '',
  };
  return { result, query, company, brand, cat, metaTitle, seo, search, meta, slugStr };
}

const absolute = (u: string) => (/^https?:/.test(u) ? u : env.appUrl + u);

export async function generateMetadata(props: Props) {
  return buildMetadata((await load(props)).meta);
}

export default async function ShopPage(props: Props) {
  const { result, query, company, brand, cat, metaTitle, seo, search, meta, slugStr } = await load(props);
  const { products, total, page, lastPage, mainCategories } = result;
  const cards = await toCards(products);
  const menuCategories = await getMenuCategories();

  const catTitle = cat ? strTitle(categoryTitle(cat)) : 'Shop All';
  const zqSlug = cat?.slug ?? null;
  const banner = swapBanner(cat?.banner ? cat.banner : company?.default_category_banner ?? null);
  const bannerM = banner ? SWAPPED_M[banner] ?? banner.replace(/(\.[a-z0-9]+)$/i, '-m$1') : null;
  const hasM = Boolean(banner && SWAPPED_M[banner]) || (await mediaExists(bannerM));
  const sub = `${total} ${plural('style', total)}` + (zqSlug ? (LINES[zqSlug] ? ' · ' + LINES[zqSlug] : '') : ' across denim, tees, shirts and jerseys.');
  // PHP reads size[]=M as size, so the [] form counts too
  const hasFilters = FILTER_KEYS.some((k) => query[k] !== undefined || query[`${k}[]`] !== undefined);
  const path = slugStr ? `/shop/${slugStr}` : '/shop';
  const guideCats = menuCategories.filter((c) => c.slug !== (cat?.slug ?? null) && c.title !== 'Home Page - New Arrival');
  const prices = products.map((p) => shownPrice(p)).filter((n) => n > 0); // the price on the product cards
  const faqs = shopFaqs({ brand, what: cat ? (metaTitle ?? '').toLowerCase() : 'streetwear', intro: cat ? seo?.intro ?? null : null, from: prices.length ? Math.min(...prices) : null, count: total, whatsapp: company?.whatsapps?.[0] ?? null });

  const hiddenInputs: { name: string; value: string }[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (k === 'sort' || k === 'page' || v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => hiddenInputs.push({ name: `${k.replace(/\[\]$/, '')}[]`, value: x }));
    else hiddenInputs.push({ name: k, value: v });
  }

  const categoryList = (
    <ul className="dc-sf-cats">
      <li>
        <StoreLink href="/shop" className={!cat ? 'is-active' : ''}>
          All Products
          <span className="dc-sf-count">{total}</span>
        </StoreLink>
      </li>
      {mainCategories.filter((c) => c.title.toUpperCase() !== 'HOME PAGE - NEW ARRIVAL').map((c) => (
        <li key={c._id}>
          <StoreLink href={`/shop/${c.slug ?? ''}`} className={c._id === cat?._id ? 'is-active' : ''}>
            {categoryTitle(c)}
            <span className="dc-sf-count">{c.products_count ?? 0}</span>
          </StoreLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__partials__zq-hero.1', 'clientside__zayqora__shop.1']} />
      <JsonLd {...meta} />

      <ZqHero
        image={banner ? mediaUrl(banner) : null}
        imageMobile={hasM ? mediaUrl(bannerM) : null}
        position={(zqSlug && POSITIONS[zqSlug]) || 'center'}
        crumbs={cat
          ? [{ label: 'Home', url: '/' }, { label: 'Shop', url: '/shop' }, { label: catTitle }]
          : [{ label: 'Home', url: '/' }, { label: 'Shop' }]}
        eyebrow={cat ? 'AGA Collections' :'The Full Collection'}
        title={catTitle}
        subtitle={sub}
      />

      <div className="dc-shop">
        <div className="dc-shop-wrap">
          <aside className="dc-shop-sidebar">
            <div className="dc-sf-head">
              <span className="dc-sf-head-label">Filter</span>
              {hasFilters && (
                <StoreLink href="/shop" className="dc-sf-clear">
                  <i className="ri-close-line"></i> Clear all
                </StoreLink>
              )}
            </div>
            <div className="dc-sf-section">
              <div className="dc-sf-title">Categories</div>
              {categoryList}
            </div>
          </aside>

          <div className="dc-shop-main">
            <div className="dc-shop-toolbar">
              <div className="dc-shop-count">
                {cat && (
                  <>
                    <strong>{categoryTitle(cat)}</strong>{' '}
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>—</span>{' '}
                  </>
                )}
                <strong>{total}</strong>
                {' '}{total === 1 ? 'Product' : 'Products'}
              </div>

              <div className="dc-shop-controls">
                {hasFilters && (
                  <StoreLink href={path} className="dc-clear-btn">
                    <i className="ri-close-line"></i> Clear
                  </StoreLink>
                )}

                <form method="GET" action={path} className="dc-sort-wrap" id="dcSortForm">
                  <SortSelect value={typeof query.sort === 'string' ? query.sort : ''} />
                  {/* Keep the filters, but start again from page 1 when the sort changes */}
                  {hiddenInputs.map((h, i) => <input key={i} type="hidden" name={h.name} value={h.value} />)}
                </form>

                <div className="dc-grid-btns d-none d-md-flex">
                  <button className="dc-grid-btn is-active" data-cols="3" title="3 columns" aria-label="3 column grid">
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                      {[0, 4.4, 8.8].flatMap((y) => [0, 4.4, 8.8].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="3.2" height="3.2" fill="currentColor" />))}
                    </svg>
                  </button>
                  <button className="dc-grid-btn" data-cols="4" title="4 columns" aria-label="4 column grid">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      {[0, 4.4, 8.8].flatMap((y) => [0, 3.5, 7, 10.5].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="2.5" height="3.2" fill="currentColor" />))}
                    </svg>
                  </button>
                  <button className="dc-grid-btn" data-cols="2" title="2 columns" aria-label="2 column grid">
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                      {[0, 6.8].flatMap((y) => [0, 6.8].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="5.2" height="5.2" fill="currentColor" />))}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="dc-product-grid" id="dcProductGrid">
              {cards.length ? cards.map((p) => (
                <div className="dc-product-grid-item" key={p.id}>
                  <ProductCard product={p} />
                </div>
              )) : (
                <div className="dc-shop-empty">
                  <div className="dc-shop-empty-icon">
                    <i className="ri-shopping-bag-line"></i>
                  </div>
                  <p className="dc-shop-empty-msg">
                    {search ? <>No products found for &ldquo;{search}&rdquo;</> : 'No products found in this category yet.'}
                  </p>
                  <StoreLink href="/shop" className="dc-clear-btn">
                    View All Products
                  </StoreLink>
                </div>
              )}
            </div>

            <div className="dc-pagination">
              <Pagination path={path} query={query} current={page} last={lastPage} />
            </div>

            {page === 1 && !search && total > 0 && (
              <section className="dc-guide" aria-labelledby="dc-shop-guide-title">
                {/* editorial block: story + promises + more categories on the left, the questions on the right */}
                <style>{`
                  .dc-guide { margin: 64px 0 0; padding: 56px; background: #f7f4ef; border-radius: 4px; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 64px; text-align: left; }
                  .dc-guide-eyebrow { display: inline-flex; align-items: center; gap: 10px; font-family: var(--body-font); font-size: .66rem; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; color: #a3563f; margin: 0 0 18px; }
                  .dc-guide-eyebrow::before { content: ''; width: 28px; height: 1px; background: currentColor; }
                  .dc-guide h2 { font-family: var(--heading-font) !important; font-style: normal !important; font-weight: 400 !important; font-size: clamp(1.6rem, 2.4vw, 2.15rem) !important; line-height: 1.15 !important; letter-spacing: -.01em; color: #161426 !important; margin: 0 0 18px !important; text-transform: none !important; }
                  .dc-guide-lead { font-size: .92rem; line-height: 1.85; color: #55536a; margin: 0 0 30px; }
                  .dc-guide-perks { list-style: none; margin: 0 0 34px; padding: 22px 0 0; border-top: 1px solid #e4ddd3; display: grid; gap: 18px; }
                  .dc-guide-perks li { display: flex; align-items: flex-start; gap: 14px; }
                  .dc-guide-perks i { flex: 0 0 38px; width: 38px; height: 38px; border-radius: 50%; border: 1px solid #e0d6ca; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; color: #a3563f; }
                  .dc-guide-perks strong { display: block; font-size: .84rem; font-weight: 600; color: #161426; line-height: 1.4; }
                  .dc-guide-perks span { display: block; font-size: .78rem; color: #77758a; line-height: 1.5; margin-top: 2px; }
                  .dc-guide-label { font-size: .66rem; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: #77758a; margin: 0 0 12px; }
                  .dc-guide-cats { display: flex; flex-wrap: wrap; gap: 8px; }
                  .dc-guide-cats a { display: inline-block; padding: 8px 16px; border: 1px solid #d9d0c4; border-radius: 999px; background: #fff; font-size: .74rem; font-weight: 500; letter-spacing: .04em; color: #161426; text-decoration: none; transition: background-color .3s, color .3s, border-color .3s; }
                  .dc-guide-cats a:hover { background: #161426; border-color: #161426; color: #fff; }
                  .dc-guide-faq h2 { font-size: clamp(1.35rem, 2vw, 1.7rem) !important; margin-bottom: 8px !important; }
                  .dc-faq-acc { border-bottom: 1px solid #e4ddd3; }
                  .dc-faq-acc summary { list-style: none; display: grid; grid-template-columns: 34px 1fr 20px; align-items: baseline; gap: 10px; padding: 22px 0; cursor: pointer; font-size: .95rem; font-weight: 500; line-height: 1.5; color: #161426; transition: color .3s; }
                  .dc-faq-acc summary::-webkit-details-marker { display: none; }
                  .dc-faq-acc summary:hover, .dc-faq-acc[open] summary { color: #a3563f; }
                  .dc-faq-acc summary:focus-visible { outline: 2px solid #c97864; outline-offset: 4px; }
                  .dc-faq-num { font-family: var(--heading-font); font-size: .8rem; font-style: italic; color: #a3563f; }
                  .dc-faq-acc summary::after { content: ''; justify-self: end; width: 12px; height: 12px; align-self: center;
                    background: linear-gradient(currentColor, currentColor) center / 12px 1px no-repeat, linear-gradient(currentColor, currentColor) center / 1px 12px no-repeat;
                    transition: transform .45s cubic-bezier(.4,0,.2,1); }
                  .dc-faq-acc[open] summary::after { transform: rotate(45deg); }
                  .dc-faq-acc p { margin: 0; padding: 0 30px 24px 44px; font-size: .88rem; line-height: 1.85; color: #55536a; }
                  @media (max-width: 991px) {
                    .dc-guide { grid-template-columns: 1fr; gap: 44px; padding: 40px 28px; }
                  }
                  @media (max-width: 575px) {
                    .dc-guide { margin-top: 44px; padding: 34px 20px; border-radius: 0; }
                    .dc-faq-acc summary { grid-template-columns: 28px 1fr 16px; font-size: .9rem; padding: 18px 0; }
                    .dc-faq-acc p { padding: 0 8px 20px 38px; }
                  }
                `}</style>
                <div className="dc-guide-intro">
                  <p className="dc-guide-eyebrow">{brand}</p>
                  <h2 id="dc-shop-guide-title">
                    {cat ? 'About our ' + (metaTitle ?? '').toLowerCase() : 'Streetwear from Karachi, delivered across Pakistan'}
                  </h2>
                  <p className="dc-guide-lead">
                    {cat && seo?.intro
                      ? seo.intro
                      : `${brand} makes everyday streetwear: unisex baggy jeans, oversized down shoulder tees, relaxed button-down shirts, sports jerseys and zip-up hoodies.`}
                  </p>
                  <ul className="dc-guide-perks">
                    <li><i className="ri-hand-coin-line" aria-hidden="true"></i><div><strong>Cash on delivery</strong><span>Every order, pay when it reaches you</span></div></li>
                    <li><i className="ri-truck-line" aria-hidden="true"></i><div><strong>2–4 working days</strong><span>To Karachi, Lahore and Islamabad</span></div></li>
                    <li><i className="ri-box-3-line" aria-hidden="true"></i><div><strong>Shipped with TCS, Leopards or BlueEx</strong><span>Delivered across Pakistan</span></div></li>
                  </ul>
                  {guideCats.length > 0 && (
                    <nav aria-label="More categories">
                      <p className="dc-guide-label">Keep exploring</p>
                      <div className="dc-guide-cats">
                        {guideCats.map((gc) => (
                          <StoreLink key={gc._id} href={`/shop/${gc.slug ?? ''}`}>{strTitle(gc.title)}</StoreLink>
                        ))}
                      </div>
                    </nav>
                  )}
                </div>
                {faqs.length > 0 && (
                  <div className="dc-guide-faq">
                    <p className="dc-guide-eyebrow">Good to know</p>
                    <h2>Frequently asked questions</h2>
                    {faqs.map((f, i) => (
                      <details className="dc-faq-acc" key={f.q}>
                        <summary><span className="dc-faq-num">{String(i + 1).padStart(2, '0')}</span><span>{f.q}</span></summary>
                        <p>{f.a}</p>
                      </details>
                    ))}
                    {/* the same questions for Google and AI search */}
                    <script
                      type="application/ld+json"
                      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }).replace(/</g, '\\u003c') }}
                    />
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <button className="dc-filter-fab" id="dcFilterFab" aria-label="Open filters">
        <i className="ri-equalizer-3-line" style={{ fontSize: '1rem' }}></i>
        <span>Filters</span>
        {cat && <span className="dc-filter-fab-dot"></span>}
      </button>

      <div className="dc-drawer-overlay" id="dcShopDrawerOverlay" aria-hidden="true"></div>

      <aside className="dc-shop-drawer" id="dcShopDrawer" aria-label="Filter sidebar">
        <div className="dc-drawer-head">
          <span className="dc-drawer-head-label">Filter</span>
          <button className="dc-drawer-close" id="dcShopDrawerClose" aria-label="Close filters">
            <i className="ri-close-line"></i>
          </button>
        </div>
        <div className="dc-drawer-body">
          <div className="dc-sf-section">
            <div className="dc-sf-title">Categories</div>
            {categoryList}
          </div>
          {hasFilters && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--dc-border)' }}>
              <StoreLink href="/shop" className="dc-clear-btn" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="ri-close-line"></i> Clear All Filters
              </StoreLink>
            </div>
          )}
        </div>
      </aside>

      <ShopInteractions search={search} />
    </>
  );
}
