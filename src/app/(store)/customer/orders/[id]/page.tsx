// clientauth/dashboard/order-show.blade.php
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import { connectDb } from '@/lib/db';
import { formatDate, numberFormat } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { buildMetadata } from '@/lib/seo';
import AccountShell, { paymentLabel, requireCustomer, statusLabel } from '@/components/store/AccountShell';
import { PageStyles } from '@/components/store/LegacyStyles';
import { Customer } from '@/models/Customer';
import { Order, accountOrders, orderContact } from '@/models/Order';
import { Product } from '@/models/Product';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'dashboard' });
}

const karachi = (d: Date) => new Date(d.getTime() + 5 * 3600 * 1000);

export default async function OrderShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await requireCustomer(`/customer/orders/${id}`);
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();
  await connectDb();
  const order = await Order.findOne({ _id: orderId, ...accountOrders(customer._id) }).lean();
  if (!order) notFound();
  const [products, account] = await Promise.all([
    Product.find({ _id: { $in: order.items.map((i) => i.product_id) } }).lean(),
    Customer.findById(order.customer_id).lean(),
  ]);
  const byId = new Map(products.map((p) => [p._id, p]));
  const contact = orderContact(order, account);
  const productTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivered = ['completed', 'delivered'].includes((order.status ?? '').toLowerCase());

  return (
    <>
      <PageStyles pushed={['clientauth__dashboard__customer-sidebar.1', 'clientauth__dashboard__order-show.1']} />
      <AccountShell customer={customer} active="orders">
        <div className="db-col-main">
          <div className="db-ph" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className="db-ph-ey">Order Detail</span>
              <h1>Order #{order._id}</h1>
            </div>
            <StoreLink href="/customer/orders" className="db-btn db-btn-outline db-btn-sm">
              <i className="ri-arrow-left-s-line"></i> Back to Orders
            </StoreLink>
          </div>

          <div className="dos-meta">
            <div className="dos-meta-item">
              <span className="dos-meta-lbl">Placed on</span>
              <span className="dos-meta-val">{formatDate(karachi(order.created_at), 'd M Y, h:i A')}</span>
            </div>
            <div className="dos-meta-item">
              <span className="dos-meta-lbl">Payment</span>
              <span className="dos-meta-val">{paymentLabel(order.payment_method)}</span>
            </div>
            <div className="dos-meta-item">
              <span className="dos-meta-lbl">Status</span>
              <span className={`db-badge ${(order.status ?? 'pending').toLowerCase()}`}>
                <span className="db-badge-dot"></span>
                {' '}{statusLabel(order.status)}
              </span>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hd"><span className="db-card-title">Items Ordered</span></div>
            <div style={{ overflowX: 'auto' }}>
              <table className="db-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Product</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const product = byId.get(item.product_id);
                    const primary = product?.images.find((i) => i.is_primary);
                    const variant = item.variant_id ? product?.variants.find((v) => v._id === item.variant_id) : null;
                    const varOpts = Object.entries(variant?.option_values ?? {});
                    return (
                      <tr key={item._id}>
                        <td>
                          <div className="dos-product">
                            {primary
                              ? <img src={mediaUrl(primary.image_path)} alt={product?.name} className="dos-product-img" loading="lazy" />
                              : <div className="dos-product-img dos-img-placeholder"><i className="ri-image-line"></i></div>}
                            <div>
                              <div className="dos-product-name">{product?.name ?? `Product #${item.product_id}`}</div>
                              {product && delivered && (
                                <StoreLink href={`/product/${product.slug}#write-review`} className="dos-review-link">
                                  <i className="ri-star-line"></i> Write a review
                                </StoreLink>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '.78rem', color: 'var(--dc-muted)' }}>
                          {varOpts.length ? varOpts.map(([k, v]) => (
                            <Fragment key={k}><span>{k.charAt(0).toUpperCase() + k.slice(1)}: {v}</span><br /></Fragment>
                          )) : '—'}
                        </td>
                        <td>{item.quantity}</td>
                        <td>PKR {numberFormat(item.price, 2)}</td>
                        <td><strong>PKR {numberFormat(item.total ?? item.price * item.quantity, 2)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dos-bottom">
            <div className="db-card" style={{ marginBottom: 0 }}>
              <div className="db-card-hd"><span className="db-card-title">Delivery Details</span></div>
              <div className="db-card-body">
                <div className="dos-info-row"><span className="dos-info-lbl">Name</span><span>{contact.name ?? '—'}</span></div>
                <div className="dos-info-row"><span className="dos-info-lbl">Phone</span><span dir="ltr">{contact.phone ?? '—'}</span></div>
                <div className="dos-info-row"><span className="dos-info-lbl">City</span><span>{contact.city ?? '—'}</span></div>
                <div className="dos-info-row"><span className="dos-info-lbl">Address</span><span>{contact.address ?? '—'}</span></div>
              </div>
            </div>

            <div className="db-card" style={{ marginBottom: 0 }}>
              <div className="db-card-hd"><span className="db-card-title">Order Summary</span></div>
              <div className="db-card-body" style={{ padding: 0 }}>
                <table className="db-table">
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--dc-muted)', fontSize: '.8rem' }}>Products Total</td>
                      <td style={{ textAlign: 'right' }}>PKR {numberFormat(productTotal, 2)}</td>
                    </tr>
                    {order.discount > 0 && (
                      <tr>
                        <td style={{ color: '#15803d', fontSize: '.8rem' }}>
                          Discount {order.coupon_code && <span style={{ fontSize: '.7rem' }}>({order.coupon_code})</span>}
                        </td>
                        <td style={{ textAlign: 'right', color: '#15803d' }}>− PKR {numberFormat(order.discount, 2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ color: 'var(--dc-muted)', fontSize: '.8rem' }}>Shipping</td>
                      <td style={{ textAlign: 'right' }}>
                        {order.shipping > 0 ? `PKR ${numberFormat(order.shipping, 2)}` : <span style={{ color: '#15803d' }}>Free</span>}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, paddingTop: 16 }}>Total</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--dc-gold)', fontSize: '1rem', paddingTop: 16 }}>PKR {numberFormat(order.total, 2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </AccountShell>
    </>
  );
}
