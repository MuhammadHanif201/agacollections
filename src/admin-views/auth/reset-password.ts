// Port of resources/views/auth/reset-password.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, old, csrf_field, auth, date, max, min, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { token, email } = d;

  return {
    title: html``,
    styles: html``,
    content: html`
<style>
@import url("https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Manrope:wght@400;500;600;700;800&display=swap");
* { box-sizing:border-box; }
body.zq-auth-body { margin:0; padding:0; font-family:'Manrope',sans-serif; background:#0e0e0e; }

.zq-wrap { display:flex; min-height:100vh; width:100%; }
.zq-left {
    flex:0 0 48%; position:relative; overflow:hidden;
    background:#0e0e0e; display:flex; flex-direction:column;
    justify-content:space-between; padding:48px 52px;
}
.zq-left::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 20% 80%, rgba(255,79,31,0.22), transparent 65%), radial-gradient(ellipse 60% 50% at 80% 10%, rgba(255,255,255,0.12), transparent 60%), linear-gradient(160deg,#111111 0%,#0e0e0e 40%,#0a0a14 100%); z-index:0; }
.zq-left::after { content:''; position:absolute; inset:0; background-image:radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size:28px 28px; z-index:0; }
.zq-left > * { position:relative; z-index:1; }
.zq-brand-top { display:flex; align-items:center; gap:12px; }
.zq-logo-box { width:40px; height:40px; border-radius:10px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center; overflow:hidden; }
.zq-logo-box img { width:100%; height:100%; object-fit:contain; padding:5px; }
.zq-brand-name-small { font-family:'Archivo',serif; font-size:1rem; font-weight:600; color:rgba(255,255,255,0.75); letter-spacing:0.08em; text-transform:uppercase; }
.zq-auth-hero { flex:1; display:flex; flex-direction:column; justify-content:center; padding:40px 0 20px; }
.zq-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:0.72rem; font-weight:500; letter-spacing:0.2em; text-transform:uppercase; color:#FF4F1F; margin-bottom:20px; }
.zq-eyebrow::before { content:''; display:block; width:28px; height:1px; background:#FF4F1F; }
.zq-headline { font-family:'Archivo',serif; font-size:clamp(2.4rem,4vw,4.2rem); font-weight:700; line-height:1.06; color:#fff; margin:0 0 24px; }
.zq-headline em { font-style:italic; color:#FF4F1F; }
.zq-tagline { font-size:0.9rem; font-weight:300; color:rgba(255,255,255,0.5); line-height:1.7; max-width:320px; }
.zq-caption { font-size:0.75rem; color:rgba(255,255,255,0.2); letter-spacing:0.05em; }

.zq-right { flex:1; background:#faf9f7; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 40px; position:relative; }
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

/* Password strength bar */
.strength-bar { height:3px; border-radius:2px; margin-top:8px; transition:width .3s,background .3s; width:0; background:#e0ddd8; }
.strength-label { font-size:0.72rem; color:#aaa; margin-top:4px; }

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
            <div class="zq-eyebrow">Secure Reset</div>
            <h1 class="zq-headline">Choose a<br><em>New Password.</em></h1>
            <p class="zq-tagline">
                Pick something strong. At least 8 characters — the longer, the better.
            </p>
        </div>
        <div class="zq-caption">© ${date('Y')} ${companySetting?.name ?? 'AGA Collections'} — All rights reserved</div>
    </div>

    
    <div class="zq-right">
        <div class="zq-form-box">

            <div class="zq-form-header">
                <div class="zq-form-kicker">Secure Access</div>
                <h2 class="zq-form-title">Set New Password</h2>
                <p class="zq-form-sub">Choose a strong password for your admin account.</p>
            </div>

            ${(errors?.any()) ? html`                <div class="zq-alert zq-alert-error">
                    ${foreach(errors?.all(), (error, loop) => html`                        <div>${error}</div>
                    `)}                </div>
            ` : ''}
            <form method="POST" action="${route('admin.password.update')}" id="resetForm" novalidate>
                ${csrf_field()}
                <input type="hidden" name="token" value="${token}">

                <div class="zq-field">
                    <label class="zq-field-label" for="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        class="zq-input ${errors?.has('email') ? 'is-invalid' : ''}"
                        placeholder="Confirm your email"
                        value="${old('email', email)}"
                        autocomplete="email"
                        autofocus
                    >
                    ${(errors.has('email')) ? (() => { const message = errors.first('email');  return html`                        <div class="zq-invalid-msg">${message}</div>
                    `; })() : ''}                </div>

                <div class="zq-field">
                    <label class="zq-field-label" for="password">New Password</label>
                    <div style="position:relative;">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            class="zq-input ${errors?.has('password') ? 'is-invalid' : ''}"
                            placeholder="Min. 8 characters"
                            autocomplete="new-password"
                            oninput="checkStrength(this.value)"
                            style="padding-right:44px;"
                        >
                        <button type="button" onclick="togglePass('password','eye1')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;padding:0;" tabindex="-1">
                            <i class="fas fa-eye" id="eye1"></i>
                        </button>
                    </div>
                    <div class="strength-bar" id="strengthBar"></div>
                    <div class="strength-label" id="strengthLabel"></div>
                    ${(errors.has('password')) ? (() => { const message = errors.first('password');  return html`                        <div class="zq-invalid-msg">${message}</div>
                    `; })() : ''}                </div>

                <div class="zq-field">
                    <label class="zq-field-label" for="password_confirmation">Confirm Password</label>
                    <div style="position:relative;">
                        <input
                            type="password"
                            id="password_confirmation"
                            name="password_confirmation"
                            class="zq-input"
                            placeholder="Repeat new password"
                            autocomplete="new-password"
                            style="padding-right:44px;"
                        >
                        <button type="button" onclick="togglePass('password_confirmation','eye2')" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#aaa;padding:0;" tabindex="-1">
                            <i class="fas fa-eye" id="eye2"></i>
                        </button>
                    </div>
                </div>

                <button type="submit" class="zq-btn" id="resetBtn">
                    <span class="spinner-border spinner-border-sm d-none" id="resetSpinner" role="status" aria-hidden="true"></span>
                    <span id="resetText">Reset Password</span>
                    <i class="fas fa-lock" id="resetIcon"></i>
                </button>
            </form>

            <div style="text-align:center;margin-top:24px;">
                <a href="${route('admin.login')}" style="font-size:0.82rem;color:#111111;text-decoration:none;border-bottom:1px dashed rgba(17,17,17,0.4);">
                    <i class="fas fa-arrow-left" style="font-size:.75rem;margin-right:4px;"></i> Back to Sign In
                </a>
            </div>

        </div>
    </div>
</div>

<script>
function togglePass(fieldId, eyeId) {
    const input = document.getElementById(fieldId);
    const eye   = document.getElementById(eyeId);
    if (input.type === 'password') {
        input.type = 'text';
        eye.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        eye.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function checkStrength(val) {
    const bar   = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');
    if (!val) { bar.style.width = '0'; label.textContent = ''; return; }
    let score = 0;
    if (val.length >= 8)  score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
        { pct:'20%', color:'#e05555', text:'Very weak' },
        { pct:'40%', color:'#e07840', text:'Weak' },
        { pct:'60%', color:'#d4aa40', text:'Fair' },
        { pct:'80%', color:'#5ab44b', text:'Strong' },
        { pct:'100%',color:'#2e9e4f', text:'Very strong' },
    ];
    const l = levels[Math.min(score, 4)];
    bar.style.width = l.pct;
    bar.style.background = l.color;
    label.textContent = l.text;
    label.style.color = l.color;
}

document.getElementById('resetForm').addEventListener('submit', function () {
    const btn     = document.getElementById('resetBtn');
    const spinner = document.getElementById('resetSpinner');
    const text    = document.getElementById('resetText');
    const icon    = document.getElementById('resetIcon');
    btn.disabled = true;
    spinner.classList.remove('d-none');
    text.textContent = 'Resetting…';
    if (icon) icon.style.display = 'none';
});
</script>

`,
    scripts: html``,
    // /* section title: 'title', 'Reset Password' */ | /* section body_class: 'body_class', 'zq-auth-body' */ | /* section main_class: 'main_class', 'min-vh-100 d-flex' */
  };
}
