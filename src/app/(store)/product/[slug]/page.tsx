// clientside/zayqora/productDetail.blade.php
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Fragment } from 'react';
import { getCurrentCustomer } from '@/lib/auth';
import { env } from '@/lib/env';
import { formatDate, numberFormat, plural, strTitle } from '@/lib/format';
import { plainText } from '@/lib/html';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, JsonLd, type MetaOptions } from '@/lib/seo';
import { PageStyles } from '@/components/store/LegacyStyles';
import ProductCard from '@/components/store/ProductCard';
import ProductPageInteractions from '@/components/store/ProductPageInteractions';
import { WishlistToggle } from '@/components/store/StoreButtons';
import { toCards } from '@/services/catalog';
import { countProductView, getProductPage } from '@/services/product';
import { getCompanySetting } from '@/services/settings';
import StoreLink from '@/components/store/StoreLink';

type Props = { params: Promise<{ slug: string }> };

const absolute = (u: string) => (/^https?:/.test(u) ? u : env.appUrl + u);

async function load(slug: string) {
  const data = await getProductPage(decodeURIComponent(slug));
  if (!data) notFound();
  const company = await getCompanySetting();
  const { product, categories, reviewCount, avgRating } = data;
  const brandName = company?.name ?? 'AGA Collections';

  // Category (skip the internal "Home Page - New Arrival" bucket)
  const catPrimary = categories.find((c) => c.title !== 'Home Page - New Arrival') ?? null;
  const catLabel = catPrimary ? strTitle(catPrimary.title) : null;

  // Gallery: primary image first
  const gallery = [...product.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  let imgUrls = gallery.map((i) => mediaUrl(i.image_path));
  if (!imgUrls.length) imgUrls = ['/images/placeholder.png'];

  // Pricing: price = what the customer pays, sale_price = old (higher) price
  const hasVariants = product.variants.length > 0;
  const priceVariant = hasVariants ? (product.variants.find((v) => Number(v.quantity ?? 0) > 0) ?? product.variants[0]) : null;
  const basePrice = Number(hasVariants ? (priceVariant?.price || product.price) : product.price) || 0;
  const salePrice = Number(hasVariants ? (priceVariant?.sale_price || product.sale_price) : product.sale_price) || 0;
  const hasSale = salePrice > 0 && salePrice > basePrice;
  const savePct = hasSale ? Math.round(100 - (basePrice / salePrice) * 100) : 0;
  const inStock = hasVariants ? product.variants.reduce((s, v) => s + Number(v.quantity ?? 0), 0) > 0 : Number(product.quantity ?? 0) > 0;

  // Description: the first paragraph is the lead shown beside the price
  const descHtml = (product.description ?? '').trim();
  const descText = plainText(descHtml);
  let leadText: string | null = null;
  let detailsHtml = descHtml;
  const lead = descHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (lead) {
    const rest = descHtml.replace(/<p[^>]*>[\s\S]*?<\/p>/i, '').trim();
    if (rest.replace(/<[^>]*>/g, '').trim() !== '') {
      leadText = plainText(lead[1]);
      detailsHtml = rest;
    }
  }

  // SEO description: never cut mid-word, under ~158 characters
  let seoDesc = leadText || descText;
  if (seoDesc && [...seoDesc].length > 158) {
    const cut = [...seoDesc].slice(0, 155).join('');
    const sp = cut.lastIndexOf(' ');
    seoDesc = (sp > 0 ? cut.slice(0, sp) : cut).replace(/[ ,.;:–-]+$/u, '') + '…';
  }
  const h = await headers();
  const pageUrl = env.appUrl + (h.get('x-zq-path') ?? `/product/${product.slug}`);

  const meta: MetaOptions = {
    page: 'product',
    metaTitle: product.name ?? 'Product',
    metaDesc: seoDesc || `Buy ${product.name} online at ${brandName}. Cash on delivery across Pakistan.`,
    image: absolute(imgUrls[0]),
    type: 'product',
    metaProduct: {
      price: basePrice.toFixed(2),
      currency: 'PKR',
      in_stock: inStock,
      sku: product.sku ?? null,
      images: gallery.map((i) => absolute(mediaUrl(i.image_path))),
      image: absolute(imgUrls[0]),
      reviews_count: reviewCount,
      avg_rating: avgRating,
      category: catLabel,
      category_url: catPrimary ? `${env.appUrl}/shop/${catPrimary.slug}` : null,
    },
  };
  return { ...data, company, brandName, catPrimary, catLabel, imgUrls, hasVariants, priceVariant, basePrice, salePrice, hasSale, savePct, inStock, leadText, detailsHtml, pageUrl, meta };
}

export async function generateMetadata({ params }: Props) {
  return buildMetadata((await load((await params).slug)).meta);
}

export default async function ProductPage({ params }: Props) {
  const d = await load((await params).slug);
  const { product, company, brandName, catPrimary, catLabel, imgUrls, basePrice, salePrice, hasSale, savePct, inStock, leadText, detailsHtml, pageUrl, approvedReviews, reviewCount, avgRating, priceVariant } = d;
  const [customer, related] = await Promise.all([getCurrentCustomer(), toCards(d.related)]);
  await countProductView(product._id);

  const imgCount = imgUrls.length;
  const sizeList = [...new Set(product.variants
    .map((v) => Object.fromEntries(Object.entries(v.option_values ?? {}).map(([k, val]) => [k.toLowerCase(), val])).size)
    .filter((s): s is string => Boolean(s))
    .map((s) => String(s).trim().toUpperCase()))];
  const freeShipOn = Boolean(company?.free_shipping_enabled);
  const freeShipMin = Number(company?.free_shipping_threshold ?? 0);
  const waNum = (company?.whatsapps?.[0] ?? '').replace(/\D+/g, '');
  const waText = `Hi ${brandName}, I would like to order: ${product.name} — ${pageUrl}`;
  const hasSizeChart = Boolean(company?.size_chart_image);

  // Option groups, with sizes that are sold out in every variant disabled
  const optionGroups: Record<string, string[]> = {};
  const all: Record<string, Set<string>> = {};
  const available: Record<string, Set<string>> = {};
  for (const variant of product.variants) {
    for (const [opt, val] of Object.entries(variant.option_values ?? {})) {
      const optKey = opt.toLowerCase();
      const valKey = String(val).charAt(0).toUpperCase() + String(val).slice(1);
      (all[optKey] ??= new Set()).add(valKey);
      const g = (optionGroups[opt] ??= []);
      if (!g.includes(valKey)) g.push(valKey);
      if (Number(variant.quantity ?? 0) > 0) (available[optKey] ??= new Set()).add(valKey);
    }
  }
  const isDisabled = (opt: string, val: string) => !available[opt.toLowerCase()]?.has(val);

  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of approvedReviews) starCounts[r.rating] = (starCounts[r.rating] ?? 0) + 1;
  const badges = !inStock ? <span className="pd-badge pd-badge--muted">Sold out</span> : hasSale ? <span className="pd-badge">{`−${savePct}%`}</span> : null;

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__productDetail.1']} />
      <JsonLd {...d.meta} />
      <div className="pd-page">
        <div className="pd-wrap">
          <nav className="pd-crumbs" aria-label="Breadcrumb">
            <StoreLink href="/">Home</StoreLink>
            <span className="sep">/</span>
            <StoreLink href="/shop">Shop</StoreLink>
            {catPrimary && (
              <>
                <span className="sep">/</span>
                <StoreLink href={`/shop/${catPrimary.slug}`}>{catLabel}</StoreLink>
              </>
            )}
            <span className="sep">/</span>
            <span className="current" aria-current="page">{product.name}</span>
          </nav>

          <div className="pd-main">
            <div className="pd-media">
              <div className="pd-gallery">
                {imgCount > 1 && (
                  <div className="pd-thumbs" aria-label="Product images">
                    {imgUrls.map((u, i) => (
                      <button type="button" className={`pd-thumb ${i === 0 ? 'active' : ''}`} data-index={i} aria-label={`Show image ${i + 1} of ${imgCount}`} key={i}>
                        <img src={u} alt={`${product.name} — image ${i + 1}`} loading="lazy" width={84} height={105} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="pd-stage" id="pd-stage" role="button" tabIndex={0} aria-label="Open image zoom">
                  <img id="main-preview-image" src={imgUrls[0]} alt={product.name} width={900} height={1125} fetchPriority="high" />
                  <div className="pd-badges">{badges}</div>
                  <button type="button" className="pd-icon-btn pd-zoom popup-image" aria-label="Zoom image"><i className="ri-zoom-in-line"></i></button>
                  {imgCount > 1 && (
                    <>
                      <button type="button" className="pd-icon-btn pd-nav pd-nav--prev" data-dir="-1" aria-label="Previous image"><i className="ri-arrow-left-s-line"></i></button>
                      <button type="button" className="pd-icon-btn pd-nav pd-nav--next" data-dir="1" aria-label="Next image"><i className="ri-arrow-right-s-line"></i></button>
                      <span className="pd-counter"><span id="pd-counter-cur">1</span> / {imgCount}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="pd-gallery-m">
                <div className="swiper pd-mobile-swiper">
                  <div className="swiper-wrapper">
                    {imgUrls.map((u, i) => (
                      <div className="swiper-slide" key={i}>
                        {i === 0
                          ? <img src={u} alt={`${product.name} — image ${i + 1}`} id="main-preview-image-mobile" fetchPriority="high" width={780} height={975} data-index={i} />
                          : <img src={u} alt={`${product.name} — image ${i + 1}`} loading="lazy" width={780} height={975} data-index={i} />}
                      </div>
                    ))}
                  </div>
                  {imgCount > 1 && <div className="swiper-pagination pd-mobile-pagination"></div>}
                </div>
                <div className="pd-badges">{badges}</div>
              </div>
            </div>

            <div className="pd-info">
              <p className="pd-eyebrow">
                {catPrimary && <StoreLink href={`/shop/${catPrimary.slug}`}>{catLabel}</StoreLink>}
                {product.name.toLowerCase().includes('unisex') && <><span className="dot"></span><span>Unisex</span></>}
              </p>

              <h1 className="pd-title" id="product-title">{product.name}</h1>

              <div className="pd-rating">
                <span className="stars" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Fragment key={i}>{" "}<i className={i <= Math.floor(avgRating) ? "ri-star-fill" : i - 0.5 <= avgRating ? "ri-star-half-line" : "ri-star-line"}></i></Fragment>
                  ))}
                </span>
                {reviewCount > 0
                  ? <StoreLink href="#reviews">{numberFormat(avgRating, 1)} · {reviewCount} {plural('review', reviewCount)}</StoreLink>
                  : <StoreLink href="#reviews" data-open-review="">Be the first to review</StoreLink>}
              </div>

              <div className="pd-price" id="product-price">
                <span className="pd-price-now">PKR {numberFormat(basePrice)}</span>
                {hasSale && (
                  <>
                    <span className="pd-price-was">PKR {numberFormat(salePrice)}</span>
                    <span className="pd-price-off">{savePct}% off</span>
                  </>
                )}
              </div>
              <p className="pd-price-note">Price includes all taxes. Delivery charges are shown at checkout.</p>

              {leadText && <p className="pd-lead">{leadText}</p>}

              <div id="pd-options">
                {Object.entries(optionGroups).map(([optionName, values]) => (
                  <div className="pd-option" key={optionName}>
                    <div className="pd-option-head">
                      <span className="pd-option-label">
                        {strTitle(optionName)}:{' '}
                        <span className="selected-val" id={`variant-${optionName.toLowerCase()}-text`}>—</span>
                      </span>
                      {hasSizeChart && optionName.toLowerCase() === 'size' && (
                        <button type="button" className="pd-guide-link" data-open-sizechart=""><i className="ri-ruler-line"></i> Size guide</button>
                      )}
                    </div>
                    <div className="pd-option-btns" data-option-group={optionName.toLowerCase()} role="group" aria-label={`Choose ${optionName.toLowerCase()}`}>
                      {values.map((value) => {
                        const disabled = isDisabled(optionName, value);
                        return (
                          <button
                            type="button"
                            key={value}
                            className={`option-btn ${disabled ? 'disabled' : ''}`}
                            data-option-name={optionName.toLowerCase()}
                            data-option-value={value}
                            aria-label={`${strTitle(optionName)} ${value.toUpperCase()}${disabled ? ' (sold out)' : ''}`}
                            disabled={disabled}
                          >
                            {value.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p className="pd-stock" id="pd-stock-note" hidden></p>
              <input type="hidden" id="selected-variant-id" name="variant_id" value="" />

              <div className="pd-buy" id="pd-buy">
                <div className="pd-qty">
                  <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
                  <label htmlFor="product-qty" className="pd-visually-hidden">Quantity</label>
                  <input type="number" id="product-qty" defaultValue={1} min={1} max={99} inputMode="numeric" />
                  <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" className="pd-atc add-to-cart-btn js-pd-atc" id="pd-atc-main" data-product-id={product._id} data-has-variants="no">
                  <i className="ri-shopping-bag-line"></i> Add to Cart
                </button>
                {customer && (
                  <WishlistToggle productId={product._id} className="pd-wish wishlist-btn" ariaLabel={{ on: 'Remove from wishlist', off: 'Add to wishlist' }} />
                )}
              </div>
              <button type="button" className="pd-buynow js-pd-buynow" id="pd-buynow">
                Buy it now
              </button>

              {waNum && (
                <StoreLink className="pd-wa" id="pd-wa-order" target="_blank" rel="noopener" href={`https://wa.me/${waNum}?text=${encodeURIComponent(waText)}`} data-base-text={waText}>
                  <i className="ri-whatsapp-line"></i> Order on WhatsApp
                </StoreLink>
              )}

              <ul className="pd-trust">
                <li><i className="ri-hand-coin-line"></i><div><strong>Cash on Delivery</strong><span>Pay when your order arrives</span></div></li>
                <li><i className="ri-truck-line"></i><div><strong>Nationwide delivery</strong><span>2–4 working days in major cities</span></div></li>
                <li><i className="ri-customer-service-2-line"></i><div><strong>Help on WhatsApp</strong><span>Sizing and order questions</span></div></li>
              </ul>

              <details className="pd-acc" open>
                <summary>Product details</summary>
                {detailsHtml
                  ? <div className="pd-acc-body" dangerouslySetInnerHTML={{ __html: detailsHtml }} />
                  : <div className="pd-acc-body"><p>{product.name} by {brandName}.</p></div>}
              </details>

              {sizeList.length > 0 && (
                <details className="pd-acc">
                  <summary>Size &amp; fit</summary>
                  <div className="pd-acc-body">
                    <p>Available sizes:</p>
                    <div className="pd-size-chips">{sizeList.map((s) => <span key={s}>{s}</span>)}</div>
                    <p>Between two sizes? Choose the larger one for a relaxed fit.</p>
                    {hasSizeChart && <p><button type="button" className="pd-link-btn" data-open-sizechart="">Open the size guide</button></p>}
                  </div>
                </details>
              )}

              <details className="pd-acc">
                <summary>Delivery &amp; payment</summary>
                <div className="pd-acc-body">
                  <ul>
                    <li>Cash on Delivery: pay the courier when your order arrives.</li>
                    <li>Karachi, Lahore and Islamabad: 2–4 working days.</li>
                    <li>Other cities: 4–6 working days. Remote areas: 5–8 working days.</li>
                    <li>Shipped with TCS, Leopards or BlueEx.</li>
                    {freeShipOn && freeShipMin > 0 && <li>Free delivery on orders over PKR {numberFormat(freeShipMin)}.</li>}
                  </ul>
                  <p><StoreLink href="/policies#shipping">Read the shipping policy</StoreLink></p>
                </div>
              </details>

              <details className="pd-acc">
                <summary>Exchange &amp; returns</summary>
                <div className="pd-acc-body">
                  <p>Exchange or return requests are accepted within 7 days of delivery for unworn, unwashed items with their original tags. Some items, including sale items, are not eligible.</p>
                  <p><StoreLink href="/policies#return">Read the full return &amp; exchange policy</StoreLink></p>
                </div>
              </details>

              <div className="pd-meta">
                <span>SKU: <span id="product-sku">{priceVariant?.sku ?? product.sku}</span></span>
                <div className="pd-share">
                  <span>Share</span>
                  <StoreLink href={`https://wa.me/?text=${encodeURIComponent(product.name + ' — ' + pageUrl)}`} target="_blank" rel="noopener" aria-label="Share on WhatsApp"><i className="ri-whatsapp-line"></i></StoreLink>
                  <StoreLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener" aria-label="Share on Facebook"><i className="ri-facebook-fill"></i></StoreLink>
                  <button type="button" id="pd-copy-link" data-url={pageUrl} aria-label="Copy link"><i className="ri-link"></i></button>
                </div>
              </div>

              {product.variants.map((variant) => (
                <div
                  key={variant._id}
                  className="d-none variant-data"
                  data-variant-id={variant._id}
                  data-sku={variant.sku ?? ''}
                  data-price={String(variant.price || product.price || '')}
                  data-sale-price={String(variant.sale_price || product.sale_price || '')}
                  data-image={variant.primary_image ? mediaUrl(variant.primary_image) : ''}
                  data-quantity={variant.quantity ?? ''}
                  data-options={JSON.stringify(Object.fromEntries(Object.entries(variant.option_values ?? {}).map(([k, v]) => [k.toLowerCase(), v])))}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <section className="pd-section" id="reviews">
          <div className="pd-wrap">
            <div className="pd-section-hd">
              <div>
                <span className="pd-eyebrow-sm">Reviews</span>
                <h2 className="pd-h2">What customers say</h2>
              </div>
              <button type="button" className="pd-btn-outline" data-open-review=""><i className="ri-edit-line"></i> Write a review</button>
            </div>

            <div className={`pd-rev-grid ${reviewCount > 0 ? '' : 'is-empty'}`}>
              {reviewCount > 0 && (
                <div className="pd-rev-score">
                  <div className="num">{numberFormat(avgRating, 1)}</div>
                  <div className="stars" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= Math.round(avgRating) ? 'ri-star-fill' : 'ri-star-line'}></i>)}
                  </div>
                  <div className="count">{reviewCount} {plural('review', reviewCount)}</div>
                  <div className="pd-bars">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div className="pd-bar" key={star}>
                        <span>{star}★</span>
                        <div className="track"><div className="fill" style={{ width: `${Math.round((starCounts[star] / reviewCount) * 100)}%` }}></div></div>
                        <span>{starCounts[star]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {approvedReviews.length ? approvedReviews.map((review) => (
                  <article className="pd-review" key={review._id}>
                    <div className="pd-review-top">
                      <span className="name">{review.name}</span>
                      <span className="stars" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= review.rating ? 'ri-star-fill' : 'ri-star-line'}></i>)}
                      </span>
                      <span className="date">{formatDate(review.created_at, 'd M Y')}</span>
                    </div>
                    {review.comment && <p>{review.comment}</p>}
                  </article>
                )) : (
                  <div className="pd-rev-empty">
                    <i className="ri-chat-smile-2-line" style={{ fontSize: '1.6rem', display: 'block', marginBottom: 8, color: '#161426' }}></i>
                    No reviews yet. Bought this piece? Tell other shoppers how it fits.
                  </div>
                )}

                <div className="pd-rev-form" id="pd-rev-form" hidden>
                  <div id="review-success-msg" style={{ display: 'none', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '14px 18px', fontSize: '.88rem' }}>
                    <i className="ri-checkbox-circle-line"></i> Thank you! Your review was submitted and will appear after approval.
                  </div>
                  <form id="review-form" noValidate>
                    <div style={{ marginBottom: 18 }}>
                      <div className="pd-form-label" style={{ marginBottom: 8 }}>Your rating <span style={{ color: '#b42318' }}>*</span></div>
                      <div className="pd-star-picker" id="star-picker">
                        {[5, 4, 3, 2, 1].map((s) => (
                          <Fragment key={s}>
                            <input type="radio" name="rating" id={`star${s}`} value={s} />
                            <label htmlFor={`star${s}`} title={`${s} ${plural('star', s)}`}><i className="ri-star-fill"></i></label>
                          </Fragment>
                        ))}
                      </div>
                      <div id="rating-error" style={{ color: '#b42318', fontSize: '.76rem', marginTop: 6, display: 'none' }}>Please choose a rating.</div>
                    </div>
                    <div className="pd-form-row">
                      <div className="pd-form-field">
                        <label className="pd-form-label" htmlFor="review-name">Name *</label>
                        <input type="text" id="review-name" className="pd-form-input" placeholder="Your name" maxLength={100} required autoComplete="name" defaultValue={customer?.full_name ?? ''} />
                      </div>
                      <div className="pd-form-field">
                        <label className="pd-form-label" htmlFor="review-email">Email *</label>
                        <input type="email" id="review-email" className="pd-form-input" placeholder="you@example.com" maxLength={150} required autoComplete="email" defaultValue={customer?.email ?? ''} />
                      </div>
                    </div>
                    <div className="pd-form-field" style={{ marginBottom: 18 }}>
                      <label className="pd-form-label" htmlFor="review-comment">Review</label>
                      <textarea id="review-comment" className="pd-form-textarea" placeholder="How was the fit, fabric and delivery?" maxLength={1000}></textarea>
                    </div>
                    <div id="review-server-error" style={{ color: '#b42318', fontSize: '.82rem', marginBottom: 12, display: 'none' }}></div>
                    <button type="submit" className="pd-submit" id="review-submit-btn"><i className="ri-send-plane-line"></i> Submit review</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="pd-related">
            <div className="pd-wrap">
              <div className="pd-section-hd">
                <div>
                  <span className="pd-eyebrow-sm">Curated for you</span>
                  <h2 className="pd-h2">You may also like</h2>
                </div>
              </div>
              <div className="row g-3 g-md-4">
                {related.map((r) => (
                  <div className="col-6 col-md-4 col-lg-3" key={r.id}>
                    <ProductCard product={r} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="pd-sticky" id="pd-sticky" aria-hidden="true">
          <img src={imgUrls[0]} alt="" width={44} height={55} />
          <div className="pd-sticky-info">
            <div className="pd-sticky-name">{product.name}</div>
            <div className="pd-sticky-price" id="pd-sticky-price">PKR {numberFormat(basePrice)}{hasSale && <s>PKR {numberFormat(salePrice)}</s>}</div>
          </div>
          <button type="button" className="pd-atc add-to-cart-btn js-pd-atc" tabIndex={-1} data-product-id={product._id} data-has-variants="no">
            <i className="ri-shopping-bag-line"></i> Add to Cart
          </button>
        </div>

        <div className="pd-lightbox" id="pd-lightbox" role="dialog" aria-modal="true" aria-label="Image zoom">
          <img id="pd-lb-img" src={imgUrls[0]} alt={product.name} />
          <button type="button" className="pd-icon-btn pd-lb-close" aria-label="Close zoom"><i className="ri-close-line"></i></button>
          {imgCount > 1 && (
            <>
              <button type="button" className="pd-icon-btn pd-lb-prev" aria-label="Previous image"><i className="ri-arrow-left-s-line"></i></button>
              <button type="button" className="pd-icon-btn pd-lb-next" aria-label="Next image"><i className="ri-arrow-right-s-line"></i></button>
              <span className="pd-lb-count"><span id="pd-lb-cur">1</span> / {imgCount}</span>
            </>
          )}
        </div>

        {hasSizeChart && (
          <div id="sizeChartModal" className="pd-sc-modal" role="dialog" aria-modal="true" aria-label="Size guide">
            <div className="pd-sc-inner">
              <button type="button" className="pd-sc-close" aria-label="Close size guide"><i className="ri-close-line"></i></button>
              <h3>Size guide</h3>
              <img src={mediaUrl(company!.size_chart_image)} alt={`${brandName} size chart`} loading="lazy" />
              <p>Measurements are approximate. Between two sizes? Choose the larger one.</p>
            </div>
          </div>
        )}

        <div id="rupee-icon-html" style={{ display: 'none' }}>PKR</div>
      </div>

      <ProductPageInteractions
        productId={product._id}
        productQuantity={Number(product.quantity ?? 0)}
        images={imgUrls}
        pixel={{ id: product.sku ?? String(product._id), name: product.name, value: basePrice.toFixed(2) }}
      />
    </>
  );
}
