// clientauth/checkout.blade.php
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { numberFormat } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { getSession } from '@/lib/session';
import { buildMetadata } from '@/lib/seo';
import CheckoutInteractions from '@/components/store/CheckoutInteractions';
import { PageStyles } from '@/components/store/LegacyStyles';
import { AFFILIATE_COOKIE } from '@/models/Affiliate';
import { Session } from '@/models/Session';
import { CITY_ZONES, cartSubtotal, shippingForCity } from '@/services/pricing';
import { getCompanySetting } from '@/services/settings';
import StoreLink from '@/components/store/StoreLink';
import CityPicker from '@/components/store/CityPicker';

export async function generateMetadata() {
  return buildMetadata({ page: 'checkout', image: '/clientside/company_logo/logo.png' });
}

const CITIES: [string, string[]][] = [
  ['Major metros', ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta']],
  ['Punjab', ['Sialkot', 'Gujranwala', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang', 'Dera Ghazi Khan', 'Gujrat', 'Kasur', 'Okara', 'Sahiwal', 'Chiniot', 'Khanewal', 'Mianwali', 'Attock', 'Rahim Yar Khan', 'Muzaffargarh', 'Hafizabad', 'Chakwal', 'Narowal', 'Pakpattan', 'Bahawalnagar', 'Vehari', 'Lodhran', 'Nankana Sahib']],
  ['Sindh', ['Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpurkhas', 'Shikarpur', 'Jacobabad', 'Dadu', 'Thatta', 'Badin', 'Khairpur', 'Sanghar', 'Umerkot']],
  ['KPK', ['Abbottabad', 'Mardan', 'Nowshera', 'Charsadda', 'Swat', 'Kohat', 'Bannu', 'Dera Ismail Khan', 'Mansehra', 'Haripur', 'Swabi', 'Buner', 'Timergara']],
  ['Balochistan', ['Turbat', 'Khuzdar', 'Gwadar', 'Hub', 'Chaman', 'Zhob']],
  ['AJK / GB / Remote', ['Muzaffarabad', 'Mirpur', 'Gilgit', 'Skardu', 'Rawalakot', 'Kotli', 'Bhimber']],
];

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ buy?: string }> }) {
  const session = await getSession();
  // "Buy it now" checks out only that item (kept apart from the bag), without the bag's coupon
  const buyNow = (await searchParams).buy === 'now' && Object.keys(session.data.buy_now ?? {}).length > 0;
  const cart = (buyNow ? session.data.buy_now : session.data.cart) ?? {};
  // Nothing to buy: back to the (empty) bag instead of a PKR 0 checkout
  if (!Object.keys(cart).length) redirect('/cart');

  const [company, customer, jar] = await Promise.all([getCompanySetting(), getCurrentCustomer(), cookies()]);
  const data = session.data as typeof session.data & { _old?: Record<string, string>; pending_checkout_data?: Record<string, string> };
  const old = data._old ?? null;
  if (old && session.id) {
    // Old input is shown once, like Laravel's old()
    await connectDb();
    await Session.updateOne({ _id: session.id }, { $unset: { 'data._old': 1 } });
  }
  const pending = data.pending_checkout_data ?? {};
  const val = (key: string, fallback?: string | null) => old?.[key] ?? pending[key] ?? fallback ?? '';

  const coupon = buyNow ? undefined : session.data.coupon;
  const discountCoupon = Number(coupon?.amount ?? 0);
  const subtotal = cartSubtotal(cart);
  const selCity = old?.city ?? pending.city ?? customer?.city ?? '';
  const shippingCost = shippingForCity(company, selCity);
  const grandTotal = subtotal - discountCoupon + shippingCost;
  const cookieRef = (jar.get(AFFILIATE_COOKIE)?.value ?? '').toUpperCase();
  const affiliateValue = old?.affiliate_code ?? (pending.affiliate_code || cookieRef);

  const lines = Object.values(cart);
  const pixel = {
    value: subtotal.toFixed(2),
    num_items: lines.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
    content_ids: lines.map((i) => String(i.product_id ?? '')).filter(Boolean),
  };

  return (
    <>
      <PageStyles pushed={['clientauth__checkout.1']} />

      <div className="co-topbar">
        <div className="container">
          <div className="co-topbar-inner">
            <StoreLink href="/" className="co-brand">AGA Collections</StoreLink>
            <span className="co-lock"><i className="ri-lock-2-line"></i> Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="co-steps-bar">
        <div className="container">
          <div className="co-steps">
            <div className="co-step done">
              <div className="co-step-num"><i className="ri-check-line" style={{ fontSize: '.7rem' }}></i></div>
              <span className="co-step-label">Cart</span>
            </div>
            <div className="co-step-sep"></div>
            <div className="co-step active">
              <div className="co-step-num">2</div>
              <span className="co-step-label">Details</span>
            </div>
            <div className="co-step-sep"></div>
            <div className="co-step">
              <div className="co-step-num">3</div>
              <span className="co-step-label">Confirm</span>
            </div>
          </div>
        </div>
      </div>

      <div className="co-page">
        <div className="co-body">
          <div className="container">
            <form action="/checkout/submit" method="POST" id="checkoutForm">
              {buyNow && <input type="hidden" name="buy_now" value="1" />}
              <div className="row g-4 align-items-start">
                <div className="col-lg-7">
                  <div className="co-notice">
                    {customer ? (
                      <>
                        <i className="ri-user-smile-line"></i>
                        <span>Checking out as <strong>{customer.full_name}</strong></span>
                      </>
                    ) : (
                      <>
                        <i className="ri-information-line"></i>
                        <span>You&apos;re not logged in. <StoreLink href="/customer/login">Sign in</StoreLink> for faster checkout.</span>
                      </>
                    )}
                  </div>

                  <div className="co-card">
                    <div className="co-card-hd">
                      <div className="co-card-num">1</div>
                      <span className="co-card-title">Contact Information</span>
                    </div>
                    <div className="co-card-body">
                      <div className="co-row-2">
                        <div className="co-field">
                          <label className="co-label">Full Name <span className="req">*</span></label>
                          <input type="text" name="full_name" className="co-input" defaultValue={val('full_name', customer?.full_name)} placeholder="Muhammad Ali" required maxLength={255} />
                        </div>
                        <div className="co-field">
                          <label className="co-label">Email Address <span className="req">*</span></label>
                          <input type="email" name="email" className="co-input" defaultValue={val('email', customer?.email)} placeholder="you@example.com" required maxLength={255} />
                        </div>
                      </div>

                      <div className="co-field mb-0">
                        <label className="co-label">Phone Number <span className="req">*</span></label>
                        <div className="co-phone-grid">
                          <span id="co_dial" className="co-dial-badge">+92</span>
                          <input id="co_phone_local" className="co-input" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="e.g. 03001234567 or 3001234567" maxLength={11} required />
                        </div>
                        <div className="co-phone-hint">Enter your 10-digit mobile number. The leading 0 is optional.</div>
                        <input type="hidden" name="phone" id="co_phone_full" />
                      </div>
                    </div>
                  </div>

                  <div className="co-card">
                    <div className="co-card-hd">
                      <div className="co-card-num">2</div>
                      <span className="co-card-title">Shipping Address</span>
                    </div>
                    <div className="co-card-body">
                      <div className="co-row-2">
                        <div className="co-field" style={{ display: 'none' }}>
                          <label className="co-label">Country <span className="req">*</span></label>
                          <input type="hidden" id="co_country" name="country" value="PK" />
                          <input type="text" className="co-input" value="Pakistan" disabled />
                        </div>

                        <div className="co-field">
                          <label className="co-label">City / Province <span className="req">*</span></label>
                          <CityPicker id="co_city" name="city" className="co-input" placeholder="Type your city…" defaultValue={val('city', customer?.city)} required maxLength={100}
                            cities={CITIES.flatMap(([, names]) => names)} />
                          <div style={{ fontSize: '.62rem', color: '#aaa', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <i className="ri-information-line"></i>
                            Not in the list? Just type your city name.
                          </div>
                        </div>
                      </div>

                      <div className="co-field">
                        <label className="co-label">Full Address <span className="req">*</span></label>
                        <input type="text" name="address" className="co-input" defaultValue={val('address', customer?.address)} placeholder="Street, building, area…" required maxLength={255} />
                      </div>

                      <div className="co-field">
                        <label className="co-label">Order Notes <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                        <textarea name="order_notes" className="co-textarea" placeholder="Delivery timing, special instructions…" maxLength={1000} defaultValue={val('order_notes')}></textarea>
                      </div>

                      {/* Hidden until AFFILIATE_LINKS_ENABLED=true */}
                      {env.affiliateLinksEnabled && (
                      <div className="co-field mb-0">
                        <label className="co-label">Referral Code <span style={{ color: '#bbb', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                        <input type="text" name="affiliate_code" className="co-input" defaultValue={affiliateValue} placeholder="e.g. SARA10" style={{ textTransform: 'uppercase' }} maxLength={32} />
                        {cookieRef && !old?.affiliate_code && (
                          <small style={{ color: 'var(--dc-muted, #6e6c80)', fontSize: '.72rem', display: 'block', marginTop: 4 }}>
                            <i className="ri-check-line"></i> Referral applied automatically.
                          </small>
                        )}
                      </div>
                      )}
                    </div>
                  </div>

                  <div className="co-card">
                    <div className="co-card-hd">
                      <div className="co-card-num">3</div>
                      <span className="co-card-title">Payment Method</span>
                    </div>
                    <div className="co-card-body">
                      <label className="co-pay-option">
                        <input type="radio" name="payment_method" value="cod" defaultChecked required />
                        <div>
                          <div className="co-pay-name">
                            <i className="ri-truck-line"></i>
                            {' '}Cash on Delivery
                          </div>
                          <div className="co-pay-desc">Pay cash when your order arrives at your door.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="co-summary-panel">
                    <div className="co-sp-header">
                      <i className="ri-shopping-bag-line" style={{ color: 'var(--dc-gold)' }}></i>
                      <span className="co-sp-header-title">Order Summary</span>
                    </div>

                    <div className="co-sp-items">
                      {Object.entries(cart).map(([key, item]) => {
                        const base = Number(item.price ?? 0);
                        const qty = Number(item.quantity ?? 1);
                        return (
                          <div className="co-sp-item" key={key}>
                            <div className="co-sp-img" style={{ position: 'relative' }}>
                              <img src={mediaUrl(item.image)} alt={item.name} />
                              <span className="co-sp-qty-badge">{qty}</span>
                            </div>
                            <div>
                              <div className="co-sp-name">{item.name}</div>
                              {Object.entries(item.variant_options ?? {}).map(([opt, v]) => (
                                <div className="co-sp-meta" key={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}: {String(v).toUpperCase()}</div>
                              ))}
                            </div>
                            <div className="co-sp-price">PKR {numberFormat(base * qty, 2)}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="co-sp-rows">
                      <div className="co-sp-row">
                        <span>Subtotal</span>
                        <span className="co-sp-row-val">PKR {numberFormat(subtotal, 2)}</span>
                      </div>
                      {discountCoupon > 0 && (
                        <div className="co-sp-row discount">
                          <span>Coupon ({coupon?.code ?? ''})</span>
                          <span className="co-sp-row-val">− PKR {numberFormat(discountCoupon, 2)}</span>
                        </div>
                      )}
                      <div className="co-sp-row ship">
                        <span>Shipping</span>
                        <span className="co-sp-row-val" id="shipping_display">
                          PKR {numberFormat(shippingCost, 2)}
                        </span>
                        <input type="hidden" name="shipping_amount" id="shipping_amount" value={shippingCost} />
                      </div>
                    </div>

                    <div className="co-sp-divider"></div>

                    <div className="co-sp-total">
                      <span className="co-sp-total-label">Total</span>
                      <span className="co-sp-total-val" id="total_display">
                        PKR {numberFormat(grandTotal, 2)}
                      </span>
                    </div>
                    <div className="co-sp-total-note">Taxes &amp; duties included where applicable.</div>

                    <p className="co-terms-note">
                      By placing your order, you agree to our{' '}
                      <StoreLink href="/policy/terms" target="_blank">Terms</StoreLink>
                      {' '}&amp;{' '}
                      <StoreLink href="/policy/privacy" target="_blank">Privacy Policy</StoreLink>.
                    </p>

                    <button type="submit" id="placeOrderBtn" className="co-place-btn">
                      <span id="placeOrderSpinner" style={{ display: 'none', width: 16, height: 16, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'co-spin .7s linear infinite', flexShrink: 0 }}></span>
                      <i className="ri-lock-2-fill" id="placeOrderIcon"></i>
                      <span id="placeOrderText">Complete My Order</span>
                    </button>

                    <StoreLink href="/cart" className="co-back-btn">
                      <i className="ri-arrow-left-s-line"></i> Return to Cart
                    </StoreLink>

                    <div className="co-cod-trust">
                      <i className="ri-truck-line"></i>
                      <div className="co-cod-trust-text">
                        <strong>Cash on Delivery</strong>
                        {' '}Pay when your order arrives. No advance payment needed.
                      </div>
                    </div>

                    <div className="co-sp-secure">
                      <i className="ri-shield-check-line lock"></i>
                      <div className="co-sp-secure-text">Your personal &amp; order data is fully encrypted and never shared.</div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div id="cart-loading-overlay" style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(242,243,245,.9)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        <div className="co-spinner"></div>
        <span style={{ fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase', color: '#999' }}>Please wait…</span>
      </div>

      <CheckoutInteractions
        shippingMode={company?.shipping_mode ?? 'flat'}
        rates={(company?.shipping_charges ?? {}) as Record<string, number>}
        cityZones={CITY_ZONES}
        freeShipEnabled={Boolean(company?.free_shipping_enabled)}
        freeShipThreshold={Number(company?.free_shipping_threshold ?? 0)}
        subtotal={subtotal}
        discount={discountCoupon}
        customerPhone={customer?.phone ?? ''}
        pixel={pixel}
      />
    </>
  );
}
