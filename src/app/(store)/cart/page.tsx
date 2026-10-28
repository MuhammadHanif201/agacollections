// clientside/zayqora/cart.blade.php
import { numberFormat, plural } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { getSession } from '@/lib/session';
import { buildMetadata } from '@/lib/seo';
import CartPageInteractions from '@/components/store/CartPageInteractions';
import { PageStyles } from '@/components/store/LegacyStyles';
import { cartSubtotal } from '@/services/pricing';
import { getCompanySetting } from '@/services/settings';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'cart' });
}

export default async function CartPage() {
  const [session, company] = await Promise.all([getSession(), getCompanySetting()]);
  const cart = session.data.cart ?? {};
  const entries = Object.entries(cart);
  const count = entries.length;
  const coupon = session.data.coupon;
  const discountCoupon = Number(coupon?.amount ?? 0);
  const subtotal = cartSubtotal(cart);
  const grandTotal = Math.max(0, subtotal - discountCoupon);
  const freeShipEnabled = Boolean(company?.free_shipping_enabled);
  const freeShipThreshold = Number(company?.free_shipping_threshold ?? 0);
  // Same rule as checkout: the amount after the coupon counts towards free shipping
  const shippingPct = freeShipEnabled && freeShipThreshold > 0 ? Math.min(100, (grandTotal / freeShipThreshold) * 100) : 0;
  const remaining = freeShipEnabled && freeShipThreshold > 0 ? Math.max(0, freeShipThreshold - grandTotal) : 0;

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__cart.1']} inline={['clientside__zayqora__cart.2']} />

      <div className="cart-page-hd">
        <div className="container">
          <div className="cart-page-hd-inner">
            <div>
              <div className="cart-breadcrumb">
                <StoreLink href="/"><i className="ri-home-4-line"></i></StoreLink>
                <span className="sep">/</span>
                <StoreLink href="/shop">Shop</StoreLink>
                <span className="sep">/</span>
                <span style={{ color: '#161426' }}>Cart</span>
              </div>
              <h1 className="cart-page-title">Your Cart</h1>
            </div>
            {count > 0 && <span className="cart-page-meta">{count} {plural('item', count)}</span>}
          </div>
        </div>
      </div>

      <div className="cart-page">
        <div className="cart-body">
          <div className="container">
            {count ? (
              <div className="row g-4 align-items-start">
                <div className="col-lg-8 cart-col-items">
                  <div className="cart-items-panel">
                    <div className="cart-items-header">
                      <div className="cart-items-header-title">
                        <i className="ri-shopping-bag-line" style={{ color: 'var(--dc-gold)', fontSize: '1rem' }}></i>
                        {' '}My Bag{' '}
                        <span className="cart-count-pill">{count}</span>
                      </div>
                      <StoreLink href="/shop" className="cart-continue" style={{ marginTop: 0 }}>
                        <i className="ri-arrow-left-s-line"></i> Continue Shopping
                      </StoreLink>
                    </div>

                    {entries.map(([key, item]) => {
                      const basePrice = Number(item.price ?? 0);
                      const qty = Number(item.quantity ?? 1);
                      return (
                        <div className="cart-item" id={`cart-item-${key}`} key={key}>
                          <div className="ci-img">
                            <StoreLink href={`/product/${item.slug}`}>
                              <img src={mediaUrl(item.image)} alt={item.name} loading="lazy" />
                            </StoreLink>
                          </div>

                          <div className="ci-details">
                            <StoreLink href={`/product/${item.slug}`} className="ci-name">
                              {item.name}
                            </StoreLink>

                            {Object.entries(item.variant_options ?? {}).map(([optName, optValue]) => (
                              <div className="ci-variant" key={optName}>{optName}: {String(optValue).toUpperCase()}</div>
                            ))}

                            <div className="ci-actions">
                              <div className="qty-stepper">
                                <button type="button" className="btn-decrease" data-key={key} aria-label="Decrease">−</button>
                                <input type="number" className="quantity-input" defaultValue={item.quantity} min={1} data-key={key} aria-label="Quantity" />
                                <button type="button" className="btn-increase" data-key={key} aria-label="Increase">+</button>
                              </div>
                              <button type="button" data-remove-key={key} className="ci-delete-btn" title="Remove from bag" aria-label={`Remove ${item.name} from bag`}>
                                <i className="ri-delete-bin-line" aria-hidden="true"></i>
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          <div className="ci-price-col">
                            <div className="ci-line-total">
                              PKR {numberFormat(basePrice * qty, 2)}
                            </div>
                            <div className="ci-unit-price">
                              PKR {numberFormat(basePrice, 2)} × {qty}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="col-lg-4 cart-col-summary">
                  <div className="cart-summary-panel">
                    <div className="cs-header">
                      <i className="ri-price-tag-3-line" style={{ color: 'var(--dc-gold)' }}></i>
                      <span className="cs-header-title">Order Summary</span>
                    </div>

                    {freeShipEnabled && freeShipThreshold > 0 && (
                      <div className="cs-shipping-section">
                        {remaining > 0 ? (
                          <div className="cs-ship-msg">
                            <i className="ri-truck-line"></i>
                            {' '}Add <strong style={{ color: 'rgba(255,255,255,.7)', margin: '0 3px' }}>
                              PKR {numberFormat(remaining, 0)}
                            </strong> more for free shipping
                          </div>
                        ) : (
                          <div className="cs-ship-msg qualified">
                            <i className="ri-truck-line"></i>
                            {' '}You qualify for free shipping!
                          </div>
                        )}
                        <div className="cs-ship-track">
                          <div className="cs-ship-fill" style={{ width: `${shippingPct}%` }}></div>
                        </div>
                      </div>
                    )}

                    <div className="cs-rows">
                      <div className="cs-row">
                        <span>Subtotal</span>
                        <span className="cs-row-val">
                          PKR {numberFormat(subtotal, 2)}
                        </span>
                      </div>
                      {discountCoupon > 0 && (
                        <div className="cs-row discount">
                          <span>Discount ({coupon?.code ?? ''})</span>
                          <span className="cs-row-val">
                            − PKR {numberFormat(discountCoupon, 2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="cs-divider"></div>

                    <div className="cs-total-row">
                      <span className="cs-total-label">Total</span>
                      <span className="cs-total-val">
                        PKR {numberFormat(grandTotal, 2)}
                      </span>
                    </div>
                    <div className="cs-total-note">Shipping calculated at checkout.</div>

                    <StoreLink href="/checkout" className="cs-checkout-btn">
                      Proceed to Checkout
                      {' '}<i className="ri-arrow-right-line"></i>
                    </StoreLink>

                    <div className="cs-cod-badge">
                      <i className="ri-truck-line"></i>
                      <div className="cs-cod-badge-text">
                        <strong>Cash on Delivery</strong>
                        {' '}Pay when your order arrives — no card required.
                      </div>
                    </div>

                    <div className="cs-guarantee">
                      <i className="ri-shield-check-line"></i>
                      <div className="cs-guarantee-text">
                        100% secure order. Your details are safe with us.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="row justify-content-center">
                <div className="col-lg-6">
                  <div className="cart-empty">
                    <div className="cart-empty-icon">
                      <i className="ri-shopping-bag-line"></i>
                    </div>
                    <h2>Your bag is empty</h2>
                    <p>Looks like you haven&apos;t added anything yet. Explore our collection and find something you love.</p>
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                      <StoreLink href="/shop" className="cart-empty-cta">
                        <i className="ri-store-line"></i> Shop Collection
                      </StoreLink>
                      <StoreLink href="/" className="cart-empty-shop">
                        <i className="ri-home-line"></i> Home
                      </StoreLink>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="cart-loading-overlay" style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(249,247,244,.85)', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, border: '2.5px solid #e3e2ea', borderTopColor: '#161426', borderRadius: '50%', animation: 'spin .7s linear infinite' }}></div>
          <span style={{ fontSize: '.65rem', letterSpacing: '.18em', textTransform: 'uppercase', color: '#999' }}>Updating…</span>
        </div>
      </div>

      <CartPageInteractions />
    </>
  );
}
