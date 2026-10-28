// clientside/zayqora/affiliate/apply.blade.php
import { getCurrentCustomer } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { peekFlash } from '@/lib/flash';
import { rememberIntended, takeFormState } from '@/lib/form-state';
import { buildMetadata } from '@/lib/seo';
import AffiliateApplyForm from '@/components/store/AffiliateApplyForm';
import { PageStyles } from '@/components/store/LegacyStyles';
import { Affiliate } from '@/models/Affiliate';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'default', metaTitle: 'Affiliate Application', metaDesc: 'Apply to become a AGA Collections affiliate.' });
}

export default async function AffiliateApplyPage() {
  const customer = await getCurrentCustomer();
  await connectDb();
  const existing = customer ? await Affiliate.findOne({ customer_id: customer._id }).lean() : null;
  // Come back here after logging in or signing up
  if (!customer) await rememberIntended('/affiliate/apply');
  const [flash, form] = await Promise.all([peekFlash(), takeFormState()]);
  const old = form.old ?? {};
  const errors = Object.values(form.errors?.default ?? {}).flat();

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__affiliate__apply.1']} />
      <div className="aff-apply-page">
        <div className="aff-apply-card">
          {flash?.type === 'success' && <div className="aff-flash aff-flash-ok">{flash.text}</div>}
          {flash?.type === 'error' && <div className="aff-flash aff-flash-error">{flash.text}</div>}

          {existing ? (
            <div className="aff-existing-banner">
              You already have an affiliate application — current status:{' '}
              <strong>{existing.status.charAt(0).toUpperCase() + existing.status.slice(1)}</strong>.
              {existing.status === 'approved' && (
                <>{' '}<StoreLink href="/affiliate/dashboard" style={{ color: 'var(--dc-accent)', fontWeight: 600 }}>Go to your dashboard →</StoreLink></>
              )}
            </div>
          ) : !customer ? (
            <>
              <h1>Become an Affiliate</h1>
              <p className="sub">Your affiliate dashboard, earnings and payouts are linked to your AGA Collections account. Please log in or create a free account first, then fill in the short application.</p>
              <StoreLink href="/customer/login" className="aff-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>Log in or create an account</StoreLink>
            </>
          ) : (
            <>
              <h1>Become an Affiliate</h1>
              <p className="sub">Tell us a bit about you and how you&apos;d like to be paid. We&apos;ll review your application and get back within 1–2 days.</p>
              <AffiliateApplyForm
                values={{
                  full_name: old.full_name ?? customer.full_name ?? '',
                  phone: old.phone ?? customer.phone ?? '',
                  email: old.email ?? customer.email ?? '',
                  payment_method: old.payment_method ?? '',
                  payment_account_number: old.payment_account_number ?? '',
                  payment_account_name: old.payment_account_name ?? '',
                  bank_name: old.bank_name ?? '',
                }}
                errors={errors}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
