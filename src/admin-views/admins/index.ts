// Port of resources/views/adminside/admins/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, old, session, csrf_field, method_field, Auth, Carbon, now, collect, count, empty, strtoupper, strtolower, trim, substr, explode, max, min, e, optional, blank, Str, foreach, User, addslashes } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { users, initials, w, palette, bg, lastLogin, loginClass, loginIcon, loginText } = d;

  return {
    title: html`    <title>Admin Users — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Manage administrator accounts, roles and access permissions for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="admin users, staff accounts, roles, permissions, user management, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
/* ═══════════════════════════════════════════════════════════════
   ADMIN USERS — Luxury Professional Theme
═══════════════════════════════════════════════════════════════ */

:root {
    --au-navy:       #070D1A;
    --au-navy-2:     #0D1526;
    --au-navy-3:     #111D35;
    --au-blue:       #111111;
    --au-blue-lt:    #FF4F1F;
    --au-blue-dk:    #2A2A2A;
    --au-blue-bg:    rgba(17,17,17,0.10);
    --au-surface:    #ffffff;
    --au-border:     #E8EDF5;
    --au-text:       #111111;
    --au-muted:      #737373;
    --au-light:      #FAFAFA;
}

/* ── Shell ── */
.au-page { padding: 32px 32px 72px; }

/* ═══ HERO ═══ */
.au-hero {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--au-navy) 0%, var(--au-navy-3) 55%, #0A1628 100%);
    border-radius: 20px;
    padding: 40px 44px 44px;
    margin-bottom: 28px;
    border: 1px solid rgba(17,17,17,0.14);
}
.au-hero::before {
    content: '';
    position: absolute; inset: 0; z-index: 0;
    background:
        radial-gradient(ellipse 55% 90% at 95% 40%, rgba(17,17,17,0.18) 0%, transparent 65%),
        radial-gradient(ellipse 40% 60% at 10% 80%, rgba(99,102,241,0.12) 0%, transparent 60%);
}
.au-hero::after {
    content: '';
    position: absolute; inset: 0; z-index: 0;
    background-image:
        linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
    background-size: 32px 32px;
}
.au-hero > * { position: relative; z-index: 1; }

.au-hero-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
.au-hero-left {}
.au-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.68rem; font-weight: 600; letter-spacing: .2em;
    text-transform: uppercase; color: var(--au-blue-lt);
    margin-bottom: 10px;
}
.au-hero-eyebrow::before {
    content: ''; display: block; width: 22px; height: 1.5px;
    background: linear-gradient(90deg, var(--au-blue-lt), transparent);
}
.au-hero-title {
    font-size: 2.1rem; font-weight: 800; color: #F4F4F4;
    letter-spacing: -.02em; margin: 0 0 6px; line-height: 1.1;
}
.au-hero-title span { color: var(--au-blue-lt); }
.au-hero-sub { font-size: .84rem; color: rgba(163,163,163,.65); font-weight: 400; margin: 0; }

.au-hero-btn {
    display: inline-flex; align-items: center; gap: 9px;
    background: var(--au-blue); color: #fff;
    border: none; border-radius: 12px; padding: 12px 24px;
    font-size: .84rem; font-weight: 700; cursor: pointer; white-space: nowrap;
    box-shadow: 0 0 0 1px rgba(17,17,17,0.4), 0 8px 24px rgba(17,17,17,0.28);
    transition: background .2s, transform .15s, box-shadow .2s;
    letter-spacing: .02em;
}
.au-hero-btn:hover {
    background: var(--au-blue-dk);
    transform: translateY(-2px);
    box-shadow: 0 0 0 1px rgba(17,17,17,0.5), 0 12px 32px rgba(17,17,17,0.35);
}
.au-hero-btn:active { transform: translateY(0); }

/* Stats strip */
.au-stats-row {
    display: flex; gap: 16px; margin-top: 30px; flex-wrap: wrap;
}
.au-stat-card {
    flex: 1; min-width: 140px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 16px 20px;
    display: flex; align-items: center; gap: 14px;
    transition: background .2s, border-color .2s;
}
.au-stat-card:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(17,17,17,0.25);
}
.au-stat-ico {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 1rem;
}
.au-stat-ico.s-blue   { background: rgba(17,17,17,.2);  color: #FF4F1F; }
.au-stat-ico.s-green  { background: rgba(16,185,129,.18); color: #34D399; }
.au-stat-ico.s-violet { background: rgba(139,92,246,.18); color: #A78BFA; }
.au-stat-num { font-size: 1.55rem; font-weight: 800; color: #F4F4F4; line-height: 1; letter-spacing: -.02em; }
.au-stat-lbl { font-size: .68rem; color: #525252; text-transform: uppercase; letter-spacing: .12em; margin-top: 3px; }

/* ═══ TOOLBAR ═══ */
.au-toolbar {
    display: flex; align-items: center; gap: 12px;
    flex-wrap: wrap; margin-bottom: 20px;
}
.au-search-wrap { flex: 1; min-width: 240px; position: relative; }
.au-search-wrap i {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #9CA3AF; font-size: .8rem; pointer-events: none;
}
.au-search {
    width: 100%; padding: 11px 14px 11px 40px;
    border: 1.5px solid var(--au-border); border-radius: 12px;
    font-size: .84rem; background: #fff; color: var(--au-text);
    transition: border-color .2s, box-shadow .2s;
    box-shadow: 0 1px 4px rgba(15,23,42,0.04);
}
.au-search:focus {
    outline: none; border-color: var(--au-blue);
    box-shadow: 0 0 0 3px rgba(17,17,17,.12);
}
.au-search::placeholder { color: #B0BAC9; }

/* ═══ TABLE CARD ═══ */
.au-card {
    background: var(--au-surface);
    border: 1px solid var(--au-border);
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04);
}
.au-card-hd {
    padding: 18px 28px;
    border-bottom: 1px solid #F4F4F4;
    display: flex; align-items: center; justify-content: space-between;
    background: #FAFBFE;
}
.au-card-title {
    font-size: .72rem; font-weight: 800; color: #A3A3A3;
    text-transform: uppercase; letter-spacing: .14em;
}
.au-count-pill {
    background: var(--au-blue-bg); color: var(--au-blue);
    font-size: .72rem; font-weight: 700; padding: 4px 12px;
    border-radius: 20px; border: 1px solid rgba(17,17,17,.15);
}

/* ═══ TABLE ═══ */
.au-tbl { width: 100%; border-collapse: collapse; }
.au-tbl thead th {
    padding: 12px 22px;
    background: #FAFAFA;
    font-size: .69rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: .12em;
    color: #A0AEC0; border-bottom: 1px solid #EEF2F7;
    white-space: nowrap;
}
.au-tbl tbody tr {
    border-bottom: 1px solid #F3F6FA;
    transition: background .15s;
}
.au-tbl tbody tr:last-child { border-bottom: none; }
.au-tbl tbody tr:hover { background: #F6F9FF; }
.au-tbl tbody td { padding: 16px 22px; vertical-align: middle; }

/* ── Avatar ── */
.au-avatar-wrap { position: relative; flex-shrink: 0; }
.au-avatar {
    width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: .78rem; font-weight: 800; color: #fff;
    text-transform: uppercase; letter-spacing: .03em;
}
.au-avatar-ring {
    position: absolute; inset: -2px;
    border-radius: 13px;
    background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.12);
    pointer-events: none;
}

/* ── User cell ── */
.au-user-cell { display: flex; align-items: center; gap: 14px; }
.au-user-name {
    font-size: .875rem; font-weight: 700; color: #111111; line-height: 1.25;
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.au-user-handle { font-size: .74rem; color: #A3A3A3; margin-top: 2px; font-weight: 500; }

/* ── "You" badge ── */
.badge-you {
    font-size: .58rem; font-weight: 800; padding: 2px 7px; border-radius: 5px;
    background: rgba(17,17,17,0.1); color: #111111;
    text-transform: uppercase; letter-spacing: .08em;
    border: 1px solid rgba(17,17,17,0.2);
}

/* ── Meta text ── */
.au-td-primary { font-size: .84rem; color: #1C1C1C; font-weight: 500; }
.au-td-muted   { font-size: .78rem; color: #A3A3A3; }

/* ── Last Login pill ── */
.au-login-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: .74rem; font-weight: 500; padding: 4px 10px;
    border-radius: 20px; white-space: nowrap;
}
.au-login-pill.recent  { background: #F0FDF4; color: #16A34A; }
.au-login-pill.older   { background: #FAFAFA; color: #737373; }
.au-login-pill.never   { background: #FFF7ED; color: #D97706; }
.au-login-pill i { font-size: .64rem; }

/* ── Actions ── */
.au-actions { display: flex; gap: 7px; align-items: center; justify-content: flex-end; }
.btn-au {
    width: 34px; height: 34px; border-radius: 10px; border: 1px solid transparent;
    display: flex; align-items: center; justify-content: center;
    font-size: .78rem; cursor: pointer; transition: all .15s;
}
.btn-au-edit { background: #F3F0E9; color: var(--au-blue); border-color: #E9E4D9; }
.btn-au-edit:hover { background: var(--au-blue); color: #fff; border-color: var(--au-blue); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(17,17,17,.3); }
.btn-au-del  { background: #FFF1F2; color: #EF4444; border-color: #FEE2E2; }
.btn-au-del:hover  { background: #EF4444; color: #fff; border-color: #EF4444; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,.28); }
.btn-au[disabled]  { opacity: .3; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

/* ── Empty state ── */
.au-empty { text-align: center; padding: 72px 24px; }
.au-empty-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: #F4F4F4; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px; font-size: 1.8rem; color: #D4D4D4;
}
.au-empty-title { font-size: 1rem; font-weight: 700; color: #525252; margin-bottom: 6px; }
.au-empty-sub { font-size: .84rem; color: #A3A3A3; }

/* ═══ MODALS ═══ */
.au-modal .modal-content {
    border: none; border-radius: 22px;
    box-shadow: 0 32px 100px rgba(7,13,26,.28), 0 4px 24px rgba(7,13,26,.12);
    overflow: hidden;
}
.au-modal-hd {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--au-navy) 0%, var(--au-navy-3) 100%);
    padding: 24px 30px; display: flex; align-items: center; gap: 16px;
    border-bottom: none;
}
.au-modal-hd::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 80% at 90% 50%, rgba(17,17,17,.15), transparent 65%);
    pointer-events: none;
}
.au-modal-hd::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
        linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
}
.au-modal-hd > * { position: relative; z-index: 1; }
.au-modal-ico {
    width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
    background: rgba(17,17,17,.2); color: #FF4F1F;
    border: 1px solid rgba(17,17,17,.25);
    display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.au-modal-title { font-size: 1.05rem; font-weight: 800; color: #F4F4F4; margin: 0; letter-spacing: -.01em; }
.au-modal-sub   { font-size: .73rem; color: rgba(163,163,163,.65); margin-top: 2px; }
.au-modal-x {
    margin-left: auto; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
    color: rgba(255,255,255,.45); width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    transition: background .2s, color .2s; font-size: .78rem;
}
.au-modal-x:hover { background: rgba(255,255,255,.14); color: #fff; }

.au-modal .modal-body   { padding: 28px 30px; }
.au-modal .modal-footer { padding: 18px 30px 26px; border-top: 1px solid #F4F4F4; background: #FAFBFE; gap: 10px; }

/* ── Fields ── */
.au-field { margin-bottom: 18px; }
.au-lbl {
    display: block; font-size: .74rem; font-weight: 700;
    color: #374151; margin-bottom: 7px; letter-spacing: .02em;
}
.au-lbl .req { color: #EF4444; margin-left: 2px; }
.au-lbl .opt { color: #9CA3AF; font-weight: 400; font-size: .7rem; margin-left: 4px; }
.au-inp {
    width: 100%; padding: 11px 15px;
    border: 1.5px solid #E5E5E5; border-radius: 11px;
    font-size: .855rem; color: #1C1C1C;
    background: #fff;
    transition: border-color .2s, box-shadow .2s;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
}
.au-inp:focus {
    outline: none; border-color: var(--au-blue);
    box-shadow: 0 0 0 3px rgba(17,17,17,.13), 0 1px 3px rgba(15,23,42,0.04);
}
.au-inp.is-invalid { border-color: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,.1); }
.au-inp::placeholder { color: #C0CADB; }

.au-inp-wrap { position: relative; }
.au-inp-wrap .au-inp  { padding-left: 40px; }
.au-inp-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #B0BAC9; font-size: .8rem; pointer-events: none;
}
.au-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.au-hint { font-size: .71rem; color: #A0AEC0; margin-top: 5px; }
.au-err  { font-size: .74rem; color: #EF4444; margin-top: 5px; font-weight: 500; }

/* ── Section separator ── */
.au-sep {
    display: flex; align-items: center; gap: 10px;
    font-size: .68rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: .12em; color: #A3A3A3; margin: 22px 0 18px;
}
.au-sep i { color: var(--au-blue); font-size: .8rem; }
.au-sep::after { content: ''; flex: 1; height: 1px; background: #EEF2F7; }

/* ── Password toggle ── */
.pass-wrap { position: relative; }
.pass-wrap .au-inp { padding-right: 42px; }
.pass-tog {
    position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #B0BAC9; cursor: pointer;
    padding: 0; font-size: .8rem; transition: color .2s;
}
.pass-tog:hover { color: #525252; }

/* ── Buttons ── */
.btn-lx {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: .84rem; font-weight: 700; border-radius: 11px;
    padding: 11px 24px; border: none; cursor: pointer;
    transition: all .18s; white-space: nowrap; letter-spacing: .01em;
}
.btn-lx-primary {
    background: var(--au-blue); color: #fff;
    box-shadow: 0 4px 14px rgba(17,17,17,.3);
}
.btn-lx-primary:hover { background: var(--au-blue-dk); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(17,17,17,.38); }
.btn-lx-ghost  { background: #F3F4F6; color: #374151; border: 1.5px solid #E5E5E5; }
.btn-lx-ghost:hover { background: #E9ECF0; }
.btn-lx-danger { background: #EF4444; color: #fff; box-shadow: 0 4px 14px rgba(239,68,68,.28); }
.btn-lx-danger:hover { background: #DC2626; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,.36); }

/* ── Delete modal ── */
.del-modal .modal-content { border-radius: 22px; border: none; overflow: hidden; box-shadow: 0 32px 100px rgba(7,13,26,.25); }
.del-body { padding: 40px 36px 28px; text-align: center; }
.del-ico {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, #FFF1F2, #FFE4E6);
    border: 1px solid #FEE2E2;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 1.7rem; color: #EF4444;
}
.del-title { font-size: 1.15rem; font-weight: 800; color: #111111; margin-bottom: 8px; letter-spacing: -.01em; }
.del-msg   { font-size: .85rem; color: #737373; margin-bottom: 0; line-height: 1.6; }
.del-name  { font-weight: 700; color: #1C1C1C; }
.del-warn  { font-size: .75rem; color: #EF4444; margin-top: 6px; display: block; }
.del-foot  { padding: 0 36px 32px; display: flex; gap: 10px; justify-content: center; }

/* ── Flash alerts ── */
.au-alert {
    border-radius: 14px; padding: 14px 20px; font-size: .84rem;
    margin-bottom: 22px; display: flex; align-items: center; gap: 12px;
    font-weight: 500;
}
.au-alert.success {
    background: #F0FDF4; color: #15803D;
    border: 1px solid #BBF7D0; border-left: 4px solid #22C55E;
}
.au-alert.error {
    background: #FFF1F2; color: #DC2626;
    border: 1px solid #FECDD3; border-left: 4px solid #EF4444;
}
.au-alert i { font-size: .9rem; flex-shrink: 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
    .au-page { padding: 20px 16px 60px; }
    .au-hero { padding: 28px 24px 32px; }
    .au-hero-title { font-size: 1.6rem; }
    .au-stats-row { gap: 10px; }
    .au-stat-card { min-width: 120px; padding: 12px 14px; }
    .au-grid2 { grid-template-columns: 1fr; gap: 0; }
    .au-tbl thead th:nth-child(3),
    .au-tbl tbody td:nth-child(3),
    .au-tbl thead th:nth-child(4),
    .au-tbl tbody td:nth-child(4) { display: none; }
}
</style>

<div class="content-wrapper">
<div class="au-page">

    
    ${(session('success')) ? html`    <div class="au-alert success">
        <i class="fas fa-check-circle"></i>${session('success')}
    </div>
    ` : ''}    ${(session('error')) ? html`    <div class="au-alert error">
        <i class="fas fa-exclamation-circle"></i>${session('error')}
    </div>
    ` : ''}
    
    <div class="au-hero">
        <div class="au-hero-top">
            <div class="au-hero-left">
                <div class="au-hero-eyebrow">${companySetting?.company_name ?? 'AGA Collections'}</div>
                <h1 class="au-hero-title">User <span>Management</span></h1>
                <p class="au-hero-sub">Create, edit and manage all admin accounts from one place.</p>
            </div>
            <button class="au-hero-btn" data-bs-toggle="modal" data-bs-target="#createModal">
                <i class="fas fa-user-plus"></i> Add New User
            </button>
        </div>

        <div class="au-stats-row">
            <div class="au-stat-card">
                <div class="au-stat-ico s-blue"><i class="fas fa-users"></i></div>
                <div>
                    <div class="au-stat-num">${users?.count()}</div>
                    <div class="au-stat-lbl">Total Users</div>
                </div>
            </div>
            <div class="au-stat-card">
                <div class="au-stat-ico s-green"><i class="fas fa-user-check"></i></div>
                <div>
                    <div class="au-stat-num">${users?.whereNotNull('last_login_at')?.count()}</div>
                    <div class="au-stat-lbl">Ever Logged In</div>
                </div>
            </div>
            <div class="au-stat-card">
                <div class="au-stat-ico s-violet"><i class="fas fa-user-clock"></i></div>
                <div>
                    <div class="au-stat-num">${users?.where('created_at', '>=', now()?.subDays(7))?.count()}</div>
                    <div class="au-stat-lbl">New This Week</div>
                </div>
            </div>
        </div>
    </div>

    
    <div class="au-toolbar">
        <div class="au-search-wrap">
            <i class="fas fa-search"></i>
            <input type="text" id="userSearch" class="au-search" placeholder="Search by name, email or username…">
        </div>
    </div>

    
    <div class="au-card">
        <div class="au-card-hd">
            <span class="au-card-title">All Admin Users</span>
            <span class="au-count-pill">${users?.count()} ${Str.plural('user', users?.count())}</span>
        </div>
        <div class="table-responsive">
            <table class="au-tbl" id="usersTable">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Last Login</th>
                        <th style="text-align:right; padding-right:28px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                ${count(users) ? foreach(users, (user, loop) => { let initials = collect(explode(' ', trim(user?.name)))?.take(2)?.map((w) => strtoupper(substr(w,0,1)))?.implode('');
let palette = ['#111111','#7C3AED','#059669','#0891B2','#6366F1','#0D9488','#DC2626','#D97706'];
let bg = palette?.[user?.id % count(palette)];
let lastLogin = user?.last_login_at ? Carbon.parse(user?.last_login_at) : null;
let loginClass, loginIcon, loginText;
if (!lastLogin) {
  loginClass = 'never'; loginIcon = 'fa-clock'; loginText = 'Never';
} else if (lastLogin?.gt(now()?.subDays(3))) {
  loginClass = 'recent'; loginIcon = 'fa-circle'; loginText = lastLogin?.diffForHumans();
} else {
  loginClass = 'older'; loginIcon = 'fa-history'; loginText = lastLogin?.diffForHumans();
}
 return html`                                <tr class="user-row"
                    data-name="${strtolower(user?.name)}"
                    data-email="${strtolower(user?.email)}"
                    data-username="${strtolower(user?.username ?? '')}">

                    
                    <td>
                        <div class="au-user-cell">
                            <div class="au-avatar-wrap">
                                <div class="au-avatar" style="background: linear-gradient(135deg, ${bg}, ${bg}cc);">${initials}</div>
                                <div class="au-avatar-ring"></div>
                            </div>
                            <div>
                                <div class="au-user-name">
                                    ${user?.name}
                                    ${(user?.id === Auth.id()) ? html`                                        <span class="badge-you">You</span>
                                    ` : ''}                                </div>
                                ${(user?.username) ? html`                                <div class="au-user-handle">${'@'  +  (user?.username ?? '')}</div>
                                ` : ''}                            </div>
                        </div>
                    </td>

                    
                    <td>
                        <div class="au-td-primary">${user?.email}</div>
                    </td>

                    
                    <td>
                        <div class="au-td-muted">
                            ${user?.phone ? '0' + (user?.phone ?? '') : '—'}
                        </div>
                    </td>

                    
                    <td>
                        <div class="au-td-muted" style="white-space:nowrap;">
                            ${user?.created_at ? user?.created_at?.format('d M Y') : '—'}
                        </div>
                    </td>

                    
                    <td>
                        <span class="au-login-pill ${loginClass}">
                            <i class="fas ${loginIcon}"></i>
                            ${loginText}
                        </span>
                    </td>

                    
                    <td>
                        <div class="au-actions">
                            <button class="btn-au btn-au-edit" title="Edit user"
                                onclick="openEdit(${user?.id}, '${addslashes(user?.name)}', '${addslashes(user?.username ?? '')}', '${addslashes(user?.email)}', '${user?.phone ? '0' + (user?.phone ?? '') : ''}')">
                                <i class="fas fa-pen"></i>
                            </button>
                            ${(user?.id !== Auth.id()) ? html`                            <button class="btn-au btn-au-del" title="Delete user"
                                onclick="openDelete(${user?.id}, '${addslashes(user?.name)}')">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            ` : html`                            <button class="btn-au btn-au-del" disabled title="Cannot delete your own account">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            `}                        </div>
                    </td>
                </tr>
                `; }) : html`                <tr>
                    <td colspan="6">
                        <div class="au-empty">
                            <div class="au-empty-icon"><i class="fas fa-users-slash"></i></div>
                            <div class="au-empty-title">No admin users yet</div>
                            <div class="au-empty-sub">Click "Add New User" above to create the first one.</div>
                        </div>
                    </td>
                </tr>
                `}                </tbody>
            </table>
        </div>
    </div>

</div><!-- /.au-page -->
</div><!-- /.content-wrapper -->



<div class="modal fade au-modal" id="createModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <form action="${route('admin.admins.store')}" method="POST" autocomplete="off">
                ${csrf_field()}
                <div class="au-modal-hd">
                    <div class="au-modal-ico"><i class="fas fa-user-plus"></i></div>
                    <div>
                        <div class="au-modal-title">Create New Admin</div>
                        <div class="au-modal-sub">Fill in the details to add a new admin account</div>
                    </div>
                    <button type="button" class="au-modal-x" data-bs-dismiss="modal" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="modal-body">

                    <div class="au-grid2">
                        <div class="au-field">
                            <label class="au-lbl">Full Name <span class="req">*</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-user"></i>
                                <input type="text" name="adminName"
                                    class="au-inp ${(errors.has('adminName')) ? (() => { const message = errors.first('adminName');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminName')}"
                                    placeholder="e.g. Nabeel Imrani" required>
                            </div>
                            ${(errors.has('adminName')) ? (() => { const message = errors.first('adminName');  return html`<div class="au-err">${message}</div>`; })() : ''}                        </div>
                        <div class="au-field">
                            <label class="au-lbl">Username <span class="opt">(optional)</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-at"></i>
                                <input type="text" name="adminUsername"
                                    class="au-inp ${(errors.has('adminUsername')) ? (() => { const message = errors.first('adminUsername');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminUsername')}"
                                    placeholder="e.g. nabeel_imrani">
                            </div>
                            ${(errors.has('adminUsername')) ? (() => { const message = errors.first('adminUsername');  return html`<div class="au-err">${message}</div>`; })() : ''}                            <div class="au-hint">Letters, numbers, underscores and dashes only</div>
                        </div>
                    </div>

                    <div class="au-grid2">
                        <div class="au-field">
                            <label class="au-lbl">Email Address <span class="req">*</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-envelope"></i>
                                <input type="email" name="adminEmail"
                                    class="au-inp ${(errors.has('adminEmail')) ? (() => { const message = errors.first('adminEmail');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminEmail')}"
                                    placeholder="admin@example.com" required>
                            </div>
                            ${(errors.has('adminEmail')) ? (() => { const message = errors.first('adminEmail');  return html`<div class="au-err">${message}</div>`; })() : ''}                        </div>
                        <div class="au-field">
                            <label class="au-lbl">Phone <span class="opt">(Pakistan)</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-phone"></i>
                                <input type="text" name="adminPhone"
                                    class="au-inp ${(errors.has('adminPhone')) ? (() => { const message = errors.first('adminPhone');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminPhone')}"
                                    placeholder="03001234567">
                            </div>
                            ${(errors.has('adminPhone')) ? (() => { const message = errors.first('adminPhone');  return html`<div class="au-err">${message}</div>`; })() : ''}                            <div class="au-hint">Format: 03XXXXXXXXX or +923XXXXXXXXX</div>
                        </div>
                    </div>

                    <div class="au-sep"><i class="fas fa-lock"></i> Set Password</div>

                    <div class="au-grid2">
                        <div class="au-field">
                            <label class="au-lbl">Password <span class="req">*</span></label>
                            <div class="pass-wrap">
                                <input type="password" name="adminPassword" id="c_pass"
                                    class="au-inp ${(errors.has('adminPassword')) ? (() => { const message = errors.first('adminPassword');  return html` is-invalid `; })() : ''}"
                                    placeholder="Min. 8 characters" required autocomplete="new-password">
                                <button type="button" class="pass-tog" onclick="togglePass('c_pass',this)">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            ${(errors.has('adminPassword')) ? (() => { const message = errors.first('adminPassword');  return html`<div class="au-err">${message}</div>`; })() : ''}                        </div>
                        <div class="au-field">
                            <label class="au-lbl">Confirm Password <span class="req">*</span></label>
                            <div class="pass-wrap">
                                <input type="password" name="adminPassword_confirmation" id="c_pass2"
                                    class="au-inp" placeholder="Re-enter password" required autocomplete="new-password">
                                <button type="button" class="pass-tog" onclick="togglePass('c_pass2',this)">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-lx btn-lx-ghost" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn-lx btn-lx-primary">
                        <i class="fas fa-user-plus"></i> Create User
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>



<div class="modal fade au-modal" id="editModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <form id="editForm" method="POST" autocomplete="off">
                ${csrf_field()}                <input type="hidden" name="editing_id" id="e_editing_id">

                <div class="au-modal-hd">
                    <div class="au-modal-ico"><i class="fas fa-user-edit"></i></div>
                    <div>
                        <div class="au-modal-title">Edit Admin User</div>
                        <div class="au-modal-sub">Update account details</div>
                    </div>
                    <button type="button" class="au-modal-x" data-bs-dismiss="modal" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="modal-body">

                    <div class="au-grid2">
                        <div class="au-field">
                            <label class="au-lbl">Full Name <span class="req">*</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-user"></i>
                                <input type="text" name="adminName" id="e_name"
                                    class="au-inp ${(errors.has('adminName')) ? (() => { const message = errors.first('adminName');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminName')}" required>
                            </div>
                            ${(errors.has('adminName')) ? (() => { const message = errors.first('adminName');  return html`<div class="au-err">${message}</div>`; })() : ''}                        </div>
                        <div class="au-field">
                            <label class="au-lbl">Username <span class="opt">(optional)</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-at"></i>
                                <input type="text" name="adminUsername" id="e_username"
                                    class="au-inp ${(errors.has('adminUsername')) ? (() => { const message = errors.first('adminUsername');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminUsername')}">
                            </div>
                            ${(errors.has('adminUsername')) ? (() => { const message = errors.first('adminUsername');  return html`<div class="au-err">${message}</div>`; })() : ''}                        </div>
                    </div>

                    <div class="au-grid2">
                        <div class="au-field">
                            <label class="au-lbl">Email Address <span class="req">*</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-envelope"></i>
                                <input type="email" name="adminEmail" id="e_email"
                                    class="au-inp ${(errors.has('adminEmail')) ? (() => { const message = errors.first('adminEmail');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminEmail')}" required>
                            </div>
                            ${(errors.has('adminEmail')) ? (() => { const message = errors.first('adminEmail');  return html`<div class="au-err">${message}</div>`; })() : ''}                        </div>
                        <div class="au-field">
                            <label class="au-lbl">Phone <span class="opt">(Pakistan)</span></label>
                            <div class="au-inp-wrap">
                                <i class="au-inp-icon fas fa-phone"></i>
                                <input type="text" name="adminPhone" id="e_phone"
                                    class="au-inp ${(errors.has('adminPhone')) ? (() => { const message = errors.first('adminPhone');  return html` is-invalid `; })() : ''}"
                                    value="${old('adminPhone')}" placeholder="03XXXXXXXXX">
                            </div>
                            ${(errors.has('adminPhone')) ? (() => { const message = errors.first('adminPhone');  return html`<div class="au-err">${message}</div>`; })() : ''}                            <div class="au-hint">Format: 03XXXXXXXXX or +923XXXXXXXXX</div>
                        </div>
                    </div>

                    <div class="au-sep"><i class="fas fa-key"></i> Change Password <span style="font-weight:400;color:#A3A3A3;text-transform:none;letter-spacing:0;">(leave blank to keep current)</span></div>

                    <div class="au-grid2">
                        <div class="au-field">
                            <label class="au-lbl">New Password</label>
                            <div class="pass-wrap">
                                <input type="password" name="adminPassword" id="e_pass"
                                    class="au-inp ${(errors.has('adminPassword')) ? (() => { const message = errors.first('adminPassword');  return html` is-invalid `; })() : ''}"
                                    placeholder="Min. 8 characters" autocomplete="new-password">
                                <button type="button" class="pass-tog" onclick="togglePass('e_pass',this)">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            ${(errors.has('adminPassword')) ? (() => { const message = errors.first('adminPassword');  return html`<div class="au-err">${message}</div>`; })() : ''}                        </div>
                        <div class="au-field">
                            <label class="au-lbl">Confirm New Password</label>
                            <div class="pass-wrap">
                                <input type="password" name="adminPassword_confirmation" id="e_pass2"
                                    class="au-inp" placeholder="Re-enter new password" autocomplete="new-password">
                                <button type="button" class="pass-tog" onclick="togglePass('e_pass2',this)">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-lx btn-lx-ghost" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn-lx btn-lx-primary">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>



<div class="modal fade del-modal" id="deleteModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width:420px;">
        <div class="modal-content">
            <form id="deleteForm" method="POST">
                ${csrf_field()}                ${method_field('DELETE')}                <div class="del-body">
                    <div class="del-ico"><i class="fas fa-trash-alt"></i></div>
                    <div class="del-title">Delete Admin User?</div>
                    <p class="del-msg">
                        You are about to permanently delete <span class="del-name" id="delName"></span>.
                        <span class="del-warn"><i class="fas fa-exclamation-triangle me-1"></i>This action cannot be undone.</span>
                    </p>
                </div>
                <div class="del-foot">
                    <button type="button" class="btn-lx btn-lx-ghost" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn-lx btn-lx-danger">
                        <i class="fas fa-trash-alt"></i> Delete User
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>



`,
    scripts: html`<script>
const _adminBase = '${url(`/admin/admins`)}';

// ── Live search ──
document.getElementById('userSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll('#usersTable .user-row').forEach(row => {
        const hit = row.dataset.name.includes(q) ||
                    row.dataset.email.includes(q) ||
                    row.dataset.username.includes(q);
        row.style.display = hit ? '' : 'none';
    });
});

// ── Open edit modal ──
function openEdit(id, name, username, email, phone) {
    document.getElementById('e_editing_id').value = id;
    document.getElementById('e_name').value        = name;
    document.getElementById('e_username').value    = username;
    document.getElementById('e_email').value       = email;
    document.getElementById('e_phone').value       = phone;
    document.getElementById('e_pass').value        = '';
    document.getElementById('e_pass2').value       = '';
    document.getElementById('editForm').action     = _adminBase + '/' + id + '/update';
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

// ── Open delete modal ──
function openDelete(id, name) {
    document.getElementById('delName').textContent = name;
    document.getElementById('deleteForm').action   = _adminBase + '/' + id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

// ── Password toggle ──
function togglePass(id, btn) {
    const inp  = document.getElementById(id);
    const icon = btn.querySelector('i');
    if (inp.type === 'password') {
        inp.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        inp.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// ── Auto-open correct modal on validation error ──
document.addEventListener('DOMContentLoaded', () => {
    ${(errors?.any() && old('editing_id')) ? html`        const eid = '${old(`editing_id`)}';
        document.getElementById('editForm').action = _adminBase + '/' + eid + '/update';
        new bootstrap.Modal(document.getElementById('editModal')).show();
    ` : (errors?.any() && old('adminName') !== null) ? html`        new bootstrap.Modal(document.getElementById('createModal')).show();
    ` : ''}});
</script>
`,
  };
}
