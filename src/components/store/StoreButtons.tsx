'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useStore } from './StoreProvider';

/** Heart on product cards */
export function WishlistButton({ productId, productName }: { productId: number; productName: string }) {
  const { inWishlist } = useStore();
  const active = inWishlist(productId);
  return (
    <WishlistToggle
      productId={productId}
      className="wishlist-btn"
      ariaLabel={`Add ${productName} to wishlist`}
      style={{
        position: 'absolute', top: 10, right: 10, zIndex: 10, fontSize: '0.9rem',
        color: active ? '#161426' : '#aaa',
        background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e2e2',
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', transition: 'color 0.2s, border-color 0.2s',
      }}
    />
  );
}

/**
 * Any .wishlist-btn: toggles the product on the wishlist; every heart for the same
 * product updates together (the footer script's setHearts()).
 */
export function WishlistToggle({
  productId,
  className,
  ariaLabel,
  style,
  iconHidden,
}: {
  productId: number;
  className: string;
  /** a fixed label, or one per state (filled / empty heart) */
  ariaLabel: string | { on: string; off: string };
  style?: CSSProperties;
  iconHidden?: boolean;
}) {
  const { inWishlist, toggleWishlist } = useStore();
  const active = inWishlist(productId);
  return (
    <button
      type="button"
      className={`${className} ${active ? 'active' : ''}`}
      data-id={productId}
      aria-label={typeof ariaLabel === 'string' ? ariaLabel : active ? ariaLabel.on : ariaLabel.off}
      onClick={() => toggleWishlist(productId)}
      style={style}
    >
      <i className={`${active ? 'fas' : 'fal'} fa-heart`} aria-hidden={iconHidden ? 'true' : undefined}></i>
    </button>
  );
}

/** "Add to Cart" on product cards (opens the size picker for products with variants) */
export function AddToCartButton({ productId, hasVariants }: { productId: number; hasVariants: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <CartTrigger
      productId={productId}
      hasVariants={hasVariants}
      className="add-to-cart-btn pc-cta"
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      style={{
        display: 'block', width: '100%', padding: '10px 0',
        background: hover ? '#fff' : 'var(--dc-dark)', border: '1.5px solid var(--dc-dark)',
        color: hover ? '#161426' : '#fff', fontFamily: 'var(--body-font)', fontSize: '0.68rem', letterSpacing: '0.18em',
        textTransform: 'uppercase', textAlign: 'center', textDecoration: 'none', marginTop: 'auto',
        transition: 'background 0.22s, color 0.22s', cursor: 'pointer',
      }}
    >
      Add to Cart
    </CartTrigger>
  );
}

/** Any .add-to-cart-btn */
export function CartTrigger({
  productId,
  hasVariants,
  className,
  style,
  children,
  onMouseOver,
  onMouseOut,
}: {
  productId: number;
  hasVariants: boolean;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
}) {
  const { addFromCard } = useStore();
  return (
    <button
      type="button"
      className={className}
      data-product-id={productId}
      data-has-variants={hasVariants ? 'yes' : 'no'}
      onClick={(e) => { e.preventDefault(); addFromCard(productId, hasVariants); }}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      style={style}
    >
      {children}
    </button>
  );
}
