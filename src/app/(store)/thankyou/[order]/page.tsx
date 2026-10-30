// resources/views/thankyou.blade.php
import { notFound } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { formatDate, numberFormat, plural, ucfirst } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { getSession } from '@/lib/session';
import { buildMetadata } from '@/lib/seo';
import { PageStyles } from '@/components/store/LegacyStyles';
import PurchasePixel from '@/components/store/PurchasePixel';
import { Customer } from '@/models/Customer';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Session } from '@/models/Session';
import { getCompanySetting } from '@/services/settings';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'thankyou' });
}

const karachi = (d: Date) => new Date(d.getTime() + 5 * 3600 * 1000);

export default async function ThankYouPage({ params }: { params: Promise<{ order: string }> }) {
  const id = Number((await params).order);
  if (!Number.isInteger(id)) notFound();
  await connectDb();
  const [order, session, me, company] = await Promise.all([Order.findById(id).lean(), getSession(), getCurrentCustomer(), getCompanySetting()]);
  if (!order) notFound();

  // The page shows the customer's name, phone and address, and order numbers are
  // sequential: only the browser that placed the order, or its signed-in owner, may see it
  const mine = (session.data.zq_order_access ?? []).map(Number).includes(order._id);
  const owner = Boolean(me && order.customer_id === me._id && !order.guest);
  if (!mine && !owner) notFound();

  // Purchase pixel only on the first view right after checkout
  const firePurchase = session.data.just_purchased_order_id === order._id;
  if (session.id) {
    await Session.updateOne({ _id: session.id }, {
      $unset: { 'data.cart': 1, 'data.coupon': 1, 'data.pending_checkout_data': 1, 'data.pending_cart_data': 1, 'data.just_purchased_order_id': 1 },
    });
  }

  const brand = company?.name ?? 'AGA Collections';
  const cust = await Customer.findById(order.customer_id).lean();
  const firstName = ((order.shipping_name || cust?.full_name || '').split(' ')[0] ?? '').trim() || null;
  const shipName = order.shipping_name || cust?.full_name;
  const shipPhone = order.shipping_phone || cust?.phone;
  const shipAddr = order.shipping_address || cust?.address;
  const shipCity = order.shipping_city || cust?.city;
  const waNum = (company?.whatsapps?.[0] ?? '').replace(/\D+/g, '');
  const waText = `Hi ${brand}, I have a question about my order #${order._id}.`;
  const itemCount = order.items.reduce((s, i) => s + Number(i.quantity), 0);
  const products = await Product.find({ _id: { $in: order.items.map((i) => i.product_id) } }).lean();
  const byId = new Map(products.map((p) => [p._id, p]));
  const status = order.status ?? 'pending';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1) === 'Pending' ? 'Received' : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <>
      <PageStyles pushed={['thankyou.1']} />
      <div className="ty-page">
        <div className="ty-wrap">
          <div className="ty-hero">
            <div className="ty-check" aria-hidden="true"><i className="ri-check-line"></i></div>
            <p className="ty-eyebrow">Order confirmed</p>
            <h1 className="ty-title">Thank you{firstName ? ', ' + ucfirst(firstName) : ''}!</h1>
            <p className="ty-lead">We&apos;ve received your order and our team is getting it ready. We may call or WhatsApp you to confirm it before dispatch.</p>
            <div className="ty-pill">Order <strong>#{order._id}</strong> · {formatDate(karachi(order.created_at), 'd M Y, h:i A')}</div>
          </div>

          <div className="ty-grid">
            <div>
              <section className="ty-box" aria-labelledby="ty-items-title">
                <div className="ty-box-hd">
                  <h2 id="ty-items-title">Your order</h2>
                  <span>{itemCount} {plural('item', itemCount)}</span>
                </div>
                <div className="ty-box-bd">
                  {order.items.map((item) => {
                    const p = byId.get(item.product_id);
                    const variant = item.variant_id ? p?.variants.find((v) => v._id === item.variant_id) : null;
                    const opts = Object.entries(variant?.option_values ?? {}).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(' · ');
                    const primary = p?.images.find((i) => i.is_primary);
                    return (
                      <div className="ty-item" key={item._id}>
                        {p && primary
                          ? <img src={mediaUrl(primary.image_path)} alt={p.name} width={64} height={80} loading="lazy" />
                          : <span className="ph" aria-hidden="true"></span>}
                        <div>
                          {p
                            ? <StoreLink className="ty-item-name" href={`/product/${p.slug}`}>{p.name}</StoreLink>
                            : <span className="ty-item-name">Product #{item.product_id}</span>}
                          {opts && <div className="ty-item-opts">{opts}</div>}
                          <div className="ty-item-qty">{item.quantity} × PKR {numberFormat(item.price)}</div>
                        </div>
                        <div className="ty-item-price">PKR {numberFormat(item.total || item.price * item.quantity)}</div>
                      </div>
                    );
                  })}

                  <div className="ty-rows">
                    <div className="ty-row"><span>Subtotal</span><span>PKR {numberFormat(order.subtotal)}</span></div>
                    <div className="ty-row"><span>Delivery</span><span>{Number(order.shipping) > 0 ? 'PKR ' + numberFormat(order.shipping) : 'Free'}</span></div>
                    {Number(order.discount) > 0 && (
                      <div className="ty-row"><span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span><span>− PKR {numberFormat(order.discount)}</span></div>
                    )}
                    <div className="ty-row total"><span>Total to pay on delivery</span><span>PKR {numberFormat(order.total)}</span></div>
                  </div>
                </div>
              </section>
            </div>

            <div>
              <section className="ty-box" aria-labelledby="ty-details-title">
                <div className="ty-box-hd"><h2 id="ty-details-title">Order details</h2></div>
                <div className="ty-box-bd">
                  <div className="ty-meta">
                    <div><small>Order no.</small><b>#{order._id}</b></div>
                    <div><small>Payment</small><b>Cash on Delivery</b></div>
                    <div><small>Status</small><b>{statusLabel}</b></div>
                    <div><small>Total</small><b>PKR {numberFormat(order.total)}</b></div>
                  </div>
                  {(shipName || shipAddr) && (
                    <div className="ty-addr">
                      <strong>Delivering to</strong><br />
                      {shipName}{shipPhone ? ` · ${shipPhone}` : ''}<br />
                      {shipAddr}{shipCity ? `, ${shipCity}` : ''}
                    </div>
                  )}
                </div>
              </section>

              <section className="ty-box" aria-labelledby="ty-next-title">
                <div className="ty-box-hd"><h2 id="ty-next-title">What happens next</h2></div>
                <div className="ty-box-bd">
                  <ol className="ty-steps">
                    <li><span className="n done" aria-hidden="true"><i className="ri-check-line"></i></span><div><b>Order received</b><span>Your order is in. A confirmation email is on its way if you gave us your email.</span></div></li>
                    <li><span className="n" aria-hidden="true">2</span><div><b>We confirm and pack it</b><span>We may call or WhatsApp you to confirm, then pack and dispatch your order.</span></div></li>
                    <li><span className="n" aria-hidden="true">3</span><div><b>Delivered to your door</b><span>2–4 working days to Karachi, Lahore and Islamabad; 4–6 to other cities. Pay the courier in cash.</span></div></li>
                  </ol>
                </div>
              </section>
            </div>
          </div>

          <div className="ty-actions">
            <StoreLink href="/shop" className="ty-btn primary"><i className="ri-shopping-bag-line"></i> Continue shopping</StoreLink>
            {me ? (
              <StoreLink href={`/customer/orders/${order._id}`} className="ty-btn ghost"><i className="ri-file-list-3-line"></i> View my order</StoreLink>
            ) : waNum ? (
              <StoreLink href={`https://wa.me/${waNum}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" className="ty-btn ghost"><i className="ri-whatsapp-line"></i> Questions? WhatsApp us</StoreLink>
            ) : null}
          </div>
        </div>
      </div>
      {firePurchase && <PurchasePixel orderId={order._id} value={Number(order.total).toFixed(2)} />}
    </>
  );
}
