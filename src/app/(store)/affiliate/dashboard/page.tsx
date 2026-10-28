// clientside/zayqora/affiliate/dashboard.blade.php and pending.blade.php
import { redirect } from 'next/navigation';
import { connectDb } from '@/lib/db';
import { peekFlash } from '@/lib/flash';
import { formatDate, numberFormat, rateLabel, ucfirst } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import AffiliateCopyButtons from '@/components/store/AffiliateCopyButtons';
import { requireCustomer } from '@/components/store/AccountShell';
import { PageStyles } from '@/components/store/LegacyStyles';
import { Affiliate } from '@/models/Affiliate';
import { affiliateActivity, affiliateTotals, effectiveRate, referralUrl } from '@/services/affiliate';
import { getCompanySetting } from '@/services/settings';


export async function generateMetadata() {
  return buildMetadata({ page: 'dashboard', metaTitle: 'Affiliate Dashboard' });
}

export default async function AffiliateDashboardPage() {
  const customer = await requireCustomer('/affiliate/dashboard');
  await connectDb();
  const affiliate = await Affiliate.findOne({ customer_id: customer._id }).lean();
  if (!affiliate) redirect('/affiliate/apply');

  if (affiliate.status !== 'approved') {
    return (
      <>
        <PageStyles inline={['clientside__zayqora__affiliate__pending.1']} />
        <div className="aff-pending-page">
          <div className="aff-pending-card">
            <div className="ico"><i className="ri-time-line"></i></div>
            {affiliate.status === 'rejected' ? (
              <>
                <h1>Application Not Approved</h1>
                <p className="sub">Unfortunately your application could not be approved at this time.</p>
                <span className="aff-status-pill aff-status-rejected">Rejected</span>
                {affiliate.admin_note && <p className="sub" style={{ marginTop: 18 }}><strong>Note:</strong> {affiliate.admin_note}</p>}
              </>
            ) : (
              <>
                <h1>Application Received</h1>
                <p className="sub">Thanks for applying! We&apos;re reviewing your details and will notify you within 1–2 days. Once approved, your dashboard will unlock here automatically.</p>
                <span className="aff-status-pill aff-status-pending">Pending Review</span>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  const [setting, totals, activity, rate, flash] = await Promise.all([
    getCompanySetting(), affiliateTotals(affiliate._id), affiliateActivity(affiliate._id), effectiveRate(affiliate), peekFlash(),
  ]);
  const minWith = Math.trunc(Number(setting?.affiliate_min_withdrawal ?? 1000));
  const available = totals.available;
  const canRequest = available >= minWith;

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__affiliate__dashboard.1']} />
      <div className="aff-dash">
        <div className="aff-dash-wrap">
          <h1>Affiliate Dashboard</h1>
          <p className="aff-dash-sub">Hi {affiliate.full_name} — here&apos;s everything you&apos;ve earned.</p>

          {flash?.type === 'success' && <div style={{ background: '#ecfdf5', color: '#065f46', borderLeft: '3px solid #10b981', padding: '12px 18px', marginBottom: 18, fontSize: '.9rem' }}>{flash.text}</div>}
          {flash?.type === 'error' && <div style={{ background: '#fef2f2', color: '#991b1b', borderLeft: '3px solid #ef4444', padding: '12px 18px', marginBottom: 18, fontSize: '.9rem' }}>{flash.text}</div>}

          <div className="aff-stats">
            <div className="aff-stat"><div className="lbl">Total Earned</div><div className="val">PKR {numberFormat(totals.totalEarned, 0)}</div><div className="sub">Lifetime (available + paid)</div></div>
            <div className="aff-stat"><div className="lbl">Pending</div><div className="val">PKR {numberFormat(totals.pending, 0)}</div><div className="sub">Awaiting delivery</div></div>
            <div className="aff-stat"><div className="lbl">Available</div><div className="val accent">PKR {numberFormat(available, 0)}</div><div className="sub">Ready to withdraw</div></div>
            <div className="aff-stat"><div className="lbl">Paid Out</div><div className="val">PKR {numberFormat(totals.paid, 0)}</div><div className="sub">Already received</div></div>
          </div>

          <div className="aff-share-card">
            <h3>Your Referral Link &amp; Code</h3>
            <div className="aff-share-row">
              <label>Code</label>
              <input className="aff-share-input" id="affCode" defaultValue={affiliate.referral_code} readOnly />
              <button className="aff-copy-btn" data-copy="#affCode">Copy</button>
            </div>
            <div className="aff-share-row">
              <label>Link</label>
              <input className="aff-share-input" id="affLink" defaultValue={referralUrl(affiliate.referral_code)} readOnly />
              <button className="aff-copy-btn" data-copy="#affLink">Copy</button>
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--dc-muted)', margin: '10px 0 0' }}>Commission rate: <strong>{rateLabel(rate)}%</strong> &middot; Cookie window: <strong>{setting?.affiliate_cookie_days ?? 30} days</strong></p>
          </div>

          <div className="aff-share-card">
            <h3>Withdraw Earnings</h3>
            <form method="POST" action="/affiliate/withdraw" data-confirm={`Request withdrawal of PKR ${numberFormat(available, 2)}? Payment will arrive in 2-3 working days.`}>
              <div className="aff-withdraw-form">
                <div className="aff-withdraw-amt">PKR {numberFormat(available, 2)}</div>
                <button type="submit" className="aff-withdraw-btn" disabled={!canRequest}>Request Withdrawal</button>
                <span className="aff-withdraw-note">
                  {canRequest
                    ? `Sent to your ${ucfirst(affiliate.payment_method)} (${affiliate.payment_account_number ?? ''})`
                    : `Minimum withdrawal: PKR ${numberFormat(minWith)}`}
                </span>
              </div>
            </form>
          </div>

          <div className="aff-table-card">
            <h3>Recent Orders ({activity.orders.length})</h3>
            <table className="aff-table">
              <thead>
                <tr><th>Order #</th><th>Date</th><th>Order Total</th><th>Commission</th><th>Status</th></tr>
              </thead>
              <tbody>
                {activity.orders.length ? activity.orders.map(({ order, commission }) => {
                  const cs = commission?.status ?? 'pending';
                  return (
                    <tr key={order._id}>
                      <td>#{order._id}</td>
                      <td>{formatDate(order.created_at, 'd M Y')}</td>
                      <td>PKR {numberFormat(order.total, 0)}</td>
                      <td>PKR {numberFormat(commission?.commission_amount ?? 0, 0)}</td>
                      <td><span className={`pill ${cs}`}>{cs}</span></td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={5} className="empty">No referred orders yet — share your link to get started!</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="aff-table-card">
            <h3>Withdrawals History</h3>
            <table className="aff-table">
              <thead>
                <tr><th>Date</th><th>Method</th><th>Amount</th><th>Status</th><th>Paid On</th></tr>
              </thead>
              <tbody>
                {activity.withdrawals.length ? activity.withdrawals.map((w) => (
                  <tr key={w._id}>
                    <td>{formatDate(w.created_at, 'd M Y')}</td>
                    <td>{ucfirst(w.payment_method)}</td>
                    <td>PKR {numberFormat(w.amount, 0)}</td>
                    <td><span className={`pill ${w.status}`}>{w.status}</span></td>
                    <td>{w.paid_at ? formatDate(w.paid_at, 'd M Y') : '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="empty">No withdrawals yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AffiliateCopyButtons />
    </>
  );
}
