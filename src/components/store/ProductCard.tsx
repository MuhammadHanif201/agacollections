// AGA Collections — Product Card (Zilbil-style). Same markup as partials/product-card.blade.php.
import { Fragment } from 'react';
import { CARD_SIZES, cardSrcSet, thumbUrl } from '@/lib/media';
// the card's look is in /clientside/zayqora/css/product-card.css (it was inline style on every card)
import { numberFormat } from '@/lib/format';
import type { CardProduct } from '@/types/catalog';
import { AddToCartButton, WishlistButton } from './StoreButtons';
import ProductImageSwiper from './ProductImageSwiper';
import CardRating from './CardRating';
import OffBadge from './OffBadge';
import StoreLink from './StoreLink';

export default function ProductCard({ product }: { product: CardProduct }) {
  const hasVariants = product.variants.length > 0;
  const fv = hasVariants ? (product.variants.find((v) => v.quantity > 0) ?? product.variants[0]) : null;

  const basePrice = hasVariants ? (fv?.price || product.price) : product.price;
  const salePrice = hasVariants ? (fv?.sale_price || product.sale_price) : product.sale_price;

  const isOutOfStock = !hasVariants ? product.quantity <= 0 : product.variants.every((v) => v.quantity <= 0);
  const url = `/product/${product.slug}`;

  return (
    <div className="product-card h-100 d-flex flex-column position-relative">
      <WishlistButton productId={product.id} productName={product.name} />

      <ProductImageSwiper>
        {product.images.map((img, i) => (
          <div className="swiper-slide" key={i}>
            <StoreLink href={url} title={product.name}>
              {/* the first photo loads with the page; the rest wait (data-src only: ProductImageSwiper adds their srcset
                  and sizes) until the shopper reaches the card's slider */}
              <img
                src={i === 0 ? thumbUrl(img) : undefined}
                srcSet={i === 0 ? cardSrcSet(img) : undefined}
                data-src={i === 0 ? undefined : thumbUrl(img)}
                sizes={i === 0 ? CARD_SIZES : undefined}
                alt={product.name}
                loading="lazy"
                className="w-100 h-100 object-fit-cover"
              />
            </StoreLink>
          </div>
        ))}
      </ProductImageSwiper>

      <div className="pc-info">
        {product.categories.length > 0 && (
          <div className="pc-category">
            {product.categories.map((cat, i) =>
              cat.title !== 'Home Page - New Arrival' ? (
                <Fragment key={i}>
                  <StoreLink href={`/shop/${cat.slug}`}>{cat.title}</StoreLink>
                  {i < product.categories.length - 1 ? ', ' : ' '}
                </Fragment>
              ) : null,
            )}
          </div>
        )}

        <StoreLink href={url} className="pc-name">
          {product.name}
        </StoreLink>

        <CardRating rating={product.rating} />

        <div className="pc-price">
          PKR
          {salePrice && salePrice > (basePrice ?? 0) ? (
            <>
              <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#7a788c', textDecoration: 'line-through' }}>{numberFormat(salePrice)}</span>
              <span className="pc-now">{numberFormat(basePrice)}</span>
              <OffBadge now={basePrice} was={salePrice} />
            </>
          ) : (
            <span>{numberFormat(basePrice ?? 0)}</span>
          )}
        </div>

        {isOutOfStock ? (
          <span className="pc-cta pc-oos">
            Out of Stock
          </span>
        ) : (
          <AddToCartButton productId={product.id} hasVariants={hasVariants} />
        )}
      </div>
    </div>
  );
}
