// clientside/zayqora/index.blade.php
import { Fragment } from 'react';
import { mediaUrl } from '@/lib/media';
import { numberFormat, plural, strLimit, strTitle, formatDate } from '@/lib/format';
import { buildMetadata, JsonLd } from '@/lib/seo';
import { PageStyles } from '@/components/store/LegacyStyles';
import HomePopup from '@/components/store/HomePopup';
import ScrollReveal from '@/components/store/ScrollReveal';
import { CartTrigger, WishlistToggle } from '@/components/store/StoreButtons';
import ZqHero from '@/components/store/ZqHero';
import { toCards } from '@/services/catalog';
import { homeData, homeReviews } from '@/services/home';
import { getActivePopup, getCompanySetting, getMenuCategories } from '@/services/settings';
import type { CardProduct } from '@/types/catalog';
import StoreLink from '@/components/store/StoreLink';

const NEW_ARRIVAL = 'Home Page - New Arrival';

async function meta() {
  const s = await getCompanySetting();
  const brand = s?.name ?? 'AGA Collections';
  return {
    page: 'home' as const,
    metaDesc: `Baggy jeans, oversized tees, button-down shirts, football jerseys and zip-up hoodies from ${brand}, Lahore. Cash on delivery across Pakistan.`,
  };
}

export async function generateMetadata() {
  return buildMetadata(await meta());
}

const COLOR_MAP: Record<string, string> = {
  black: '#111', white: '#fff', navy: '#1B2A4A', 'navy blue': '#1B2A4A',
  red: '#DC2626', blue: '#3B82F6', 'royal blue': '#1D4ED8', grey: '#9CA3AF',
  gray: '#9CA3AF', 'dark grey': '#4B5563', 'ash grey': '#b0b0b0', charcoal: '#374151',
  'charcoal grey': '#374151', 'charcoal black': '#1F2937', olive: '#6B7C3A',
  'olive green': '#4D5F2A', 'forest green': '#166534', 'dark green': '#166534',
  burgundy: '#7B2142', maroon: '#7B2142', 'dark red': '#991B1B', camel: '#C8956C',
  brown: '#92400E', cream: '#F5F0E8', 'off white': '#F5F5F0', stone: '#A8A29E',
  'indigo blue': '#4338CA', 'dark indigo': '#312E81', 'mid blue': '#3B82F6',
  'light blue': '#93C5FD', 'sky blue': '#7DD3FC', 'washed grey': '#D1D5DB',
  yellow: '#EAB308', 'deep purple': '#7C3AED', champagne: '#E8D5B7',
  'dusty rose': '#F4A7B9', 'classic blue': '#2563EB', 'dark blue': '#1E40AF',
  'washed black': '#374151', 'dark wash': '#1F2937', 'light wash': '#BFDBFE',
  'dark wash wide leg': '#1F2937',
  'black/gold': '#1a1a00', 'navy/white': '#1B2A4A', 'grey/red': '#6b6b6b',
};

const img = (p: CardProduct) => (p.primary_image ? mediaUrl(p.primary_image) : '/images/placeholder.png');
const inStockVariant = (p: CardProduct) => p.variants.find((v) => v.quantity > 0) ?? null;
const isOos = (p: CardProduct) => (p.variants.length ? p.variants.every((v) => v.quantity <= 0) : p.quantity <= 0);

/** $bp / $sp for the dc-product-card sections (variant price, else the product's) */
function prices(p: CardProduct) {
  const has = p.variants.length > 0;
  const fv = has ? inStockVariant(p) : null;
  const bp = has ? (fv?.price || p.price) : p.price;
  const sp = has ? (fv?.sale_price || p.sale_price) : p.sale_price;
  return { bp: Number(bp ?? 0), sp: sp == null ? null : Number(sp) };
}

export default async function HomePage() {
  const [data, reviews, menuCategories, company, popup] = await Promise.all([
    homeData(), homeReviews(), getMenuCategories(), getCompanySetting(), getActivePopup(),
  ]);
  const [latest, best, sale] = await Promise.all([toCards(data.latestProducts), toCards(data.bestSellers), toCards(data.saleProducts)]);
  const showcase = await Promise.all(data.categoryShowcase.map(async (b) => ({ category: b.category, products: await toCards(b.products) })));
  const catTiles = menuCategories.filter((c) => c.title !== NEW_ARRIVAL);
  const year = new Date().getUTCFullYear();
  const brand = company?.name ?? 'AGA Collections';

  return (
    <>
      <PageStyles
        pushed={['/clientside/zayqora/css/home.css', 'clientside__zayqora__index.1', 'clientside__zayqora__partials__zq-hero.1', 'clientside__zayqora__partials__home-reviews.1']}
        inline={catTiles.length ? ['clientside__zayqora__index.2'] : []}
      />
      {/* Each screen size preloads only the hero picture it shows (matches the <source media> in ZqHero) */}
      <link rel="preload" as="image" href={mediaUrl('banners/zq-hero-poster.webp') + '?v=14'} media="(min-width: 768px)" fetchPriority="high" />
      <link rel="preload" as="image" href={mediaUrl('banners/zq-hero-poster-m.webp') + '?v=14'} media="(max-width: 767px)" fetchPriority="high" />
      <JsonLd {...await meta()} />
      <ScrollReveal threshold={0.08} />

      {/* Shared AGA Collections hero: same height and style as the shop, category and policies banners */}
      <ZqHero
        image={mediaUrl('banners/zq-hero-poster.webp') + '?v=14'}
        imageMobile={mediaUrl('banners/zq-hero-poster-m.webp') + '?v=14'}
        video={mediaUrl('banners/zq-hero-clothes.mp4') + '?v=2'}
        poster={mediaUrl('banners/zq-hero-clothes-poster.webp') + '?v=2'}
        position="50% 50%"
        eyebrow={`New Collection · ${year}`}
        title="Made for Your Style"
        subtitle="Baggy denim, oversized tees and relaxed shirts for everyday wear."
        cta={{ label: 'Shop Now', url: '/shop' }}
        tone="navy"
      />

      {/* ═══ NEW ARRIVALS ═══ */}
      <section className="dc-na" data-dc-reveal="">
        <div className="container-fluid dc-na-container">
          <div className="dc-section-hd">
            <div className="dc-section-hd-left">
              <p className="dc-section-subtitle">Just landed &nbsp;·&nbsp; Season {year}</p>
              <h2 className="dc-section-title">New In</h2>
              <p className="zq-hd-meta">{latest.length} new pieces</p>
            </div>
            <StoreLink href="/shop" className="dc-view-all d-none d-md-flex">
              Shop All <i className="ri-arrow-right-line"></i>
            </StoreLink>
          </div>

          <div className="dc-na-grid">
            {latest.length ? latest.map((product, naIdx) => {
              const hasVar = product.variants.length > 0;
              const oos = isOos(product);
              const fv = hasVar ? inStockVariant(product) : null;
              // current selling price, and the old price shown struck through when on sale
              const bp = hasVar ? (fv?.price ?? product.price) : product.price;
              const sp = hasVar ? (fv?.sale_price ?? product.sale_price) : product.sale_price;
              const onSale = Boolean(sp && bp && sp > bp);
              const colors: Record<string, string> = {};
              for (const v of product.variants) {
                for (const [k, val] of Object.entries(v.option_values)) {
                  if (k.toLowerCase() === 'color') colors[String(val).toLowerCase()] = String(val);
                }
              }
              const colorList = Object.values(colors);
              const colShow = colorList.slice(0, 5);
              const colMore = Math.max(0, colorList.length - 5);
              return (
                <article className="dc-na-card " style={{ '--na-delay': `${naIdx * 55}ms` } as React.CSSProperties} key={product.id}>
                  <div className="dc-na-img">
                    <span className="dc-na-badge dc-na-badge--new">New</span>
                    {onSale && <span className="dc-na-badge dc-na-badge--sale">{`−${Math.trunc(Math.round(100 - (Number(bp) / Number(sp)) * 100))}%`}</span>}
                    <WishlistToggle productId={product.id} className="wishlist-btn dc-na-wish" ariaLabel="Wishlist" />
                    <StoreLink href={`/product/${product.slug}`} className="dc-na-photo-link">
                      <img src={img(product)} alt={product.name} loading="lazy" />
                    </StoreLink>
                    <StoreLink href={`/product/${product.slug}`} className="dc-na-overlay">
                      <span>Explore</span> <i className="ri-arrow-right-line"></i>
                    </StoreLink>
                  </div>

                  <div className="dc-na-info">
                    {product.categories.length > 0 && (
                      <div className="dc-na-cat">
                        {product.categories.filter((c) => c.title !== NEW_ARRIVAL).map((c, i) => <span key={i}>{c.title}</span>)}
                      </div>
                    )}

                    <StoreLink href={`/product/${product.slug}`} className="dc-na-name">
                      {product.name}
                    </StoreLink>

                    <div className="dc-na-price-row">
                      PKR
                      {onSale ? (
                        <>
                          <span className="dc-na-was">{numberFormat(sp, 0)}</span>
                          <span className="dc-na-price">{numberFormat(bp, 0)}</span>
                        </>
                      ) : (
                        <span className="dc-na-price">{numberFormat(bp, 0)}</span>
                      )}
                    </div>

                    {colShow.length > 0 && (
                      <div className="dc-na-swatches">
                        {colShow.map((name) => {
                          const hex = COLOR_MAP[name.toLowerCase()];
                          return hex ? (
                            <span key={name} className="dc-na-dot"
                              style={{ background: hex, ...(['white', 'off white', 'cream'].includes(name.toLowerCase()) ? { borderColor: '#ccc' } : {}) }}
                              title={name}></span>
                          ) : null;
                        })}
                        {colMore > 0 && <span className="dc-na-dot-more">+{colMore}</span>}
                      </div>
                    )}

                    {oos ? (
                      <button className="dc-na-cta dc-na-cta--oos" disabled>Out of Stock</button>
                    ) : (
                      <CartTrigger productId={product.id} hasVariants={hasVar} className="add-to-cart-btn dc-na-cta">
                        {hasVar ? 'Select Options' : 'Add to Cart'}
                      </CartTrigger>
                    )}
                  </div>
                </article>
              );
            }) : (
              <p className="dc-na-empty">No new arrivals at the moment — check back soon.</p>
            )}
          </div>

          <div className="dc-na-footer">
            <span className="dc-na-footer-line"></span>
            <StoreLink href="/shop" className="dc-na-footer-btn">
              View All Pieces <i className="ri-arrow-right-line"></i>
            </StoreLink>
            <span className="dc-na-footer-line"></span>
          </div>
        </div>
      </section>

      {/* ═══ BEST SELLERS ═══ */}
      {best.length > 0 && (
        <section className="dc-section zq-bestsellers" data-dc-reveal="">
          <div className="container">
            <div className="dc-section-hd">
              <div className="dc-section-hd-left">
                <p className="dc-section-subtitle">Worn on repeat.</p>
                <h2 className="dc-section-title">Most Loved</h2>
              </div>
              <StoreLink href="/shop" className="dc-view-all d-none d-md-flex">
                Shop All <i className="ri-arrow-right-line"></i>
              </StoreLink>
            </div>

            <div className="row g-3 g-md-4">
              {best.slice(0, 4).map((product) => {
                const hasVariants = product.variants.length > 0;
                const { bp, sp } = prices(product);
                return (
                  <div className="col-6 col-md-4 col-lg-3" key={product.id}>
                    <div className="dc-product-card">
                      <div className="dc-product-img-wrap">
                        {sp && sp > bp ? <span className="dc-sale-badge">{`−${Math.round(100 - (bp / sp) * 100)}%`}</span> : null}
                        <span className="dc-badge-tag">Best Seller</span>
                        <WishlistToggle productId={product.id} className="wishlist-btn dc-wishlist-btn" ariaLabel={{ on: 'Remove from wishlist', off: 'Add to wishlist' }} iconHidden />
                        <StoreLink href={`/product/${product.slug}`}>
                          <img src={img(product)} alt={product.name} loading="lazy" />
                        </StoreLink>
                        <StoreLink href={`/product/${product.slug}`} className="dc-product-explore">
                          Explore <i className="ri-arrow-right-line"></i>
                        </StoreLink>
                      </div>

                      <div className="dc-product-info">
                        {product.categories.length > 0 && (
                          <div className="dc-product-cat">
                            {product.categories.map((c, i) => <span key={i}>{c.title}</span>)}
                          </div>
                        )}
                        <StoreLink href={`/product/${product.slug}`} className="dc-product-name">
                          {product.name}
                        </StoreLink>
                        <div className="dc-product-price">
                          PKR
                          {sp && sp > bp ? (
                            <>
                              <span className="was">{numberFormat(sp)}</span>
                              <span>{numberFormat(bp)}</span>
                            </>
                          ) : (
                            <span>{numberFormat(bp)}</span>
                          )}
                        </div>
                        {isOos(product) ? (
                          <span className="dc-add-cart-btn disabled">Out of Stock</span>
                        ) : (
                          <CartTrigger productId={product.id} hasVariants={hasVariants} className="add-to-cart-btn dc-add-cart-btn">
                            Add to Cart
                          </CartTrigger>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-5 d-md-none">
              <StoreLink href="/shop" className="dc-view-all-btn">
                Shop All <i className="ri-arrow-right-line"></i>
              </StoreLink>
            </div>
          </div>
        </section>
      )}

      {/* ═══ SHOP BY CATEGORY — tile grid ═══ */}
      {/* The Blade view had its <style> block here; it keeps this section from being
          an adjacent ".dc-section + .dc-section" (no extra 1px top border). The rules
          themselves load from the page's stylesheet. */}
      {catTiles.length > 0 && <style>{''}</style>}
      {catTiles.length > 0 && (
        <section className="dc-section dc-cats" data-dc-reveal="">
          <div className="container">
            <div className="dc-section-hd">
              <div className="dc-section-hd-left">
                <p className="dc-section-subtitle">Explore.</p>
                <h2 className="dc-section-title">The Collections</h2>
              </div>
              <div className="dc-section-hd-right">
                <StoreLink href="/shop" className="dc-na-showall">
                  View All <i className="ri-arrow-right-line"></i>
                </StoreLink>
              </div>
            </div>

            <div className="dc-cats-grid">
              {catTiles.map((cat) => (
                <StoreLink href={`/shop/${cat.slug ?? ''}`} className="dc-cat-tile" aria-label={cat.title} key={cat._id}>
                  <img src={cat.image ? mediaUrl(cat.image) : '/images/placeholder.png'} alt={cat.title} loading="lazy" />
                  <span className="dc-cat-veil"></span>
                  <div className="dc-cat-body">
                    <h3 className="dc-cat-name">{cat.title}</h3>
                    <span className="dc-cat-count">{`${cat.products_count} ${plural("Style", cat.products_count)}`}</span>
                    <span className="dc-cat-underline"></span>
                  </div>
                </StoreLink>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ SHOP THE EDIT — per category ═══ */}
      {showcase.length > 0 && (
        <section className="dc-section dc-cat-show" data-dc-reveal="">
          <div className="container-fluid px-3 px-md-4">
            <div className="dc-section-hd">
              <div className="dc-section-hd-left">
                <p className="dc-section-subtitle">Curated by category.</p>
                <h2 className="dc-section-title">Shop the Edit</h2>
              </div>
            </div>

            {showcase.map(({ category: cat, products }) => (
              <div className="dc-cat-block" key={cat._id}>
                <div className="dc-cat-block-hd">
                  <h3 className="dc-cat-block-title">{cat.title}</h3>
                  <StoreLink href={`/shop/${cat.slug ?? ''}`} className="dc-cat-block-link">
                    View All <i className="ri-arrow-right-line"></i>
                  </StoreLink>
                </div>

                <div className="row g-3 g-md-4">
                  {products.map((product) => {
                    const { bp, sp } = prices(product);
                    return (
                      <div className="col-6 col-md-4 col-lg-2" key={product.id}>
                        <div className="dc-product-card">
                          <div className="dc-product-img-wrap">
                            {sp && sp > bp ? <span className="dc-sale-badge">{`−${Math.round(100 - (bp / sp) * 100)}%`}</span> : null}
                            <StoreLink href={`/product/${product.slug}`}>
                              <img src={img(product)} alt={product.name} loading="lazy" />
                            </StoreLink>
                            <StoreLink href={`/product/${product.slug}`} className="dc-product-explore">
                              Explore <i className="ri-arrow-right-line"></i>
                            </StoreLink>
                          </div>
                          <div className="dc-product-info">
                            <StoreLink href={`/product/${product.slug}`} className="dc-product-name">{product.name}</StoreLink>
                            <div className="dc-product-price">
                              PKR
                              {sp && sp > bp ? (
                                <>
                                  <span className="was">{numberFormat(sp, 0)}</span>
                                  <span>{numberFormat(bp, 0)}</span>
                                </>
                              ) : (
                                <span>{numberFormat(bp ?? 0, 0)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ HOT DEALS ═══ */}
      {sale.length > 0 && (
        <section className="dc-section dc-deals" data-dc-reveal="">
          <div className="container-fluid px-3 px-md-4">
            <div className="dc-section-hd">
              <div className="dc-section-hd-left">
                <p className="dc-section-subtitle">
                  <span className="dc-deals-pulse"></span>
                  Limited time.
                </p>
                <h2 className="dc-section-title">Last Call</h2>
              </div>
              <StoreLink href="/shop" className="dc-view-all d-none d-md-flex">
                Shop the Sale <i className="ri-arrow-right-line"></i>
              </StoreLink>
            </div>

            <div className="row g-3 g-md-4">
              {sale.map((product) => {
                const { bp, sp } = prices(product);
                const savePct = sp && sp > bp ? Math.round(((sp - bp) / sp) * 100) : null;
                return (
                  <div className="col-6 col-md-4 col-lg-3" key={product.id}>
                    <div className="dc-product-card">
                      <div className="dc-product-img-wrap">
                        {savePct ? <span className="dc-deal-pill">{`−${savePct}%`}</span> : null}
                        <WishlistToggle productId={product.id} className="wishlist-btn dc-wishlist-btn" ariaLabel={{ on: 'Remove from wishlist', off: 'Add to wishlist' }} iconHidden />
                        <StoreLink href={`/product/${product.slug}`}>
                          <img src={img(product)} alt={product.name} loading="lazy" />
                        </StoreLink>
                        <StoreLink href={`/product/${product.slug}`} className="dc-product-explore">
                          Explore <i className="ri-arrow-right-line"></i>
                        </StoreLink>
                      </div>
                      <div className="dc-product-info">
                        {product.categories.length > 0 && (
                          <div className="dc-product-cat">
                            {product.categories.map((c, i) =>
                              c.title !== NEW_ARRIVAL ? (
                                <Fragment key={i}>
                                  <StoreLink href={`/shop/${c.slug}`}>{c.title}</StoreLink>{i < product.categories.length - 1 ? ', ' : ' '}
                                </Fragment>
                              ) : null,
                            )}
                          </div>
                        )}
                        <StoreLink href={`/product/${product.slug}`} className="dc-product-name">{product.name}</StoreLink>
                        <div className="dc-product-price">
                          PKR
                          {sp && sp > bp ? (
                            <>
                              <span className="was">{numberFormat(sp, 0)}</span>
                              <span>{numberFormat(bp, 0)}</span>
                            </>
                          ) : (
                            <span>{numberFormat(bp ?? 0, 0)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-4 d-md-none">
              <StoreLink href="/shop" className="dc-view-all-btn">
                Shop the Sale <i className="ri-arrow-right-line"></i>
              </StoreLink>
            </div>
          </div>
        </section>
      )}

      {/* Customer reviews */}
      <section className="zq-reviews" aria-labelledby="zq-reviews-title" data-dc-reveal="">
        <div className="container">
          <div className="zq-reviews-hd">
            <div>
              <p className="zq-reviews-eyebrow">Reviews</p>
              <h2 className="zq-reviews-title" id="zq-reviews-title">What our customers say</h2>
            </div>
            {reviews.count > 0 && (
              <div className="zq-reviews-score" aria-label={`Average rating ${reviews.avg} out of 5 from ${reviews.count} reviews`}>
                <span className="num">{numberFormat(reviews.avg, 1)}</span>
                <span>
                  <span className="stars" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= Math.round(reviews.avg) ? 'ri-star-fill' : 'ri-star-line'}></i>)}
                  </span>
                  <span className="count">{`${reviews.count} ${plural("review", reviews.count)}`}</span>
                </span>
              </div>
            )}
          </div>

          {reviews.show.length > 0 && (
            <div className="zq-reviews-track">
              {reviews.show.map((r) => {
                const primary = r.product.images.find((i) => i.is_primary);
                return (
                  <article className="zq-review" key={r._id}>
                    <div className="stars" aria-label={`${r.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= r.rating ? 'ri-star-fill' : 'ri-star-line'} aria-hidden="true"></i>)}
                    </div>
                    {r.comment && r.comment.trim() !== '' ? (
                      <p className="quote">{`“${strLimit(r.comment, 180)}”`}</p>
                    ) : (
                      <p className="quote quote--muted">{`Rated ${r.rating} out of 5.`}</p>
                    )}
                    <div className="who">
                      <span className="avatar" aria-hidden="true">{[...r.name.trim()][0]?.toUpperCase() ?? ''}</span>
                      <span className="name">{strTitle(r.name)}</span>
                      <span className="date">{formatDate(r.created_at, 'M Y')}</span>
                    </div>
                    <StoreLink className="product" href={`/product/${r.product.slug}#reviews`}>
                      {primary && <img src={mediaUrl(primary.image_path)} alt="" width={40} height={50} loading="lazy" />}
                      <span>{r.product.name}</span>
                      <i className="ri-arrow-right-up-line" aria-hidden="true"></i>
                    </StoreLink>
                  </article>
                );
              })}
            </div>
          )}

          <div className="zq-reviews-cta">
            <p>Bought from {brand}? Open the product you ordered and tap <strong>Write a review</strong>. Your review appears after a quick check.</p>
            <StoreLink href="/shop" className="zq-reviews-btn">Find your product <i className="ri-arrow-right-line" aria-hidden="true"></i></StoreLink>
          </div>
        </div>
      </section>

      {popup && (
        <HomePopup
          position={popup.position}
          image={popup.image_path ? mediaUrl(popup.image_path) : null}
          title={popup.title ?? null}
          content={popup.content ?? null}
          buttonText={popup.button_text ?? null}
          buttonLink={popup.button_link ?? null}
          dismissible={popup.dismissible}
          showOncePerUser={popup.show_once_per_user}
          delaySeconds={popup.delay_seconds ?? 0}
        />
      )}
    </>
  );
}
