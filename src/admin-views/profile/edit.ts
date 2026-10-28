// Port of resources/views/adminside/profile/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, old, session, csrf_field, Auth, Carbon, collect, count, empty, strtoupper, explode, max, e, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { w } = d;
  let user = Auth.user();
  let initials = collect(explode(' ', user?.name))?.map((w) => strtoupper(w?.[0] ?? ''))?.take(2)?.implode('');
  let colors = ['#111111','#7C3AED','#0891B2','#059669','#D97706','#6366F1','#0D9488'];
  let avatarColor = colors?.[user?.id % count(colors)];
  let displayPhone = user?.phone ? '0'  +  (user?.phone ?? '') : '';
  return {
    title: html`<title>My Profile — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="View and update your personal profile, password and account details at ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="my profile, account settings, change password, user profile, aga collections admin">
`,
    styles: html``,
    content: html`

<style>
    /* ── Professional Admin Profile Theme ── */
    :root {
        --ad-accent:    #111111;
        --ad-accent-dk: #2A2A2A;
        --ad-dark:      #111111;
        --ad-surface:   #111827;
        --ad-card:      #1C1C1C;
        --ad-border:    rgba(163,163,163,0.12);
        --ad-muted:     #A3A3A3;
        --ad-text:      #F4F4F4;
        --ad-radius:    14px;
        --ad-input-bg:  rgba(255,255,255,0.05);
    }

    /* ── Hero strip ── */
    .dc-profile-hero {
        background: linear-gradient(135deg, #111111 0%, #1C1C1C 50%, #111111 100%);
        border-bottom: 1px solid var(--ad-border);
        padding: 1.5rem 2rem 1.75rem;
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: .75rem;
    }
    .dc-profile-hero h1 {
        font-family: 'Manrope', sans-serif; font-size: 1.55rem; font-weight: 700;
        color: var(--ad-text); margin: 0;
    }
    .dc-profile-hero .breadcrumb { background: none; margin: 0; padding: 0; }
    .dc-profile-hero .breadcrumb-item + .breadcrumb-item::before { color: var(--ad-muted); }
    .dc-profile-hero .breadcrumb-item a { color: #FF4F1F; text-decoration: none; font-size: .85rem; }
    .dc-profile-hero .breadcrumb-item.active { color: var(--ad-muted); font-size: .85rem; }

    /* ── Two-column layout ── */
    .dc-profile-grid {
        display: grid; grid-template-columns: 300px 1fr;
        gap: 1.5rem; max-width: 1100px; margin: 2rem auto 0; align-items: start;
    }
    @media (max-width: 860px) { .dc-profile-grid { grid-template-columns: 1fr; } }

    /* ── Left card ── */
    .dc-side-card {
        background: var(--ad-card); border: 1px solid var(--ad-border);
        border-radius: var(--ad-radius); overflow: hidden;
    }
    .dc-side-card-top {
        background: linear-gradient(135deg, #111111 0%, #1C1C1C 100%);
        padding: 2rem 1.5rem 1.5rem; text-align: center;
    }
    .dc-avatar-lg {
        width: 90px; height: 90px; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 2rem; font-weight: 700; color: #fff; letter-spacing: .05em;
        border: 3px solid rgba(255,255,255,0.12); margin-bottom: .75rem;
        font-family: 'Manrope', sans-serif;
    }
    .dc-side-name {
        color: var(--ad-text); font-family: 'Manrope', sans-serif;
        font-size: 1.1rem; font-weight: 600; margin-bottom: .2rem;
    }
    .dc-side-role { color: var(--ad-muted); font-size: .8rem; }
    .dc-side-badge {
        display: inline-block; margin-top: .65rem; padding: .25rem .75rem;
        background: rgba(17,17,17,0.15); border: 1px solid rgba(17,17,17,0.3);
        color: #FF4F1F; border-radius: 20px; font-size: .75rem;
        font-weight: 600; letter-spacing: .04em;
    }
    .dc-side-meta {
        padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: .85rem;
    }
    .dc-meta-row {
        display: flex; align-items: center; gap: .65rem;
        color: var(--ad-muted); font-size: .82rem; word-break: break-all;
    }
    .dc-meta-row i { color: #FF4F1F; width: 14px; flex-shrink: 0; }
    .dc-meta-row span { color: var(--ad-text); }
    .dc-side-divider { border-color: var(--ad-border); margin: 0; }
    .dc-side-footer { padding: 1.25rem 1.5rem; text-align: center; }
    .dc-manage-btn {
        display: inline-flex; align-items: center; gap: .45rem;
        padding: .5rem 1.25rem; border-radius: 8px;
        border: 1px solid rgba(17,17,17,0.3);
        color: #FF4F1F; background: rgba(17,17,17,0.08);
        font-size: .82rem; font-weight: 600; text-decoration: none;
        transition: background .2s, border-color .2s;
    }
    .dc-manage-btn:hover {
        background: rgba(17,17,17,0.16); border-color: #111111; color: #FFE6DC;
    }

    /* ── Right card / tabs ── */
    .dc-main-card {
        background: var(--ad-card); border: 1px solid var(--ad-border);
        border-radius: var(--ad-radius); overflow: hidden;
    }
    .dc-tab-header {
        background: linear-gradient(135deg, #111111 0%, #1C1C1C 100%);
        padding: 0 1.5rem; display: flex; gap: 0;
        border-bottom: 1px solid var(--ad-border);
    }
    .dc-tab-btn {
        padding: 1rem 1.25rem; background: none; border: none;
        border-bottom: 3px solid transparent; color: var(--ad-muted);
        font-family: 'Manrope', sans-serif; font-size: .875rem; font-weight: 600;
        cursor: pointer; display: flex; align-items: center; gap: .45rem;
        transition: color .2s, border-color .2s; white-space: nowrap;
    }
    .dc-tab-btn:hover { color: var(--ad-text); }
    .dc-tab-btn.active { color: #FF4F1F; border-bottom-color: var(--ad-accent); }
    .dc-tab-btn i { font-size: .8rem; }

    .dc-tab-body { padding: 2rem 1.75rem; }
    .dc-tab-pane { display: none; }
    .dc-tab-pane.active { display: block; }

    /* ── Form controls ── */
    .dc-section-title {
        color: var(--ad-text); font-family: 'Manrope', sans-serif;
        font-size: .95rem; font-weight: 700; margin-bottom: 1.25rem;
        padding-bottom: .6rem; border-bottom: 1px solid var(--ad-border);
        display: flex; align-items: center; gap: .5rem;
    }
    .dc-section-title i { color: #FF4F1F; }

    .dc-form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.25rem; }
    @media (max-width: 640px) { .dc-form-grid-2 { grid-template-columns: 1fr; } }

    .dc-field { display: flex; flex-direction: column; gap: .4rem; }
    .dc-field.full { grid-column: 1 / -1; }

    .dc-label {
        font-size: .78rem; font-weight: 600; color: var(--ad-muted);
        letter-spacing: .04em; text-transform: uppercase;
    }
    .dc-label .req { color: #EF4444; margin-left: 2px; }

    .dc-input {
        background: var(--ad-input-bg); border: 1px solid var(--ad-border);
        border-radius: 8px; color: var(--ad-text); padding: .6rem .9rem;
        font-size: .875rem; transition: border-color .2s, background .2s; width: 100%;
    }
    .dc-input::placeholder { color: rgba(163,163,163,0.4); }
    .dc-input:focus {
        outline: none; border-color: var(--ad-accent);
        background: rgba(17,17,17,0.06);
        box-shadow: 0 0 0 3px rgba(17,17,17,0.15);
    }
    .dc-input.is-invalid { border-color: #EF4444; }
    .dc-input-hint { font-size: .73rem; color: var(--ad-muted); margin-top: .2rem; }
    .dc-error { font-size: .76rem; color: #F87171; margin-top: .2rem; }

    /* Password wrapper */
    .dc-pw-wrap { position: relative; }
    .dc-pw-wrap .dc-input { padding-right: 2.5rem; }
    .dc-pw-toggle {
        position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: var(--ad-muted);
        cursor: pointer; font-size: .85rem; padding: 0; line-height: 1;
    }
    .dc-pw-toggle:hover { color: var(--ad-text); }

    /* Password strength bar */
    .dc-strength-bar { height: 4px; border-radius: 4px; margin-top: .5rem; background: rgba(163,163,163,0.1); overflow: hidden; }
    .dc-strength-fill { height: 100%; border-radius: 4px; width: 0; transition: width .35s, background .35s; }

    /* Security notice */
    .dc-security-notice {
        background: rgba(17,17,17,0.07); border: 1px solid rgba(17,17,17,0.2);
        border-radius: 10px; padding: .9rem 1.1rem; margin-bottom: 1.5rem;
        display: flex; align-items: flex-start; gap: .65rem;
        color: #FFE6DC; font-size: .8rem; line-height: 1.5;
    }
    .dc-security-notice i { margin-top: .1rem; flex-shrink: 0; }

    /* Submit row */
    .dc-submit-row { margin-top: 1.75rem; display: flex; justify-content: flex-end; gap: .75rem; }
    .dc-btn-ghost {
        padding: .55rem 1.25rem; border-radius: 8px;
        border: 1px solid var(--ad-border); background: transparent;
        color: var(--ad-muted); font-size: .85rem; font-weight: 600; cursor: pointer;
        transition: border-color .2s, color .2s; text-decoration: none;
        display: inline-flex; align-items: center; gap: .4rem;
    }
    .dc-btn-ghost:hover { border-color: rgba(163,163,163,0.3); color: var(--ad-text); }
    .dc-btn-primary {
        padding: .55rem 1.5rem; border-radius: 8px; border: none;
        background: linear-gradient(135deg, var(--ad-accent), var(--ad-accent-dk));
        color: #fff; font-size: .875rem; font-weight: 700; cursor: pointer;
        display: inline-flex; align-items: center; gap: .45rem;
        transition: opacity .2s, transform .1s; font-family: 'Manrope', sans-serif;
    }
    .dc-btn-primary:hover { opacity: .88; }
    .dc-btn-primary:active { transform: scale(.98); }
    .dc-btn-primary:disabled { opacity: .55; cursor: not-allowed; }

    /* Alerts */
    .dc-alert {
        border-radius: 10px; padding: .85rem 1.1rem; margin-bottom: 1.5rem;
        display: flex; align-items: center; gap: .65rem;
        font-size: .85rem; font-weight: 500;
    }
    .dc-alert-success { background: rgba(5,150,105,0.12); border: 1px solid rgba(5,150,105,0.3); color: #34D399; }
    .dc-alert-error   { background: rgba(239,68,68,0.1);  border: 1px solid rgba(239,68,68,0.25); color: #FCA5A5; }
    .dc-alert .dc-alert-close {
        margin-left: auto; background: none; border: none;
        color: inherit; opacity: .6; cursor: pointer; padding: 0; font-size: .8rem;
    }
</style>

<div class="content-wrapper" style="background: var(--ad-surface, #111827);">

    
    <div class="dc-profile-hero">
        <h1><i class="fas fa-user-circle me-2" style="color: #FF4F1F;"></i> My Profile</h1>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="${route('admin.home')}">Dashboard</a></li>
                <li class="breadcrumb-item active">Profile</li>
            </ol>
        </nav>
    </div>

    <div style="padding: 0 1.5rem 3rem;">
        <div class="dc-profile-grid">

            
            <div class="dc-side-card">
                <div class="dc-side-card-top">
                    <div class="dc-avatar-lg" style="background: ${avatarColor};">${initials}</div>
                    <div class="dc-side-name">${user?.name}</div>
                    ${(user?.username) ? html`                        <div class="dc-side-role">${'@'  +  (user?.username ?? '')}</div>
                    ` : ''}                    <span class="dc-side-badge"><i class="fas fa-shield-alt me-1"></i>Admin</span>
                </div>

                <hr class="dc-side-divider">

                <div class="dc-side-meta">
                    <div class="dc-meta-row">
                        <i class="fas fa-envelope"></i>
                        <span>${user?.email}</span>
                    </div>
                    ${(displayPhone) ? html`                    <div class="dc-meta-row">
                        <i class="fas fa-phone-alt"></i>
                        <span>${displayPhone}</span>
                    </div>
                    ` : ''}                    <div class="dc-meta-row">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Joined ${user?.created_at?.format('M d, Y')}</span>
                    </div>
                    ${(user?.last_login_at) ? html`                    <div class="dc-meta-row">
                        <i class="fas fa-clock"></i>
                        <span>Last login ${Carbon.parse(user?.last_login_at)?.diffForHumans()}</span>
                    </div>
                    ` : ''}                </div>

                <hr class="dc-side-divider">

                <div class="dc-side-footer">
                    <a href="${route('admin.admins.index')}" class="dc-manage-btn">
                        <i class="fas fa-users-cog"></i> Manage Admin Users
                    </a>
                </div>
            </div>

            
            <div class="dc-main-card">

                
                <div class="dc-tab-header">
                    <button class="dc-tab-btn active" onclick="dcSwitchTab('info', this)">
                        <i class="fas fa-id-card"></i> Personal Info
                    </button>
                    <button class="dc-tab-btn" onclick="dcSwitchTab('security', this)">
                        <i class="fas fa-lock"></i> Security
                    </button>
                </div>

                <div class="dc-tab-body">

                    
                    ${(session('success')) ? html`                    <div class="dc-alert dc-alert-success">
                        <i class="fas fa-check-circle"></i> ${session('success')}
                        <button class="dc-alert-close" onclick="this.closest('.dc-alert').remove()"><i class="fas fa-times"></i></button>
                    </div>
                    ` : ''}                    ${(session('error')) ? html`                    <div class="dc-alert dc-alert-error">
                        <i class="fas fa-exclamation-circle"></i> ${session('error')}
                        <button class="dc-alert-close" onclick="this.closest('.dc-alert').remove()"><i class="fas fa-times"></i></button>
                    </div>
                    ` : ''}
                    <form action="${route('admin.updateprofile')}" method="POST" id="profile-form">
                        ${csrf_field()}                        <input type="hidden" name="id" value="${user?.id}">

                        
                        <div class="dc-tab-pane active" id="dc-tab-info">

                            <div class="dc-section-title">
                                <i class="fas fa-user"></i> Account Details
                            </div>

                            <div class="dc-form-grid-2">

                                
                                <div class="dc-field">
                                    <label class="dc-label">Full Name <span class="req">*</span></label>
                                    <input type="text" name="name" class="dc-input ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html` is-invalid `; })() : ''}"
                                           value="${old('name', user?.name)}" placeholder="Your full name" required>
                                    ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html` <span class="dc-error">${message}</span> `; })() : ''}                                </div>

                                
                                <div class="dc-field">
                                    <label class="dc-label">Username</label>
                                    <input type="text" name="username" class="dc-input ${(errors.has('username')) ? (() => { const message = errors.first('username');  return html` is-invalid `; })() : ''}"
                                           value="${old('username', user?.username)}" placeholder="e.g. john_doe">
                                    ${(errors.has('username')) ? (() => { const message = errors.first('username');  return html` <span class="dc-error">${message}</span> `; })() : ''}                                    <span class="dc-input-hint">Letters, numbers, dashes, underscores. Min 3 chars.</span>
                                </div>

                                
                                <div class="dc-field">
                                    <label class="dc-label">Email Address <span class="req">*</span></label>
                                    <input type="email" name="email" class="dc-input ${(errors.has('email')) ? (() => { const message = errors.first('email');  return html` is-invalid `; })() : ''}"
                                           value="${old('email', user?.email)}" placeholder="you@example.com" required>
                                    ${(errors.has('email')) ? (() => { const message = errors.first('email');  return html` <span class="dc-error">${message}</span> `; })() : ''}                                </div>

                                
                                <div class="dc-field">
                                    <label class="dc-label">Phone Number</label>
                                    <input type="text" name="phone" class="dc-input ${(errors.has('phone')) ? (() => { const message = errors.first('phone');  return html` is-invalid `; })() : ''}"
                                           value="${old('phone', displayPhone)}" placeholder="03XXXXXXXXX">
                                    ${(errors.has('phone')) ? (() => { const message = errors.first('phone');  return html` <span class="dc-error">${message}</span> `; })() : ''}                                    <span class="dc-input-hint">Pakistan format: 03XXXXXXXXX or +923XXXXXXXXX</span>
                                </div>

                            </div>

                            <div class="dc-submit-row">
                                <button type="submit" name="_tab" value="info" class="dc-btn-primary" id="save-info-btn">
                                    <i class="fas fa-save"></i> Save Changes
                                </button>
                            </div>
                        </div>

                        
                        <div class="dc-tab-pane" id="dc-tab-security">

                            <div class="dc-security-notice">
                                <i class="fas fa-info-circle"></i>
                                Leave all password fields empty if you don't want to change your password. All three fields are required when changing.
                            </div>

                            <div class="dc-section-title">
                                <i class="fas fa-key"></i> Change Password
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 460px;">

                                
                                <div class="dc-field">
                                    <label class="dc-label">Current Password</label>
                                    <div class="dc-pw-wrap">
                                        <input type="password" name="current_password" id="cur-pw"
                                               class="dc-input ${(errors.has('current_password')) ? (() => { const message = errors.first('current_password');  return html` is-invalid `; })() : ''}"
                                               placeholder="Enter your current password" autocomplete="current-password">
                                        <button type="button" class="dc-pw-toggle" onclick="dcTogglePw('cur-pw', this)">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    ${(errors.has('current_password')) ? (() => { const message = errors.first('current_password');  return html` <span class="dc-error">${message}</span> `; })() : ''}                                </div>

                                
                                <div class="dc-field">
                                    <label class="dc-label">New Password</label>
                                    <div class="dc-pw-wrap">
                                        <input type="password" name="new_password" id="new-pw"
                                               class="dc-input ${(errors.has('new_password')) ? (() => { const message = errors.first('new_password');  return html` is-invalid `; })() : ''}"
                                               placeholder="At least 8 characters"
                                               autocomplete="new-password"
                                               oninput="dcCheckStrength(this.value)">
                                        <button type="button" class="dc-pw-toggle" onclick="dcTogglePw('new-pw', this)">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <div class="dc-strength-bar"><div class="dc-strength-fill" id="strength-fill"></div></div>
                                    <span class="dc-input-hint" id="strength-label"></span>
                                    ${(errors.has('new_password')) ? (() => { const message = errors.first('new_password');  return html` <span class="dc-error">${message}</span> `; })() : ''}                                </div>

                                
                                <div class="dc-field">
                                    <label class="dc-label">Confirm New Password</label>
                                    <div class="dc-pw-wrap">
                                        <input type="password" name="new_password_confirmation" id="conf-pw"
                                               class="dc-input"
                                               placeholder="Repeat new password"
                                               autocomplete="new-password">
                                        <button type="button" class="dc-pw-toggle" onclick="dcTogglePw('conf-pw', this)">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                            </div>

                            <div class="dc-submit-row">
                                <button type="submit" name="_tab" value="security" class="dc-btn-primary" id="save-sec-btn">
                                    <i class="fas fa-lock"></i> Update Password
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>

        </div>
    </div>
</div>

<script>
    /* ── Tab switching ── */
    function dcSwitchTab(id, btn) {
        document.querySelectorAll('.dc-tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.dc-tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('dc-tab-' + id).classList.add('active');
        btn.classList.add('active');
    }

    /* ── On load: if validation errors exist for password fields, switch to security tab ── */
    ${(errors?.has('current_password') || errors?.has('new_password')) ? html`    document.querySelectorAll('.dc-tab-btn')[1].click();
    ` : ''}
    /* ── Password toggle ── */
    function dcTogglePw(inputId, btn) {
        const input = document.getElementById(inputId);
        const icon  = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    /* ── Password strength ── */
    function dcCheckStrength(val) {
        const fill  = document.getElementById('strength-fill');
        const label = document.getElementById('strength-label');
        if (!val) { fill.style.width = '0'; label.textContent = ''; return; }
        let score = 0;
        if (val.length >= 8)  score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        const map = [
            { w: '20%', c: '#e74c3c', t: 'Very weak' },
            { w: '40%', c: '#e67e22', t: 'Weak' },
            { w: '65%', c: '#f1c40f', t: 'Fair' },
            { w: '85%', c: '#2ecc71', t: 'Strong' },
            { w: '100%', c: '#27ae60', t: 'Very strong' },
        ];
        const s = map[score] ?? map[0];
        fill.style.width = s.w;
        fill.style.background = s.c;
        label.textContent = s.t;
        label.style.color = s.c;
    }

    /* ── Submit spinner ── */
    document.getElementById('profile-form').addEventListener('submit', function (e) {
        const tab = document.querySelector('input[name="_tab"]') ??
                    document.querySelector('.dc-tab-pane.active button[type="submit"]');
        const btn = this.querySelector('.dc-tab-pane.active button[type="submit"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving…'; }
    });
</script>
`,
    scripts: html``,
  };
}
