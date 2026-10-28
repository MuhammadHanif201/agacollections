// clientauth/dashboard/edit-profile.blade.php
import { peekFlash } from '@/lib/flash';
import { takeFormState } from '@/lib/form-state';
import { buildMetadata } from '@/lib/seo';
import AccountShell, { requireCustomer } from '@/components/store/AccountShell';
import { PageStyles } from '@/components/store/LegacyStyles';
import ProfileInteractions from '@/components/store/ProfileInteractions';
import StoreLink from '@/components/store/StoreLink';

export async function generateMetadata() {
  return buildMetadata({ page: 'dashboard' });
}

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Sukkur', 'Sheikhupura', 'Rahim Yar Khan', 'Gujrat', 'Mardan', 'Kasur', 'Dera Ghazi Khan', 'Sahiwal', 'Mingora', 'Larkana', 'Okara', 'Chiniot', 'Jhang', 'Mandi Bahauddin', 'Muzaffarabad', 'Mirpur'];

export default async function EditProfilePage() {
  const customer = await requireCustomer('/customer/profile/edit');
  const form = await takeFormState();
  const old = form.old ?? {};
  const errors = form.errors?.default ?? {};
  const firstError = Object.values(errors)[0]?.[0];
  const pwErrors = form.errors?.password ?? {};
  const pwErrorFirst = Object.values(pwErrors)[0]?.[0];
  const flash = await peekFlash();
  const success = flash?.type === 'success' ? flash.text : null;
  const phone = (old.phone ?? customer.phone ?? '').replace(/^\+?92/, '');

  return (
    <>
      <PageStyles pushed={['clientauth__dashboard__customer-sidebar.1', 'clientauth__dashboard__edit-profile.1']} />
      <AccountShell customer={customer} active="profile">
        <div className="db-col-main">
          <div className="db-ph">
            <span className="db-ph-ey">Account</span>
            <h1>Edit Profile</h1>
          </div>

          {success && (
            <div className="db-alert success">
              <i className="ri-checkbox-circle-line"></i>
              {' '}{success}
            </div>
          )}
          {firstError && (
            <div className="db-alert danger">
              <i className="ri-error-warning-line"></i>
              {' '}{firstError}
            </div>
          )}

          <form action="/customer/profile/update" method="POST" id="profileForm">
            <div className="db-card">
              <div className="db-card-hd"><span className="db-card-title">Personal Information</span></div>
              <div className="db-card-body">
                <div className="dep-grid">
                  <div className="dep-field">
                    <label className="db-label">Full Name <span style={{ color: 'var(--dc-gold)' }}>*</span></label>
                    <input type="text" name="full_name" className="db-input" defaultValue={old.full_name ?? customer.full_name} placeholder="Your full name" required autoComplete="name" />
                    {errors.full_name && <p className="dep-error">{errors.full_name[0]}</p>}
                  </div>
                  <div className="dep-field">
                    <label className="db-label">Email Address <span style={{ color: 'var(--dc-gold)' }}>*</span></label>
                    <input type="email" name="email" className="db-input" defaultValue={old.email ?? customer.email ?? ''} placeholder="you@example.com" required autoComplete="email" />
                    {errors.email && <p className="dep-error">{errors.email[0]}</p>}
                  </div>
                  <div className="dep-field">
                    <label className="db-label">Current Password <span style={{ color: 'var(--dc-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(only to change your email)</span></label>
                    <input type="password" name="current_password" className="db-input" placeholder="Your current password" autoComplete="current-password" />
                    {errors.current_password && <p className="dep-error">{errors.current_password[0]}</p>}
                  </div>
                  <div className="dep-field">
                    <label className="db-label">Mobile Number</label>
                    <div style={{ display: 'flex' }} dir="ltr">
                      <span className="dep-phone-prefix">+92</span>
                      <input type="tel" name="phone" id="phoneInput" className="db-input" style={{ borderLeft: 'none' }} defaultValue={phone} placeholder="3XX XXXXXXX" maxLength={11} pattern="0?3[0-9]{9}" required inputMode="numeric" autoComplete="tel" />
                    </div>
                    {errors.phone && <p className="dep-error">{errors.phone[0]}</p>}
                  </div>
                  <div className="dep-field">
                    <label className="db-label">City</label>
                    <select name="city" className="db-select" defaultValue={old.city ?? customer.city ?? ''}>
                      <option value="">— Select city —</option>
                      {CITIES.map((c) => <option value={c} key={c}>{c}</option>)}
                    </select>
                    {errors.city && <p className="dep-error">{errors.city[0]}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="db-card">
              <div className="db-card-hd"><span className="db-card-title">Delivery Address</span></div>
              <div className="db-card-body">
                <div className="dep-field">
                  <label className="db-label">Street Address</label>
                  <input type="text" name="address" className="db-input" defaultValue={old.address ?? customer.address ?? ''} placeholder="Street, block, area, landmark..." autoComplete="street-address" maxLength={255} />
                  {errors.address && <p className="dep-error">{errors.address[0]}</p>}
                </div>
                <p style={{ fontSize: '.72rem', color: 'var(--dc-muted)', marginTop: 8, lineHeight: 1.5 }}>
                  <i className="ri-information-line" style={{ color: 'var(--dc-gold)' }}></i>
                  {' '}This address will be used as your default delivery address at checkout.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="submit" className="db-btn db-btn-dark" id="saveBtn">
                <i className="ri-save-line"></i>
                {' '}Save Changes
              </button>
              <StoreLink href="/customer/dashboard" className="db-btn db-btn-outline">Cancel</StoreLink>
            </div>
          </form>

          <form action="/customer/profile/password" method="POST" id="change-password" style={{ marginTop: 24 }}>
            <div className="db-card">
              <div className="db-card-hd"><span className="db-card-title">Change Password</span></div>
              <div className="db-card-body">
                {pwErrorFirst && (
                  <div className="db-alert danger" style={{ marginBottom: 16 }}>
                    <i className="ri-error-warning-line"></i>
                    {' '}{pwErrorFirst}
                  </div>
                )}
                <div className="dep-grid">
                  <div className="dep-field">
                    <label className="db-label">Current Password <span style={{ color: 'var(--dc-gold)' }}>*</span></label>
                    <input type="password" name="current_password" className="db-input" placeholder="Your current password" required autoComplete="current-password" />
                    {pwErrors.current_password && <p className="dep-error">{pwErrors.current_password[0]}</p>}
                  </div>
                  <div className="dep-field">
                    <label className="db-label">New Password <span style={{ color: 'var(--dc-gold)' }}>*</span></label>
                    <input type="password" name="password" className="db-input" placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" />
                    {pwErrors.password && <p className="dep-error">{pwErrors.password[0]}</p>}
                  </div>
                  <div className="dep-field">
                    <label className="db-label">Confirm New Password <span style={{ color: 'var(--dc-gold)' }}>*</span></label>
                    <input type="password" name="password_confirmation" className="db-input" placeholder="Type it again" required minLength={8} autoComplete="new-password" />
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" className="db-btn db-btn-dark">
              <i className="ri-lock-password-line"></i>
              {' '}Change Password
            </button>
          </form>
        </div>
      </AccountShell>
      <ProfileInteractions />
    </>
  );
}
