// clientside/zayqora/affiliate/info.blade.php
import { getCurrentCustomer } from '@/lib/auth';
import { numberFormat, rateLabel } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { PageStyles } from '@/components/store/LegacyStyles';
import { getCompanySetting } from '@/services/settings';

export async function generateMetadata() {
  return buildMetadata({ page: 'default', metaTitle: 'Affiliate Program', metaDesc: 'Earn commission on every sale. Share AGA Collections with your audience and get paid.' });
}


export default async function AffiliateInfoPage() {
  const [setting, customer] = await Promise.all([getCompanySetting(), getCurrentCustomer()]);
  const days = setting?.affiliate_cookie_days ?? 30;

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__affiliate__info.1']} />
      <div className="aff-page">
        <div className="aff-container">
          <div className="aff-hero">
            <h1>Earn With AGA Collections</h1>
            <p>Share what you love, earn real money. Refer friends, followers, or anyone who shops with us — and we&apos;ll send you commission on every order. No stock, no shipping, no hassle.</p>
            <div className="aff-cta-row">
              <a href="/affiliate/apply" className="aff-cta aff-cta-primary">Apply Now <i className="ri-arrow-right-line"></i></a>
              {customer && <a href="/affiliate/dashboard" className="aff-cta aff-cta-ghost">My Dashboard</a>}
            </div>
          </div>

          <div className="aff-steps">
            <div className="aff-step">
              <div className="aff-step-num">1.</div>
              <h4>Apply</h4>
              <p>Fill a short form with your name, phone and payout details. We&apos;ll review and approve quickly.</p>
            </div>
            <div className="aff-step">
              <div className="aff-step-num">2.</div>
              <h4>Get your link &amp; code</h4>
              <p>You receive a personal referral link and short code (e.g. SARA10).</p>
            </div>
            <div className="aff-step">
              <div className="aff-step-num">3.</div>
              <h4>Share anywhere</h4>
              <p>Post on WhatsApp, Instagram, TikTok — or just tell a friend the code.</p>
            </div>
            <div className="aff-step">
              <div className="aff-step-num">4.</div>
              <h4>Earn commission</h4>
              <p>When they buy, you earn. Withdraw to JazzCash, EasyPaisa or Bank.</p>
            </div>
          </div>

          <div className="aff-section">
            <h2>How earnings work</h2>
            <ul className="aff-list">
              <li><strong>Default commission:</strong>{` ${rateLabel(Number(setting?.affiliate_default_rate ?? 8))}% of every order placed through your link or code.`}</li>
              <li><strong>Cookie window:</strong>{` if a customer clicks your link, you're credited for any purchase they make within the next ${days} days.`}</li>
              <li><strong>Pending → Available:</strong> commission becomes withdrawable once the order is delivered and confirmed.</li>
              <li><strong>Returns:</strong> if a customer returns the order, the commission is automatically cancelled.</li>
              <li><strong>Minimum withdrawal:</strong>{` PKR ${numberFormat(Number(setting?.affiliate_min_withdrawal ?? 1000))}. Payments sent within 2–3 working days.`}</li>
            </ul>
          </div>

          <div className="aff-section">
            <h2>Frequently asked</h2>
            <div className="aff-faq">
              <details>
                <summary>Do I need to pay anything to join?</summary>
                <p>No. Joining is completely free.</p>
              </details>
              <details>
                <summary>How long does my link remain active?</summary>
                <p>{`Once a customer clicks your link, you're credited for their purchases within ${days} days — even if they don't buy on the first visit.`}</p>
              </details>
              <details>
                <summary>What if two affiliates refer the same customer?</summary>
                <p>Whichever link or code was used most recently gets the credit.</p>
              </details>
              <details>
                <summary>Is there a maximum I can earn?</summary>
                <p>No limit. The more you share, the more you earn.</p>
              </details>
              <details>
                <summary>When does commission get cancelled?</summary>
                <p>Only if the customer returns the order. Normal completed orders always pay out.</p>
              </details>
            </div>
          </div>

          <div className="aff-cta-row">
            <a href="/affiliate/apply" className="aff-cta aff-cta-primary">Apply Now</a>
          </div>
        </div>
      </div>
    </>
  );
}
