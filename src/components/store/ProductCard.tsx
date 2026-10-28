// AGA Collections — Product Card (Zilbil-style). Same markup as partials/product-card.blade.php.
import { Fragment } from 'react';
import { mediaUrl } from '@/lib/media';
import { numberFormat, ucfirst } from '@/lib/format';
import type { CardProduct } from '@/types/catalog';
import { AddToCartButton, WishlistButton } from './StoreButtons';
import ProductImageSwiper from './ProductImageSwiper';
import StoreLink from './StoreLink';

export default function ProductCard({ product }: { product: CardProduct }) {
  const hasVariants = product.variants.length > 0;
  const fv = hasVariants ? (product.variants.find((v) => v.quantity > 0) ?? product.variants[0]) : null;

  // Discount badge (sale_price = old price; variants fall back to the product's)
  const now = Number(fv ? (fv.price || product.price) : product.price) || 0;
  const was = Number(fv ? (fv.sale_price || product.sale_price) : product.sale_price) || 0;
  const off = was > now && now > 0 ? Math.round(100 - (now / was) * 100) : 0;

  const basePrice = hasVariants ? (fv?.price || product.price) : product.price;
  const salePrice = hasVariants ? (fv?.sale_price || product.sale_price) : product.sale_price;

  // Sizes still in stock, when some are sold out
  const inStock = product.variants.filter((v) => v.quantity > 0);
  const allInStock = hasVariants && inStock.length === product.variants.length;
  const available: Record<string, string[]> = {};
  for (const v of inStock) {
    for (const [k, val] of Object.entries(v.option_values)) {
      (available[k] ??= []).push(String(val).toUpperCase());
    }
  }
  for (const k of Object.keys(available)) available[k] = [...new Set(available[k].filter(Boolean))];

  const isOutOfStock = !hasVariants ? product.quantity <= 0 : product.variants.every((v) => v.quantity <= 0);
  const url = `/product/${product.slug}`;

  return (
    <div className="product-card h-100 d-flex flex-column position-relative" style={{ background: '#fff', borderBottom: '1px solid var(--dc-border)' }}>
      <WishlistButton productId={product.id} productName={product.name} />

      {off >= 5 && (
        <span className="pc-off-badge" style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: '#161426', color: '#fff', fontFamily: 'var(--body-font)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', padding: '5px 8px', lineHeight: 1 }}>
          {`−${off}%`}
        </span>
      )}

      <ProductImageSwiper>
        {product.images.map((img, i) => (
          <div className="swiper-slide" key={i}>
            <StoreLink href={url} title={product.name}>
              <img src={mediaUrl(img)} alt={product.name} loading="lazy" className="w-100 h-100 object-fit-cover" />
            </StoreLink>
          </div>
        ))}
      </ProductImageSwiper>

      <div className="pc-info" style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flexGrow: 1, borderTop: '1px solid var(--dc-border)' }}>
        {product.categories.length > 0 && (
          <div className="pc-category" style={{ fontFamily: 'var(--body-font)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--dc-muted)', marginBottom: 5 }}>
            {product.categories.map((cat, i) =>
              cat.title !== 'Home Page - New Arrival' ? (
                <Fragment key={i}>
                  <StoreLink href={`/shop/${cat.slug}`} style={{ color: 'var(--dc-muted)', textDecoration: 'none' }}>{cat.title}</StoreLink>
                  {i < product.categories.length - 1 ? ', ' : ' '}
                </Fragment>
              ) : null,
            )}
          </div>
        )}

        <StoreLink href={url} className="pc-name" style={{ fontFamily: 'var(--body-font)', fontWeight: 500, fontSize: '0.86rem', color: 'var(--dc-dark)', textDecoration: 'none', lineHeight: 1.45, display: 'block', marginBottom: 10 }}>
          {product.name}
        </StoreLink>

        <div className="pc-price" style={{ fontFamily: 'var(--body-font)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--dc-dark)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          PKR
          {salePrice && salePrice > (basePrice ?? 0) ? (
            <>
              <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#7a788c', textDecoration: 'line-through' }}>{numberFormat(salePrice)}</span>
              <span style={{ color: 'var(--dc-gold)' }}>{numberFormat(basePrice)}</span>
            </>
          ) : (
            <span>{numberFormat(basePrice ?? 0)}</span>
          )}
        </div>

        {hasVariants && !allInStock && Object.keys(available).length > 0 && (
          <div className="pc-stock" style={{ fontSize: '0.7rem', color: '#555', marginBottom: 10 }}>
            {Object.entries(available).map(([key, values]) => (
              <Fragment key={key}>{ucfirst(key)}: {values.join(', ')}<br /></Fragment>
            ))}
          </div>
        )}

        {isOutOfStock ? (
          <span className="pc-cta" style={{ display: 'block', width: '100%', padding: '10px 0', background: '#ebebeb', border: '1.5px solid #e2e2e2', color: '#bbb', fontFamily: 'var(--body-font)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'center', marginTop: 'auto', cursor: 'not-allowed' }}>
            Out of Stock
          </span>
        ) : (
          <AddToCartButton productId={product.id} hasVariants={hasVariants} />
        )}
      </div>
    </div>
  );
}
