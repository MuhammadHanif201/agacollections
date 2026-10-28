// Port of resources/views/auth/login.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, config, old, session, csrf_field, auth, date, round, max, min } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let {  } = d;

  return {
    title: html``,
    styles: html``,
    content: html`
<style>
@import url("https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Manrope:wght@400;500;600;700;800&display=swap");
/* =============================================
   AGA Collections — Admin Login
   Split-screen fashion layout
   ============================================= */


* { box-sizing: border-box; }

body.zq-auth-body {
    margin: 0;
    padding: 0;
    font-family: 'Manrope', sans-serif;
    background: #0e0e0e;
}

/* ---- SPLIT LAYOUT ---- */
.zq-wrap {
    display: flex;
    min-height: 100vh;
    width: 100%;
}

/* ---- LEFT PANEL — Brand ---- */
.zq-left {
    flex: 0 0 48%;
    position: relative;
    overflow: hidden;
    background: #0e0e0e;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
}

/* Animated gradient overlay */
.zq-left::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
        radial-gradient(ellipse 80% 60% at 20% 80%, rgba(255,79,31, 0.22), transparent 65%),
        radial-gradient(ellipse 60% 50% at 80% 10%, rgba(255,255,255, 0.12), transparent 60%),
        linear-gradient(160deg, #111111 0%, #0e0e0e 40%, #0a0a14 100%);
    z-index: 0;
}

/* Fabric texture dots */
.zq-left::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 28px 28px;
    z-index: 0;
}

.zq-left > * { position: relative; z-index: 1; }

/* Brand mark top */
.zq-brand-top {
    display: flex;
    align-items: center;
    gap: 12px;
}

.zq-logo-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.zq-logo-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 5px;
}

.zq-brand-name-small {
    font-family: 'Archivo', 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

/* Centre hero content */
.zq-auth-hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40px 0 20px;
}

.zq-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #FF4F1F;
    margin-bottom: 20px;
}

.zq-eyebrow::before {
    content: '';
    display: block;
    width: 28px;
    height: 1px;
    background: #FF4F1F;
}

.zq-headline {
    font-family: 'Archivo', 'Playfair Display', serif;
    font-size: clamp(3rem, 4.5vw, 5rem);
    font-weight: 700;
    line-height: 1.02;
    letter-spacing: -0.01em;
    color: #ffffff;
    margin: 0 0 28px;
}

.zq-headline em {
    font-style: italic;
    color: #FF4F1F;
}

.zq-tagline {
    font-size: 0.9rem;
    font-weight: 300;
    color: rgba(255,255,255,0.5);
    line-height: 1.7;
    max-width: 320px;
    margin-bottom: 36px;
}

/* Decorative divider */
.zq-deco {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
}
.zq-deco-line {
    height: 1px;
    width: 40px;
    background: linear-gradient(90deg, rgba(17,17,17,0.8), transparent);
}
.zq-deco-diamond {
    width: 6px;
    height: 6px;
    background: #FF4F1F;
    transform: rotate(45deg);
    opacity: 0.7;
}

/* Stats row */
.zq-stats {
    display: flex;
    gap: 32px;
}
.zq-stat-label {
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 4px;
}
.zq-stat-val {
    font-family: 'Archivo', 'Playfair Display', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
}

/* Bottom caption */
.zq-caption {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.2);
    letter-spacing: 0.05em;
}

/* ---- RIGHT PANEL — Form ---- */
.zq-right {
    flex: 1;
    background: #faf9f7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    position: relative;
}

/* Subtle top-right accent */
.zq-right::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 240px; height: 240px;
    background: radial-gradient(circle, rgba(17,17,17,0.08), transparent 70%);
    pointer-events: none;
}

.zq-form-box {
    width: 100%;
    max-width: 380px;
}

.zq-form-header {
    margin-bottom: 36px;
}

.zq-form-kicker {
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #111111;
    margin-bottom: 10px;
}

.zq-form-title {
    font-family: 'Archivo', 'Playfair Display', serif;
    font-size: 2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px;
    line-height: 1.15;
}

.zq-form-sub {
    font-size: 0.85rem;
    color: #888;
    line-height: 1.6;
}

/* Form fields */
.zq-field {
    margin-bottom: 20px;
}

.zq-field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 8px;
}

.zq-input {
    width: 100%;
    padding: 13px 16px;
    border: 1.5px solid #e0ddd8;
    border-radius: 10px;
    background: #fff;
    font-size: 0.92rem;
    color: #1a1a1a;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    font-family: 'Manrope', sans-serif;
}

.zq-input::placeholder { color: #bbb; }

.zq-input:focus {
    border-color: #111111;
    box-shadow: 0 0 0 3px rgba(17,17,17,0.12);
}

.zq-input.is-invalid {
    border-color: #e05555;
    box-shadow: 0 0 0 3px rgba(224,85,85,0.10);
}

.zq-invalid-msg {
    font-size: 0.78rem;
    color: #d94f4f;
    margin-top: 5px;
}

/* Submit button */
.zq-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 10px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
    margin-top: 8px;
    font-family: 'Manrope', sans-serif;
}

.zq-btn:hover {
    background: #2e2e2e;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    transform: translateY(-1px);
}

.zq-btn:active { transform: translateY(0); }

.zq-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

/* Alert */
.zq-alert {
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 0.85rem;
    margin-bottom: 20px;
}

.zq-alert-error {
    background: #fff0f0;
    border: 1px solid #f5c6c6;
    color: #c0392b;
}

.zq-alert-success {
    background: #f0faf4;
    border: 1px solid #b7dfcc;
    color: #1e7e4a;
}

/* Divider */
.zq-form-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 28px 0 20px;
    color: #ccc;
    font-size: 0.75rem;
}
.zq-form-divider::before,
.zq-form-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8e5e0;
}

/* Footer note */
.zq-form-footer {
    margin-top: 28px;
    text-align: center;
    font-size: 0.78rem;
    color: #aaa;
}

.zq-form-footer a {
    color: #111111;
    text-decoration: none;
    border-bottom: 1px dashed rgba(17,17,17,0.4);
}

.zq-form-footer a:hover { color: #1a1a1a; border-bottom-color: #1a1a1a; }

/* ---- RESPONSIVE ---- */
@media (max-width: 860px) {
    .zq-left { display: none; }
    .zq-right {
        background: #0e0e0e;
        min-height: 100vh;
    }
    .zq-right::before { display: none; }
    .zq-input {
        background: #1a1a1a;
        border-color: rgba(255,255,255,0.12);
        color: #f5f5f5;
    }
    .zq-input::placeholder { color: rgba(255,255,255,0.3); }
    .zq-input:focus {
        border-color: #111111;
        background: #1C1C1C;
    }
    .zq-input.is-invalid { border-color: #e05555; }
    .zq-field-label { color: rgba(255,255,255,0.55); }
    .zq-form-title { color: #fff; }
    .zq-form-sub { color: rgba(255,255,255,0.45); }
    .zq-form-kicker { color: #FF4F1F; }
    .zq-btn { background: #ffffff; color: #111111; }
    .zq-btn:hover { background: #FFE6DC; }
    .zq-form-footer { color: rgba(255,255,255,0.35); }
    .zq-alert-error {
        background: rgba(255,80,80,0.1);
        border-color: rgba(255,80,80,0.25);
        color: #ff8a8a;
    }
}

@media (max-width: 480px) {
    .zq-right { padding: 32px 24px; }
}
</style>

<div class="zq-wrap">

    
    <div class="zq-left">

        
        <div class="zq-brand-top">
            <div class="zq-logo-box">
                <img
                    src="${companySetting?.logo ? asset(`storage/${companySetting?.logo}`) : asset('clientside/company_logo/default-logo.png')}"
                    alt="${companySetting?.name ?? 'AGA Collections'}"
                >
            </div>
            <span class="zq-brand-name-small">${companySetting?.name ?? 'AGA Collections'}</span>
        </div>

        
        <div class="zq-auth-hero">
            <div class="zq-eyebrow">Admin Portal</div>
            <h1 class="zq-headline">
                Style.<br>
                <em>Redefined.</em><br>
                Every Day.
            </h1>
            <p class="zq-tagline">
                Manage your collections, orders, and customers — all from one elegant dashboard built for the modern fashion brand.
            </p>
            <div class="zq-deco">
                <div class="zq-deco-line"></div>
                <div class="zq-deco-diamond"></div>
            </div>
            <div class="zq-stats">
                <div>
                    <div class="zq-stat-label">Collections</div>
                    <div class="zq-stat-val">∞</div>
                </div>
                <div>
                    <div class="zq-stat-label">Platform</div>
                    <div class="zq-stat-val">Admin</div>
                </div>
                <div>
                    <div class="zq-stat-label">Access</div>
                    <div class="zq-stat-val">Secure</div>
                </div>
            </div>
        </div>

        
        <div class="zq-caption">
            © ${date('Y')} ${companySetting?.name ?? 'AGA Collections'} — All rights reserved
        </div>

    </div>

    
    <div class="zq-right">
        <div class="zq-form-box">

            
            <div class="zq-form-header">
                <div class="zq-form-kicker">Secure Access</div>
                <h2 class="zq-form-title">Welcome Back</h2>
                <p class="zq-form-sub">Sign in to your admin account to continue.</p>
            </div>

            
            ${(session('success')) ? html`                <div class="zq-alert zq-alert-success">${session('success')}</div>
            ` : ''}            ${(session('error')) ? html`                <div class="zq-alert zq-alert-error">${session('error')}</div>
            ` : ''}            ${(errors?.has('login')) ? html`                <div class="zq-alert zq-alert-error">${errors?.first('login')}</div>
            ` : ''}
            
            <form method="POST" action="${route('admin.login.submit')}" id="adminLoginForm" novalidate>
                ${csrf_field()}
                <div class="zq-field">
                    <label class="zq-field-label" for="login">Email or Username</label>
                    <input
                        type="text"
                        id="login"
                        name="login"
                        class="zq-input ${errors?.has('login') ? 'is-invalid' : ''}"
                        placeholder="admin@example.com or username"
                        value="${old('login')}"
                        autocomplete="username"
                        autofocus
                    >
                    ${(errors.has('login')) ? (() => { const message = errors.first('login');  return html`                        <div class="zq-invalid-msg">${message}</div>
                    `; })() : ''}                </div>

                <div class="zq-field">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <label class="zq-field-label" for="password" style="margin-bottom:0;">Password</label>
                        <a href="${route('admin.password.request')}" style="font-size:0.75rem;color:#111111;text-decoration:none;border-bottom:1px dashed rgba(17,17,17,0.4);">Forgot password?</a>
                    </div>
                    <div style="position:relative;">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            class="zq-input ${errors?.has('password') ? 'is-invalid' : ''}"
                            placeholder="••••••••"
                            autocomplete="current-password"
                            style="padding-right:44px;"
                        >
                        <button type="button" onclick="togglePass()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;padding:0;line-height:1;" tabindex="-1">
                            <i class="fas fa-eye" id="passEye"></i>
                        </button>
                    </div>
                    ${(errors.has('password')) ? (() => { const message = errors.first('password');  return html`                        <div class="zq-invalid-msg">${message}</div>
                    `; })() : ''}                </div>

                <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
                    <input type="checkbox" name="remember" id="remember" value="1" style="accent-color:#111111;width:15px;height:15px;cursor:pointer;">
                    <label for="remember" style="font-size:0.82rem;color:#666;cursor:pointer;margin:0;">Remember me</label>
                </div>

                <button type="submit" class="zq-btn" id="loginBtn">
                    <span class="spinner-border spinner-border-sm d-none" id="loginSpinner" role="status" aria-hidden="true"></span>
                    <span id="loginText">Sign In</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="loginArrow"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>

            </form>

            <div class="zq-form-footer">
                <a href="${config('app.url') ?? '/'}">← Back to store</a>
                &nbsp;·&nbsp;
                <a href="${route('admin.password.request')}">Forgot password?</a>
            </div>

        </div>
    </div>

</div>

<script>
(function () {
    const form    = document.getElementById('adminLoginForm');
    const btn     = document.getElementById('loginBtn');
    const spinner = document.getElementById('loginSpinner');
    const text    = document.getElementById('loginText');
    const arrow   = document.getElementById('loginArrow');

    form.addEventListener('submit', function () {
        btn.disabled = true;
        spinner.classList.remove('d-none');
        text.textContent = 'Signing in…';
        if (arrow) arrow.style.display = 'none';
    });
})();

function togglePass() {
    const input = document.getElementById('password');
    const eye   = document.getElementById('passEye');
    if (input.type === 'password') {
        input.type = 'text';
        eye.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        eye.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
</script>

`,
    scripts: html``,
    // /* section title: 'title', 'Admin Login' */ | /* section body_class: 'body_class', 'zq-auth-body' */ | /* section main_class: 'main_class', 'min-vh-100 d-flex' */
  };
}
