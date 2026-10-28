// db-page layout with clientauth/dashboard/customer-sidebar.blade.php
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentCustomer, type CurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { rememberIntended } from '@/lib/form-state';
import { Affiliate } from '@/models/Affiliate';
import StoreLink from './StoreLink';

export type AccountTab = 'dashboard' | 'orders' | 'wishlist' | 'profile' | 'affiliate';

/** auth:customer middleware: guests go to the sign-in page and come back afterwards */
export async function requireCustomer(path: string): Promise<CurrentCustomer> {
  const c = await getCurrentCustomer();
  if (!c) {
    await rememberIntended(path);
    redirect('/customer/login');
  }
  return c;
}

export default async function AccountShell({ customer, active, children }: { customer: CurrentCustomer; active: AccountTab; children: ReactNode }) {
  await connectDb();
  const affiliate = await Affiliate.findOne({ customer_id: customer._id }).select('status').lean();
  const parts = (customer.full_name ?? 'User').trim().split(' ');
  const initials = (parts[0]?.slice(0, 1) ?? '').toUpperCase() + (parts[1] ? parts[1].slice(0, 1).toUpperCase() : '');
  const cls = (tab: AccountTab) => `dbs-nav-link ${active === tab ? 'is-active' : ''}`;

  return (
    <div className="db-page">
      <div className="container">
        <div className="db-wrap">
          <aside className="db-col-side">
            <div className="dbs">
              <div className="dbs-top">
                <div className="dbs-avatar">{initials}</div>
                <div>
                  <div className="dbs-name">{customer.full_name}</div>
                  <div className="dbs-email">{customer.email}</div>
                </div>
              </div>

              <nav className="dbs-nav">
                <StoreLink href="/customer/dashboard" className={cls('dashboard')}><i className="ri-layout-grid-line"></i> Overview</StoreLink>
                <StoreLink href="/customer/orders" className={cls('orders')}><i className="ri-shopping-bag-line"></i> My Orders</StoreLink>
                <StoreLink href="/wishlist" className={cls('wishlist')}><i className="ri-heart-line"></i> Wishlist</StoreLink>
                <StoreLink href="/customer/profile/edit" className={cls('profile')}><i className="ri-user-settings-line"></i> Profile</StoreLink>
                {/* Hidden until AFFILIATE_LINKS_ENABLED=true */}
                {env.affiliateLinksEnabled && (affiliate?.status === 'approved' ? (
                  <StoreLink href="/affiliate/dashboard" className={cls('affiliate')}><i className="ri-hand-coin-line"></i> Affiliate Dashboard</StoreLink>
                ) : (
                  <StoreLink href={affiliate ? '/affiliate/apply' : '/affiliate'} className={cls('affiliate')}>
                    <i className="ri-hand-coin-line"></i> {affiliate ? 'Affiliate Status' : 'Become an Affiliate'}
                  </StoreLink>
                ))}
              </nav>

              <div className="dbs-foot">
                <form action="/customer/logout" method="POST">
                  <button type="submit" className="dbs-logout-btn">
                    <i className="ri-logout-box-r-line"></i> Sign Out
                  </button>
                </form>
              </div>
            </div>
          </aside>
          {children}
        </div>
      </div>
    </div>
  );
}

export const paymentLabel = (m?: string | null) =>
  (m ?? 'cod') === 'cod' ? 'Cash on Delivery' : String(m).replace(/[_-]/g, ' ').replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase());

export const statusLabel = (s?: string | null) => {
  const v = s ?? 'Pending';
  return v.charAt(0).toUpperCase() + v.slice(1);
};
