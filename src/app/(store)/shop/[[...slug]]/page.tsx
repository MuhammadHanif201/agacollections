// clientside/zayqora/shop.blade.php (all products and /shop/{category})
import { notFound, permanentRedirect } from 'next/navigation';
import { Fragment } from 'react';
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
import { toCards } from '@/services/catalog';
import { mediaExists } from '@/services/media';
import { getCompanySetting, getMenuCategories } from '@/services/settings';
import { shopQuery } from '@/services/shop';

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
      title: `Football Jerseys in Pakistan | ${brand}`,
      desc: `Barcelona and Real Madrid inspired football jerseys in a breathable, oversized fit. Order online at ${brand} with cash on delivery across Pakistan.`,
      intro: 'Football jerseys in breathable, sweat-wicking fabric with an oversized street fit.',
    },
    'zipper-hoodies': {
      title: `Zip Up Hoodies in Pakistan | ${brand}`,
      desc: `Plain unisex zip-up hoodies in six colours, with custom prints on request. Order online at ${brand} with cash on delivery across Pakistan.`,
      intro: 'Plain unisex zip-up hoodies in six colours. Custom prints available on request.',
    },
  };
}

const LINES: Record<string, string> = {
  jeans: 'Baggy, wide-leg and washed denim.',
  't-shirts': 'Oversized and graphic tees.',
  'button-down-shirts': 'Relaxed button-downs in clean colours.',
  'sports-jerseys': 'Football jerseys, styled for the street.',
  'zipper-hoodies': 'Zip hoodies for every day.',
};
const POSITIONS: Record<string, string> = { 'button-down-shirts': 'center 35%', 'zipper-hoodies': 'center 30%', 't-shirts': 'center 40%' };
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
  const metaTitle = cat ? strTitle(cat.title) : null;
  const seo = cat ? catSeo(brand)[cat.slug ?? ''] ?? null : null;
  const search = typeof query.search === 'string' && query.search !== '' ? query.search : null;
  const meta: MetaOptions = {
    page: cat ? 'category' : 'shop',
    metaTitle,
    seoTitle: cat ? seo?.title ?? `${metaTitle} | ${brand} Pakistan` : `Shop Streetwear Online in Pakistan | ${brand}`,
    metaDesc: cat
      ? seo?.desc ?? `Shop ${metaTitle} at ${brand}. Cash on delivery across Pakistan.`
      : `Shop the full ${brand} collection: baggy jeans, oversized tees, button-down shirts, football jerseys and zip-up hoodies. Cash on delivery across Pakistan.`,
    // An empty category is thin content: keep it out of search results
    robots: cat && result.total === 0 ? 'noindex, follow' : null,
    image: cat?.banner ? absolute(mediaUrl(cat.banner)) : null,
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

  const catTitle = cat ? strTitle(cat.title) : 'Shop All';
  const zqSlug = cat?.slug ?? null;
  const banner = cat?.banner ? cat.banner : company?.default_category_banner ?? null;
  const bannerM = banner ? banner.replace(/(\.[a-z0-9]+)$/i, '-m$1') : null;
  const hasM = await mediaExists(bannerM);
  const sub = `${total} ${plural('style', total)}` + (zqSlug ? (LINES[zqSlug] ? ' · ' + LINES[zqSlug] : '') : ' across denim, tees, shirts and jerseys.');
  // PHP reads size[]=M as size, so the [] form counts too
  const hasFilters = FILTER_KEYS.some((k) => query[k] !== undefined || query[`${k}[]`] !== undefined);
  const path = slugStr ? `/shop/${slugStr}` : '/shop';
  const guideCats = menuCategories.filter((c) => c.slug !== (cat?.slug ?? null) && c.title !== 'Home Page - New Arrival');

  const hiddenInputs: { name: string; value: string }[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (k === 'sort' || k === 'page' || v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => hiddenInputs.push({ name: `${k.replace(/\[\]$/, '')}[]`, value: x }));
    else hiddenInputs.push({ name: k, value: v });
  }

  const categoryList = (
    <ul className="dc-sf-cats">
      <li>
        <a href="/shop" className={!cat ? 'is-active' : ''}>
          All Products
          <span className="dc-sf-count">{total}</span>
        </a>
      </li>
      {mainCategories.filter((c) => c.title.toUpperCase() !== 'HOME PAGE - NEW ARRIVAL').map((c) => (
        <li key={c._id}>
          <a href={`/shop/${c.slug ?? ''}`} className={c._id === cat?._id ? 'is-active' : ''}>
            {c.title}
            <span className="dc-sf-count">{c.products_count ?? 0}</span>
          </a>
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
                <a href="/shop" className="dc-sf-clear">
                  <i className="ri-close-line"></i> Clear all
                </a>
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
                    <strong>{cat.title}</strong>{' '}
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>—</span>{' '}
                  </>
                )}
                <strong>{total}</strong>
                {' '}{total === 1 ? 'Product' : 'Products'}
              </div>

              <div className="dc-shop-controls">
                {hasFilters && (
                  <a href={path} className="dc-clear-btn">
                    <i className="ri-close-line"></i> Clear
                  </a>
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
                  <a href="/shop" className="dc-clear-btn">
                    View All Products
                  </a>
                </div>
              )}
            </div>

            <div className="dc-pagination">
              <Pagination path={path} query={query} current={page} last={lastPage} />
            </div>

            {page === 1 && !search && total > 0 && (
              <section className="dc-shop-guide" aria-labelledby="dc-shop-guide-title">
                <h2 id="dc-shop-guide-title">
                  {cat ? 'About our ' + (metaTitle ?? '').toLowerCase() : 'Streetwear from Lahore, delivered across Pakistan'}
                </h2>
                <p>
                  {`${cat && seo?.intro
                    ? seo.intro
                    : `${brand} makes everyday streetwear: unisex baggy jeans, oversized down shoulder tees, relaxed button-down shirts, football jerseys and zip-up hoodies.`} Every order is cash on delivery, shipped with TCS, Leopards or BlueEx in 2–4 working days to Karachi, Lahore and Islamabad.`}
                </p>
                {guideCats.length > 0 && (
                  <p className="dc-shop-guide-links">
                    Browse:{' '}
                    {guideCats.map((gc, i) => (
                      <Fragment key={gc._id}>
                        <a href={`/shop/${gc.slug ?? ''}`}>{strTitle(gc.title)}</a>
                        {i < guideCats.length - 1 && <span aria-hidden="true"> · </span>}
                        {' '}
                      </Fragment>
                    ))}
                  </p>
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
              <a href="/shop" className="dc-clear-btn" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="ri-close-line"></i> Clear All Filters
              </a>
            </div>
          )}
        </div>
      </aside>

      <ShopInteractions search={search} />
    </>
  );
}
