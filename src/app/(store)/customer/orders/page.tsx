// clientauth/dashboard/orders.blade.php
import { connectDb } from '@/lib/db';
import { formatDate, numberFormat } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import AccountShell, { paymentLabel, requireCustomer, statusLabel } from '@/components/store/AccountShell';
import { PageStyles } from '@/components/store/LegacyStyles';
import { Order, accountOrders } from '@/models/Order';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'dashboard' });
}

export default async function OrdersPage() {
  const customer = await requireCustomer('/customer/orders');
  await connectDb();
  const orders = await Order.find(accountOrders(customer._id)).sort({ created_at: -1, _id: 1 }).lean();

  return (
    <>
      <PageStyles pushed={['clientauth__dashboard__customer-sidebar.1']} />
      <AccountShell customer={customer} active="orders">
        <div className="db-col-main">
          <div className="db-ph">
            <span className="db-ph-ey">Account</span>
            <h1>My Orders</h1>
          </div>

          <div className="db-card">
            <div className="db-card-hd">
              <span className="db-card-title">
                Order History
                {orders.length > 0 && <span style={{ fontWeight: 400, color: 'var(--dc-muted)', marginLeft: 8 }}>({orders.length})</span>}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="db-empty">
                <i className="ri-shopping-bag-line"></i>
                <div className="db-empty-title">No orders yet</div>
                <p>Once you place an order it will appear here.</p>
                <StoreLink href="/" className="db-btn db-btn-dark" style={{ marginTop: 16, display: 'inline-flex' }}>
                  <i className="ri-store-line"></i> Browse Collection
                </StoreLink>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="db-table">
                  <thead>
                    <tr><th>Order #</th><th>Date</th><th>Items</th><th>Status</th><th>Payment</th><th>Total</th><th></th></tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const qty = order.items.reduce((s, i) => s + Number(i.quantity), 0);
                      return (
                        <tr key={order._id}>
                          <td><strong>#{order._id}</strong></td>
                          <td style={{ color: 'var(--dc-muted)', fontSize: '.78rem', whiteSpace: 'nowrap' }}>{formatDate(order.created_at, 'd M Y')}</td>
                          <td style={{ color: 'var(--dc-muted)', fontSize: '.8rem' }}>{qty} item{qty !== 1 ? 's' : ''}</td>
                          <td>
                            <span className={`db-badge ${(order.status ?? 'pending').toLowerCase()}`}>
                              <span className="db-badge-dot"></span>
                              {' '}{statusLabel(order.status)}
                            </span>
                          </td>
                          <td style={{ fontSize: '.78rem', color: 'var(--dc-muted)' }}>{paymentLabel(order.payment_method)}</td>
                          <td><strong>PKR {numberFormat(order.total, 2)}</strong></td>
                          <td>
                            <StoreLink href={`/customer/orders/${order._id}`} className="db-btn db-btn-outline db-btn-sm">
                              <i className="ri-eye-line"></i> View
                            </StoreLink>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AccountShell>
    </>
  );
}
