// partials/cart_sidebar.blade.php (the mini-cart, kept hidden inside the header as before)
import { Fragment } from 'react';
import { mediaUrl } from '@/lib/media';
import { numberFormat } from '@/lib/format';
import type { CartLine } from '@/models/Session';
import { cartSubtotal } from '@/services/pricing';
import StoreLink from './StoreLink';

export default function CartSidebarItems({ cart }: { cart: Record<string, CartLine> }) {
  const entries = Object.entries(cart);
  return (
    <div className="cart__sidebar">
      <div className="container">
        <div className="cart__content">
          <p className="fw-bold mb-3 border-bottom pb-2 fs-5">Shopping Cart</p>
          {entries.length ? (
            <>
              <div className="cart-text">
                {entries.map(([key, item]) => {
                  const opts = Object.entries(item.variant_options ?? {});
                  return (
                    <div className="d-flex justify-content-between align-items-center border-bottom py-3" key={key}>
                      <div className="d-flex align-items-center w-100">
                        <img src={mediaUrl(item.image)} alt={item.name} className="rounded shadow-sm" style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 12 }} />
                        <div className="flex-grow-1">
                          <h6 className="mb-1 text-dark fw-semibold" style={{ fontSize: 15, lineHeight: 1.2, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </h6>
                          {opts.length > 0 && (
                            <small className="text-muted d-block">
                              {opts.map(([n, v], i) => (
                                <Fragment key={n}>
                                  <span style={{ textTransform: 'capitalize' }}>{n}:</span> <strong>{v}</strong>
                                  {i < opts.length - 1 ? ', ' : ''}
                                </Fragment>
                              ))}
                            </small>
                          )}
                          <small className="text-muted">{item.quantity} × PKR {numberFormat(item.price, 2)}</small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cart-bottom mt-4">
                <div className="cart-subtotal d-flex justify-content-between align-items-center py-3 border-top">
                  <span className="fw-bold text-uppercase">Subtotal:</span>
                  <span className="fw-bold text-primary">PKR {numberFormat(cartSubtotal(cart), 2)}</span>
                </div>
                <StoreLink href="/cart" className="btn btn-outline-dark w-100 mb-2 fw-bold text-uppercase">View Cart</StoreLink>
                <StoreLink href="/checkout" className="btn btn-dark w-100 fw-bold text-uppercase">Checkout</StoreLink>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="90" height="90" className="mb-3 animate__animated animate__fadeIn" aria-hidden="true" fill="none" stroke="#161426" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="26" cy="54" r="3" />
                <circle cx="50" cy="54" r="3" />
                <path d="M2 6h8l8 36h28l8-24H18" />
              </svg>
              <p className="text-muted fw-semibold mb-3">Your Cart Is Empty.</p>
              <StoreLink href="/" className="btn btn-outline-primary btn-sm fw-bold text-uppercase">Continue Shopping</StoreLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
