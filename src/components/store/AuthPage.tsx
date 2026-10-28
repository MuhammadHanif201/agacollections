// clientauth/login.blade.php (sign in, register, forgot password and new password panels)
import { peekFlash } from '@/lib/flash';
import type { FormState } from '@/lib/form-state';
import { PageStyles } from './LegacyStyles';
import AuthInteractions from './AuthInteractions';

const REG_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Gujranwala', 'Sialkot', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Sukkur', 'Sheikhupura', 'Rahim Yar Khan', 'Gujrat', 'Mardan', 'Kasur', 'Dera Ghazi Khan', 'Sahiwal', 'Mingora', 'Larkana', 'Okara', 'Chiniot', 'Jhang', 'Mandi Bahauddin', 'Muzaffarabad', 'Mirpur'];

/** session('success') for the panel alert (the same flash also shows as a toast) */
async function flashSuccess(): Promise<string | null> {
  const f = await peekFlash();
  return f?.type === 'success' ? f.text : null;
}

export default async function AuthPage({
  mode,
  form,
  token,
  email,
}: {
  mode: 'login' | 'forgot' | 'reset';
  form: FormState;
  token?: string;
  email?: string;
}) {
  const success = await flashSuccess();
  const old = form.old ?? {};
  const bag = (name: string) => form.errors?.[name] ?? {};
  const first = (b: string, field: string) => bag(b)[field]?.[0];
  const showRegister = Boolean(form.flags?.show_register) || Object.keys(bag('register')).length > 0;

  return (
    <>
      <PageStyles pushed={['clientauth__login.1']} />
      <div className="al-page">
        <div className="al-card">
          <div className="al-left">
            <p className="al-left-mark">AGA Collections</p>
            <h2 className="al-left-headline">
              Made for<br /><em>Your Style</em>
            </h2>
            <div className="al-left-rule">
              <span className="al-left-rule-diamond"></span>
            </div>
            <ul className="al-trust-list">
              {[
                ['ri-truck-line', 'Cash on Delivery', 'Pay when your order arrives'],
                ['ri-map-pin-2-line', 'Nationwide Delivery', 'Delivering across all of Pakistan'],
                ['ri-shield-check-line', '100% Secure', 'Your data is always protected'],
                ['ri-medal-line', 'Premium Quality', 'Crafted for the discerning few'],
              ].map(([icon, title, text]) => (
                <li className="al-trust-item" key={title}>
                  <span className="al-trust-icon"><i className={icon}></i></span>
                  <span>
                    <strong>{title}</strong>
                    {' '}{text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="al-left-footer">Pakistan&apos;s Premium Fashion</p>
          </div>

          <div className="al-right">
            {mode === 'forgot' && (
              <div id="forgotPanel" className="al-panel">
                <span className="al-panel-eyebrow">Forgot password</span>
                <h1 className="al-panel-title">Reset Your Password</h1>
                <p className="al-panel-sub">Enter the email you use with AGA Collections and we will send you a link to choose a new password.</p>
                {success && <div className="al-alert success"><i className="ri-checkbox-circle-line"></i>{success}</div>}
                <form method="POST" action="/customer/forgot-password/submit" id="forgotForm">
                  <div className="al-field">
                    <label className="al-label">Email Address <span className="req">*</span></label>
                    <input type="email" name="email" className="al-input" placeholder="you@example.com" defaultValue={old.email ?? ''} autoComplete="email" maxLength={255} required />
                    {first('default', 'email') && <p className="al-field-error">{first('default', 'email')}</p>}
                  </div>
                  <button type="submit" className="al-btn al-btn-dark">
                    <i className="ri-mail-send-line"></i>
                    {' '}Send Reset Link
                  </button>
                  <a href="/customer/login" className="al-toggle" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                    Remembered it? Sign in
                  </a>
                </form>
              </div>
            )}

            {mode === 'reset' && (
              <div id="resetPanel" className="al-panel">
                <span className="al-panel-eyebrow">Almost done</span>
                <h1 className="al-panel-title">Choose a New Password</h1>
                <p className="al-panel-sub">Pick a password with at least 8 characters.</p>
                {first('default', 'reset') && (
                  <div className="al-alert danger">
                    <i className="ri-error-warning-line"></i>{first('default', 'reset')}
                    {' '}<a href="/customer/forgot-password" style={{ color: 'inherit', textDecoration: 'underline', marginLeft: 4 }}>Get a new link</a>
                  </div>
                )}
                <form method="POST" action="/customer/reset-password/submit" id="resetForm">
                  <input type="hidden" name="token" value={token ?? ''} />
                  <div className="al-field">
                    <label className="al-label">Email Address <span className="req">*</span></label>
                    <input type="email" name="email" className="al-input" defaultValue={old.email ?? email ?? ''} autoComplete="email" required />
                    {first('default', 'email') && <p className="al-field-error">{first('default', 'email')}</p>}
                  </div>
                  <div className="al-field">
                    <label className="al-label">New Password <span className="req">*</span></label>
                    <input type="password" name="password" className="al-input" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
                    {first('default', 'password') && <p className="al-field-error">{first('default', 'password')}</p>}
                  </div>
                  <div className="al-field">
                    <label className="al-label">Confirm New Password <span className="req">*</span></label>
                    <input type="password" name="password_confirmation" className="al-input" placeholder="Type it again" autoComplete="new-password" minLength={8} required />
                  </div>
                  <button type="submit" className="al-btn al-btn-dark">
                    <i className="ri-lock-password-line"></i>
                    {' '}Save New Password
                  </button>
                </form>
              </div>
            )}

            <div id="loginPanel" className={`al-panel${mode !== 'login' || showRegister ? ' is-hidden' : ''}`}>
              <span className="al-panel-eyebrow">Welcome back</span>
              <h1 className="al-panel-title">Sign In to Your Account</h1>
              <p className="al-panel-sub">Sign in with your email and password to track orders and check out faster.</p>

              {success && mode === 'login' && <div className="al-alert success"><i className="ri-checkbox-circle-line"></i>{success}</div>}
              {first('default', 'login') && <div className="al-alert danger"><i className="ri-error-warning-line"></i>{first('default', 'login')}</div>}

              <form method="POST" action="/customer/login/submit" id="loginForm">
                <input type="hidden" name="form_type" value="login" />
                <div className="al-field">
                  <label className="al-label">Email Address <span className="req">*</span></label>
                  <input type="email" name="email" className="al-input" placeholder="you@example.com" defaultValue={old.email ?? ''} autoComplete="email" required />
                  {mode === 'login' && first('default', 'email') && <p className="al-field-error">{first('default', 'email')}</p>}
                </div>
                <div className="al-field">
                  <label className="al-label">Password <span className="req">*</span></label>
                  <input type="password" name="password" className="al-input" placeholder="Your password" autoComplete="current-password" required />
                </div>
                <div className="al-field" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.78rem', color: 'var(--dc-muted)' }}>
                  <input type="checkbox" name="remember" id="remember" value="1" style={{ width: 18, height: 18, margin: 0 }} />
                  <label htmlFor="remember" style={{ margin: 0, cursor: 'pointer', letterSpacing: 0, textTransform: 'none', fontSize: '.8rem', fontWeight: 400 }}>Remember me on this device</label>
                  <a href="/customer/forgot-password" style={{ marginLeft: 'auto', fontSize: '.8rem', color: 'var(--dc-black, #161426)', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Forgot password?</a>
                </div>
                <button type="submit" className="al-btn al-btn-dark" id="loginSubmitBtn">
                  <i className="ri-login-circle-line"></i>
                  {' '}Sign In
                </button>
                <button type="button" className="al-toggle toggle-auth">
                  New to AGA Collections? Create account
                </button>
              </form>

              <div className="al-strip">
                <div className="al-strip-item"><i className="ri-lock-line"></i> Secure Login</div>
                <div className="al-strip-item"><i className="ri-truck-line"></i> COD Available</div>
                <div className="al-strip-item"><i className="ri-map-pin-line"></i> Nationwide</div>
              </div>
            </div>

            <div id="registerPanel" className={`al-panel${showRegister ? '' : ' is-hidden'}`}>
              <span className="al-panel-eyebrow">Join us</span>
              <h1 className="al-panel-title">Create Your Account</h1>
              <p className="al-panel-sub">Fill in your details to get started with AGA Collections.</p>

              {first('register', 'register') && <div className="al-alert danger"><i className="ri-error-warning-line"></i>{first('register', 'register')}</div>}

              <form method="POST" action="/customer/register" id="registerForm">
                <input type="hidden" name="form_type" value="register" />
                <input type="hidden" name="country" value="PK" />

                <div className="al-row-2">
                  <div className="al-field">
                    <label className="al-label">Full Name <span className="req">*</span></label>
                    <input type="text" name="name" className="al-input" placeholder="Your full name" required defaultValue={old.name ?? ''} autoComplete="name" />
                    {first('register', 'name') && <p className="al-field-error">{first('register', 'name')}</p>}
                  </div>
                  <div className="al-field">
                    <label className="al-label">Email Address <span className="req">*</span></label>
                    <input type="email" name="email" className="al-input" placeholder="you@example.com" required defaultValue={old.email ?? ''} autoComplete="email" />
                    {first('register', 'email') && <p className="al-field-error">{first('register', 'email')}</p>}
                  </div>
                </div>

                <div className="al-row-2">
                  <div className="al-field">
                    <label className="al-label">City <span className="req">*</span></label>
                    <select name="city" className="al-select" required defaultValue={old.city ?? ''}>
                      <option value="">Select city</option>
                      {REG_CITIES.map((c) => <option value={c} key={c}>{c}</option>)}
                    </select>
                    {first('register', 'city') && <p className="al-field-error">{first('register', 'city')}</p>}
                  </div>
                  <div className="al-field">
                    <label className="al-label">Mobile Number <span className="req">*</span></label>
                    <div className="al-phone-row" dir="ltr">
                      <span className="al-phone-code">+92</span>
                      <input type="tel" id="reg_local" className="al-input" placeholder="3XX XXXXXXX" maxLength={10} required inputMode="numeric" autoComplete="tel-national" />
                    </div>
                    <input type="hidden" name="phone" id="reg_phone_full" defaultValue={old.phone ?? ''} />
                    {first('register', 'phone') && <p className="al-field-error">{first('register', 'phone')}</p>}
                  </div>
                </div>

                <div className="al-field">
                  <label className="al-label">Delivery Address</label>
                  <input type="text" name="address" className="al-input" placeholder="Street, block, area, landmark..." defaultValue={old.address ?? ''} autoComplete="street-address" />
                  {first('register', 'address') && <p className="al-field-error">{first('register', 'address')}</p>}
                </div>

                <div className="al-row-2">
                  <div className="al-field">
                    <label className="al-label">Password <span className="req">*</span></label>
                    <input type="password" name="password" className="al-input" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
                    {first('register', 'password') && <p className="al-field-error">{first('register', 'password')}</p>}
                  </div>
                  <div className="al-field">
                    <label className="al-label">Confirm Password <span className="req">*</span></label>
                    <input type="password" name="password_confirmation" className="al-input" placeholder="Re-enter password" autoComplete="new-password" minLength={8} required />
                  </div>
                </div>

                <div className="al-note">
                  <i className="ri-truck-line"></i>
                  {' '}We deliver Cash on Delivery to all cities across Pakistan.
                </div>

                <button type="submit" className="al-btn al-btn-dark" id="regSubmitBtn">
                  <i className="ri-user-add-line"></i>
                  {' '}Create Account
                </button>
                <button type="button" className="al-toggle toggle-auth">
                  Already have an account? Sign in
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <AuthInteractions />
    </>
  );
}
