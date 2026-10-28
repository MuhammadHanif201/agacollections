// Port of resources/views/auth/forgot-password.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, old, session, csrf_field, auth, date, max, min } from '@/lib/admin/php';

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
* { box-sizing: border-box; }
body.zq-auth-body { margin:0; padding:0; font-family:'Manrope',sans-serif; background:#0e0e0e; }

.zq-wrap { display:flex; min-height:100vh; width:100%; }

/* Left panel */
.zq-left {
    flex:0 0 48%; position:relative; overflow:hidden;
    background:#0e0e0e; display:flex; flex-direction:column;
    justify-content:space-between; padding:48px 52px;
}
.zq-left::before {
    content:''; position:absolute; inset:0;
    background:
        radial-gradient(ellipse 80% 60% at 20% 80%, rgba(255,79,31,0.22), transparent 65%),
        radial-gradient(ellipse 60% 50% at 80% 10%, rgba(255,255,255,0.12), transparent 60%),
        linear-gradient(160deg, #111111 0%, #0e0e0e 40%, #0a0a14 100%);
    z-index:0;
}
.zq-left::after {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size:28px 28px; z-index:0;
}
.zq-left > * { position:relative; z-index:1; }
.zq-brand-top { display:flex; align-items:center; gap:12px; }
.zq-logo-box { width:40px; height:40px; border-radius:10px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.zq-logo-box img { width:100%; height:100%; object-fit:contain; padding:5px; }
.zq-brand-name-small { font-family:'Archivo',serif; font-size:1rem; font-weight:600; color:rgba(255,255,255,0.75); letter-spacing:0.08em; text-transform:uppercase; }
.zq-auth-hero { flex:1; display:flex; flex-direction:column; justify-content:center; padding:40px 0 20px; }
.zq-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:0.72rem; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:#FF4F1F; margin-bottom:20px; }
.zq-eyebrow::before { content:''; display:block; width:28px; height:1px; background:#FF4F1F; }
.zq-headline { font-family:'Archivo',serif; font-size:clamp(2.4rem,4vw,4.2rem); font-weight:700; line-height:1.06; color:#ffffff; margin:0 0 24px; }
.zq-headline em { font-style:italic; color:#FF4F1F; }
.zq-tagline { font-size:0.9rem; font-weight:300; color:rgba(255,255,255,0.5); line-height:1.7; max-width:320px; }
.zq-caption { font-size:0.75rem; color:rgba(255,255,255,0.2); letter-spacing:0.05em; }

/* Right panel */
.zq-right {
    flex:1; background:#faf9f7; display:flex; flex-direction:column;
    align-items:center; justify-content:center; padding:48px 40px; position:relative;
}
.zq-right::before { content:''; position:absolute; top:0; right:0; width:240px; height:240px; background:radial-gradient(circle,rgba(17,17,17,0.08),transparent 70%); pointer-events:none; }
.zq-form-box { width:100%; max-width:380px; }
.zq-form-header { margin-bottom:32px; }
.zq-form-kicker { font-size:0.7rem; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:#111111; margin-bottom:10px; }
.zq-form-title { font-family:'Archivo',serif; font-size:2rem; font-weight:700; color:#1a1a1a; margin:0 0 8px; line-height:1.15; }
.zq-form-sub { font-size:0.85rem; color:#888; line-height:1.6; }
.zq-field { margin-bottom:20px; }
.zq-field-label { display:block; font-size:0.75rem; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; color:#555; margin-bottom:8px; }
.zq-input { width:100%; padding:13px 16px; border:1.5px solid #e0ddd8; border-radius:10px; background:#fff; font-size:0.92rem; color:#1a1a1a; outline:none; transition:border-color .2s,box-shadow .2s; font-family:'Manrope',sans-serif; }
.zq-input::placeholder { color:#bbb; }
.zq-input:focus { border-color:#111111; box-shadow:0 0 0 3px rgba(17,17,17,0.12); }
.zq-input.is-invalid { border-color:#e05555; box-shadow:0 0 0 3px rgba(224,85,85,0.10); }
.zq-invalid-msg { font-size:0.78rem; color:#d94f4f; margin-top:5px; }
.zq-btn { width:100%; padding:14px; border:none; border-radius:10px; background:#1a1a1a; color:#fff; font-size:0.88rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:background .2s,transform .1s,box-shadow .2s; margin-top:8px; font-family:'Manrope',sans-serif; }
.zq-btn:hover { background:#2e2e2e; box-shadow:0 8px 24px rgba(0,0,0,0.18); transform:translateY(-1px); }
.zq-btn:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
.zq-alert { padding:12px 16px; border-radius:10px; font-size:0.85rem; margin-bottom:20px; }
.zq-alert-error { background:#fff0f0; border:1px solid #f5c6c6; color:#c0392b; }
.zq-alert-success { background:#f0faf4; border:1px solid #b7dfcc; color:#1e7e4a; }
.zq-back-link { display:inline-flex; align-items:center; gap:6px; font-size:0.82rem; color:#111111; text-decoration:none; border-bottom:1px dashed rgba(17,17,17,0.4); margin-top:24px; }
.zq-back-link:hover { color:#1a1a1a; border-bottom-color:#1a1a1a; }

@media (max-width:860px) {
    .zq-left { display:none; }
    .zq-right { background:#0e0e0e; min-height:100vh; }
    .zq-right::before { display:none; }
    .zq-input { background:#1a1a1a; border-color:rgba(255,255,255,0.12); color:#f5f5f5; }
    .zq-input::placeholder { color:rgba(255,255,255,0.3); }
    .zq-input:focus { border-color:#111111; background:#1C1C1C; }
    .zq-field-label { color:rgba(255,255,255,0.55); }
    .zq-form-title { color:#fff; }
    .zq-form-sub { color:rgba(255,255,255,0.45); }
    .zq-form-kicker { color:#FF4F1F; }
    .zq-btn { background:#ffffff; color: #111111; }
    .zq-btn:hover { background:#FFE6DC; }
    .zq-back-link { color:#FF4F1F; }
}
@media (max-width:480px) { .zq-right { padding:32px 24px; } }
</style>

<div class="zq-wrap">

    
    <div class="zq-left">
        <div class="zq-brand-top">
            <div class="zq-logo-box">
                <img src="${companySetting?.logo ? asset('storage/' + (companySetting?.logo ?? '')) : asset('clientside/company_logo/default-logo.png')}"
                     alt="${companySetting?.name ?? 'AGA Collections'}">
            </div>
            <span class="zq-brand-name-small">${companySetting?.name ?? 'AGA Collections'}</span>
        </div>
        <div class="zq-auth-hero">
            <div class="zq-eyebrow">Account Recovery</div>
            <h1 class="zq-headline">Reset Your<br><em>Password.</em></h1>
            <p class="zq-tagline">
                Enter your registered email address and we'll send you a secure link to reset your password.
            </p>
        </div>
        <div class="zq-caption">© ${date('Y')} ${companySetting?.name ?? 'AGA Collections'} — All rights reserved</div>
    </div>

    
    <div class="zq-right">
        <div class="zq-form-box">

            <div class="zq-form-header">
                <div class="zq-form-kicker">Password Recovery</div>
                <h2 class="zq-form-title">Forgot Password?</h2>
                <p class="zq-form-sub">We'll email you a link to reset your password.</p>
            </div>

            ${(session('success')) ? html`                <div class="zq-alert zq-alert-success">
                    <i class="fas fa-check-circle" style="margin-right:6px;"></i>${session('success')}
                </div>
            ` : ''}            ${(errors?.has('email')) ? html`                <div class="zq-alert zq-alert-error">${errors?.first('email')}</div>
            ` : ''}
            <form method="POST" action="${route('admin.password.email')}" id="forgotForm" novalidate>
                ${csrf_field()}
                <div class="zq-field">
                    <label class="zq-field-label" for="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        class="zq-input ${errors?.has('email') ? 'is-invalid' : ''}"
                        placeholder="admin@example.com"
                        value="${old('email')}"
                        autocomplete="email"
                        autofocus
                    >
                    ${(errors.has('email')) ? (() => { const message = errors.first('email');  return html`                        <div class="zq-invalid-msg">${message}</div>
                    `; })() : ''}                </div>

                <button type="submit" class="zq-btn" id="forgotBtn">
                    <span class="spinner-border spinner-border-sm d-none" id="forgotSpinner" role="status" aria-hidden="true"></span>
                    <span id="forgotText">Send Reset Link</span>
                    <i class="fas fa-paper-plane" id="forgotIcon"></i>
                </button>
            </form>

            <div style="text-align:center;">
                <a href="${route('admin.login')}" class="zq-back-link">
                    <i class="fas fa-arrow-left" style="font-size:.75rem;"></i> Back to Sign In
                </a>
            </div>

        </div>
    </div>

</div>

<script>
document.getElementById('forgotForm').addEventListener('submit', function () {
    const btn     = document.getElementById('forgotBtn');
    const spinner = document.getElementById('forgotSpinner');
    const text    = document.getElementById('forgotText');
    const icon    = document.getElementById('forgotIcon');
    btn.disabled = true;
    spinner.classList.remove('d-none');
    text.textContent = 'Sending…';
    if (icon) icon.style.display = 'none';
});
</script>

`,
    scripts: html``,
    // /* section title: 'title', 'Forgot Password' */ | /* section body_class: 'body_class', 'zq-auth-body' */ | /* section main_class: 'main_class', 'min-vh-100 d-flex' */
  };
}
