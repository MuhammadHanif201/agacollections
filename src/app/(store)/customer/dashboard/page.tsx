// clientauth/dashboard/index.blade.php
import { connectDb } from '@/lib/db';
import { formatDate, numberFormat } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import AccountShell, { requireCustomer, statusLabel } from '@/components/store/AccountShell';
import { PageStyles } from '@/components/store/LegacyStyles';
import { Order, accountOrders } from '@/models/Order';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'dashboard' });
}

export default async function DashboardPage() {
  const customer = await requireCustomer('/customer/dashboard');
  await connectDb();
  const [orders, totalOrders] = await Promise.all([
    Order.find(accountOrders(customer._id)).sort({ created_at: -1, _id: 1 }).limit(3).lean(),
    Order.countDocuments(accountOrders(customer._id)),
  ]);

  return (
    <>
      <PageStyles pushed={['clientauth__dashboard__customer-sidebar.1', 'clientauth__dashboard__index.1']} />
      <AccountShell customer={customer} active="dashboard">
        <div className="db-col-main">
          <div className="db-ph">
            <span className="db-ph-ey">My Account</span>
            <h1>Welcome back, {customer.full_name.split(' ')[0]}</h1>
          </div>

          <div className="dbi-stats">
            <div className="dbi-stat">
              <div className="dbi-stat-icon"><i className="ri-shopping-bag-line"></i></div>
              <div className="dbi-stat-body">
                <div className="dbi-stat-num">{totalOrders}</div>
                <div className="dbi-stat-lbl">Total Orders</div>
              </div>
            </div>
            <div className="dbi-stat">
              <div className="dbi-stat-icon"><i className="ri-map-pin-line"></i></div>
              <div className="dbi-stat-body">
                <div className="dbi-stat-num">{customer.city ?? '—'}</div>
                <div className="dbi-stat-lbl">City</div>
              </div>
            </div>
            <div className="dbi-stat">
              <div className="dbi-stat-icon"><i className="ri-shield-check-line"></i></div>
              <div className="dbi-stat-body">
                <div className="dbi-stat-num" style={{ color: '#22c55e', fontSize: '.85rem' }}>Active</div>
                <div className="dbi-stat-lbl">Account Status</div>
              </div>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hd">
              <span className="db-card-title">Account Information</span>
              <StoreLink href="/customer/profile/edit" className="db-btn db-btn-outline db-btn-sm">
                <i className="ri-edit-line"></i> Edit
              </StoreLink>
            </div>
            <div className="db-card-body">
              <div className="dbi-info-grid">
                <div className="dbi-info-item"><span className="dbi-info-lbl">Full Name</span><span className="dbi-info-val">{customer.full_name}</span></div>
                <div className="dbi-info-item"><span className="dbi-info-lbl">Email Address</span><span className="dbi-info-val">{customer.email}</span></div>
                <div className="dbi-info-item"><span className="dbi-info-lbl">Mobile</span><span className="dbi-info-val" dir="ltr">{customer.phone ?? '—'}</span></div>
                <div className="dbi-info-item"><span className="dbi-info-lbl">City</span><span className="dbi-info-val">{customer.city ?? '—'}</span></div>
                {customer.address && (
                  <div className="dbi-info-item" style={{ gridColumn: '1/-1' }}>
                    <span className="dbi-info-lbl">Delivery Address</span>
                    <span className="dbi-info-val">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hd">
              <span className="db-card-title">Recent Orders</span>
              <StoreLink href="/customer/orders" className="db-btn db-btn-outline db-btn-sm">View All</StoreLink>
            </div>
            {orders.length === 0 ? (
              <div className="db-empty">
                <i className="ri-shopping-bag-line"></i>
                <div className="db-empty-title">No orders yet</div>
                <p>Your orders will appear here once you shop with us.</p>
                <StoreLink href="/" className="db-btn db-btn-dark" style={{ marginTop: 16, display: 'inline-flex' }}>
                  <i className="ri-store-line"></i> Browse Collection
                </StoreLink>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="db-table">
                  <thead>
                    <tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td><strong>#{order._id}</strong></td>
                        <td style={{ color: 'var(--dc-muted)', fontSize: '.78rem' }}>{formatDate(order.created_at, 'd M Y')}</td>
                        <td>
                          <span className={`db-badge ${(order.status ?? 'pending').toLowerCase()}`}>
                            <span className="db-badge-dot"></span>
                            {' '}{statusLabel(order.status)}
                          </span>
                        </td>
                        <td><strong>PKR {numberFormat(order.total, 2)}</strong></td>
                        <td>
                          <StoreLink href={`/customer/orders/${order._id}`} className="db-btn db-btn-outline db-btn-sm">
                            <i className="ri-eye-line"></i> View
                          </StoreLink>
                        </td>
                      </tr>
                    ))}
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
