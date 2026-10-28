// Port of resources/views/adminside/policies/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, session, csrf_field, method_field, count, empty, max, min, optional, Str, foreach, addslashes } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { policies } = d;

  return {
    title: html`    <title>Policies — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Manage store policies — privacy, shipping, returns, terms and refund — for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="policies, privacy policy, shipping policy, returns policy, refund policy, terms and conditions, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
/* ═══════════════════════════════════════════════
   POLICIES — Luxury Admin Theme
═══════════════════════════════════════════════ */
:root {
    --po-blue:    #111111;
    --po-blue-dk: #2A2A2A;
    --po-navy:    #070D1A;
    --po-navy2:   #111D35;
    --po-border:  #E8EDF5;
}

.po-page { padding: 32px 32px 72px; }

/* Hero */
.po-hero {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--po-navy) 0%, var(--po-navy2) 60%, #0A1628 100%);
    border-radius: 20px; padding: 36px 44px 40px;
    margin-bottom: 28px;
    border: 1px solid rgba(17,17,17,0.14);
}
.po-hero::before {
    content: ''; position: absolute; inset: 0; z-index: 0;
    background: radial-gradient(ellipse 55% 90% at 95% 40%, rgba(17,17,17,.18), transparent 65%);
}
.po-hero::after {
    content: ''; position: absolute; inset: 0; z-index: 0;
    background-image: linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
    background-size: 32px 32px;
}
.po-hero > * { position: relative; z-index: 1; }
.po-hero-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
.po-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: .68rem; font-weight: 600; letter-spacing: .2em;
    text-transform: uppercase; color: #FF4F1F; margin-bottom: 10px;
}
.po-eyebrow::before { content: ''; width: 22px; height: 1.5px; background: linear-gradient(90deg, #FF4F1F, transparent); }
.po-title { font-size: 2rem; font-weight: 800; color: #F4F4F4; letter-spacing: -.02em; margin: 0 0 6px; }
.po-title span { color: #FF4F1F; }
.po-sub { font-size: .84rem; color: rgba(163,163,163,.6); margin: 0; }

.po-hero-btn {
    display: inline-flex; align-items: center; gap: 9px;
    background: var(--po-blue); color: #fff !important; border: none; border-radius: 12px;
    padding: 12px 24px; font-size: .84rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 0 0 1px rgba(17,17,17,.4), 0 8px 24px rgba(17,17,17,.28);
    transition: all .2s; text-decoration: none !important; white-space: nowrap;
}
.po-hero-btn:hover { background: var(--po-blue-dk); transform: translateY(-2px); color: #fff !important; box-shadow: 0 0 0 1px rgba(17,17,17,.5), 0 12px 32px rgba(17,17,17,.35); }

/* Stats */
.po-stats { display: flex; gap: 16px; margin-top: 28px; flex-wrap: wrap; }
.po-stat {
    flex: 1; min-width: 120px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px; padding: 14px 18px;
    display: flex; align-items: center; gap: 12px;
    transition: background .2s;
}
.po-stat:hover { background: rgba(255,255,255,.07); border-color: rgba(17,17,17,.25); }
.po-stat-ico {
    width: 40px; height: 40px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center; font-size: .95rem; flex-shrink: 0;
}
.po-stat-ico.s-blue   { background: rgba(17,17,17,.2);  color: #FF4F1F; }
.po-stat-ico.s-green  { background: rgba(16,185,129,.18); color: #34D399; }
.po-stat-ico.s-amber  { background: rgba(245,158,11,.15); color: #FBBF24; }
.po-stat-num { font-size: 1.45rem; font-weight: 800; color: #F4F4F4; line-height: 1; }
.po-stat-lbl { font-size: .67rem; color: #525252; text-transform: uppercase; letter-spacing: .12em; margin-top: 2px; }

/* Card */
.po-card {
    background: #fff; border: 1px solid var(--po-border);
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 4px 24px rgba(15,23,42,.07);
}
.po-card-hd {
    padding: 18px 28px; border-bottom: 1px solid #F4F4F4;
    display: flex; align-items: center; justify-content: space-between;
    background: #FAFBFE;
}
.po-card-title { font-size: .72rem; font-weight: 800; color: #A3A3A3; text-transform: uppercase; letter-spacing: .14em; }
.po-count-pill {
    background: rgba(17,17,17,.08); color: var(--po-blue);
    font-size: .72rem; font-weight: 700; padding: 4px 12px;
    border-radius: 20px; border: 1px solid rgba(17,17,17,.15);
}

/* Table */
.po-tbl { width: 100%; border-collapse: collapse; }
.po-tbl thead th {
    padding: 12px 24px; background: #FAFAFA;
    font-size: .69rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .12em; color: #A0AEC0;
    border-bottom: 1px solid #EEF2F7; white-space: nowrap;
}
.po-tbl tbody tr { border-bottom: 1px solid #F3F6FA; transition: background .15s; }
.po-tbl tbody tr:last-child { border-bottom: none; }
.po-tbl tbody tr:hover { background: #F6F9FF; }
.po-tbl tbody td { padding: 18px 24px; vertical-align: middle; }

/* Policy key badge */
.po-key-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: .76rem; font-weight: 700; font-family: 'Courier New', monospace;
    background: #F4F4F4; color: #525252;
    border: 1px solid #E5E5E5; border-radius: 7px;
    padding: 4px 10px; letter-spacing: .02em;
}
.po-key-badge i { font-size: .65rem; color: #A3A3A3; }

/* Status pills */
.po-status {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: .74rem; font-weight: 700; padding: 5px 12px;
    border-radius: 20px; white-space: nowrap;
}
.po-status.published { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
.po-status.draft     { background: #FFF7ED; color: #B45309; border: 1px solid #FDE68A; }
.po-status i { font-size: .62rem; }

/* Actions */
.po-actions { display: flex; gap: 7px; align-items: center; justify-content: flex-end; }
.btn-po {
    height: 34px; border-radius: 10px; border: 1px solid transparent;
    display: inline-flex; align-items: center; gap: 7px;
    font-size: .78rem; font-weight: 600; cursor: pointer;
    padding: 0 14px; transition: all .15s; text-decoration: none; white-space: nowrap;
}
.btn-po-edit   { background: #F3F0E9; color: #111111; border-color: #E9E4D9; }
.btn-po-edit:hover { background: #111111; color: #fff; border-color: #111111; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(17,17,17,.3); }
.btn-po-del    { background: #FFF1F2; color: #EF4444; border-color: #FEE2E2; width: 34px; padding: 0; justify-content: center; }
.btn-po-del:hover  { background: #EF4444; color: #fff; border-color: #EF4444; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,.28); }
.btn-po[disabled]  { opacity: .35; cursor: not-allowed; transform: none !important; }

/* Preview link */
.po-preview-link {
    font-size: .74rem; color: #A3A3A3; text-decoration: none;
    display: inline-flex; align-items: center; gap: 5px;
    transition: color .15s;
}
.po-preview-link:hover { color: var(--po-blue); }

/* Empty */
.po-empty { text-align: center; padding: 72px 24px; }
.po-empty-icon {
    width: 72px; height: 72px; border-radius: 20px; background: #F4F4F4;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; font-size: 1.7rem; color: #D4D4D4;
}
.po-empty-title { font-size: 1rem; font-weight: 700; color: #525252; margin-bottom: 4px; }
.po-empty-sub   { font-size: .84rem; color: #A3A3A3; }

/* Flash */
.po-alert {
    border-radius: 14px; padding: 14px 20px; font-size: .84rem;
    margin-bottom: 22px; display: flex; align-items: center; gap: 12px; font-weight: 500;
}
.po-alert.success { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; border-left: 4px solid #22C55E; }
.po-alert.error   { background: #FFF1F2; color: #DC2626; border: 1px solid #FECDD3; border-left: 4px solid #EF4444; }

/* Delete modal */
.del-modal .modal-content { border-radius: 22px; border: none; overflow: hidden; box-shadow: 0 32px 100px rgba(7,13,26,.25); }
.del-body { padding: 40px 36px 28px; text-align: center; }
.del-ico {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, #FFF1F2, #FFE4E6); border: 1px solid #FEE2E2;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 1.7rem; color: #EF4444;
}
.del-title { font-size: 1.1rem; font-weight: 800; color: #111111; margin-bottom: 8px; }
.del-msg   { font-size: .85rem; color: #737373; line-height: 1.6; }
.del-name  { font-weight: 700; color: #1C1C1C; }
.del-warn  { font-size: .75rem; color: #EF4444; margin-top: 6px; display: block; }
.del-foot  { padding: 0 36px 32px; display: flex; gap: 10px; justify-content: center; }
.btn-lx {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: .84rem; font-weight: 700; border-radius: 11px;
    padding: 11px 24px; border: none; cursor: pointer; transition: all .18s;
}
.btn-lx-ghost  { background: #F3F4F6; color: #374151; border: 1.5px solid #E5E5E5; }
.btn-lx-ghost:hover { background: #E9ECF0; }
.btn-lx-danger { background: #EF4444; color: #fff; box-shadow: 0 4px 14px rgba(239,68,68,.28); }
.btn-lx-danger:hover { background: #DC2626; transform: translateY(-1px); }
</style>

<div class="content-wrapper">
<div class="po-page">

    
    ${(session('success')) ? html`    <div class="po-alert success"><i class="fas fa-check-circle"></i>${session('success')}</div>
    ` : ''}    ${(session('error')) ? html`    <div class="po-alert error"><i class="fas fa-exclamation-circle"></i>${session('error')}</div>
    ` : ''}
    
    <div class="po-hero">
        <div class="po-hero-top">
            <div>
                <div class="po-eyebrow">${companySetting?.company_name ?? 'AGA Collections'}</div>
                <h1 class="po-title">Content <span>Policies</span></h1>
                <p class="po-sub">Manage privacy, terms, return and all other policy pages shown to customers.</p>
            </div>
            <a href="${route('admin.policies.create')}" class="po-hero-btn">
                <i class="fas fa-plus"></i> Add Policy
            </a>
        </div>

        <div class="po-stats">
            <div class="po-stat">
                <div class="po-stat-ico s-blue"><i class="fas fa-file-shield"></i></div>
                <div>
                    <div class="po-stat-num">${policies?.count()}</div>
                    <div class="po-stat-lbl">Total</div>
                </div>
            </div>
            <div class="po-stat">
                <div class="po-stat-ico s-green"><i class="fas fa-circle-check"></i></div>
                <div>
                    <div class="po-stat-num">${policies?.where('status','published')?.count()}</div>
                    <div class="po-stat-lbl">Published</div>
                </div>
            </div>
            <div class="po-stat">
                <div class="po-stat-ico s-amber"><i class="fas fa-file-pen"></i></div>
                <div>
                    <div class="po-stat-num">${policies?.where('status','draft')?.count()}</div>
                    <div class="po-stat-lbl">Drafts</div>
                </div>
            </div>
        </div>
    </div>

    
    <div class="po-card">
        <div class="po-card-hd">
            <span class="po-card-title">All Policies</span>
            <span class="po-count-pill">${policies?.count()} ${Str.plural('policy', policies?.count())}</span>
        </div>
        <div class="table-responsive">
            <table class="po-tbl">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Key</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th style="text-align:right; padding-right:28px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                ${count(policies?.sortBy('key')) ? foreach(policies?.sortBy('key'), (policy, loop) => html`                <tr>
                    <td>
                        <div style="font-size:.875rem; font-weight:700; color:#111111;">
                            ${policy?.title_en  ||  '— No title —'}
                        </div>
                        ${(policy?.status === 'published') ? html`                        <a href="${url('/policy/' + (policy?.key ?? ''))}" target="_blank" class="po-preview-link mt-1">
                            <i class="fas fa-arrow-up-right-from-square"></i> View on site
                        </a>
                        ` : ''}                    </td>
                    <td>
                        <span class="po-key-badge"><i class="fas fa-key"></i>${policy?.key}</span>
                    </td>
                    <td>
                        ${(policy?.status === 'published') ? html`                            <span class="po-status published"><i class="fas fa-circle" style="font-size:.5rem;"></i> Published</span>
                        ` : html`                            <span class="po-status draft"><i class="fas fa-circle" style="font-size:.5rem;"></i> Draft</span>
                        `}                    </td>
                    <td style="font-size:.78rem; color:#A3A3A3; white-space:nowrap;">
                        ${policy?.updated_at ? policy?.updated_at?.format('d M Y') : '—'}
                    </td>
                    <td>
                        <div class="po-actions">
                            <a href="${route('admin.policies.edit', policy?.key)}" class="btn-po btn-po-edit">
                                <i class="fas fa-pen"></i> Edit
                            </a>
                            <button class="btn-po btn-po-del" onclick="openDelete('${policy?.key}', '${addslashes(policy?.title_en  ||  policy?.key)}')" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                `) : html`                <tr>
                    <td colspan="5">
                        <div class="po-empty">
                            <div class="po-empty-icon"><i class="fas fa-file-circle-xmark"></i></div>
                            <div class="po-empty-title">No policies yet</div>
                            <div class="po-empty-sub">Click "Add Policy" to create your first one.</div>
                        </div>
                    </td>
                </tr>
                `}                </tbody>
            </table>
        </div>
    </div>

</div>
</div>


<div class="modal fade del-modal" id="deleteModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width:420px;">
        <div class="modal-content">
            <form id="deleteForm" method="POST">
                ${csrf_field()}                ${method_field('DELETE')}                <div class="del-body">
                    <div class="del-ico"><i class="fas fa-trash-alt"></i></div>
                    <div class="del-title">Delete Policy?</div>
                    <p class="del-msg">
                        You are about to permanently delete <span class="del-name" id="delPolicyName"></span>.
                        <span class="del-warn"><i class="fas fa-exclamation-triangle me-1"></i>This will also remove it from the footer immediately.</span>
                    </p>
                </div>
                <div class="del-foot">
                    <button type="button" class="btn-lx btn-lx-ghost" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn-lx btn-lx-danger">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>


`,
    scripts: html`<script>
function openDelete(key, title) {
    document.getElementById('delPolicyName').textContent = '"' + title + '"';
    document.getElementById('deleteForm').action = '${url(`/admin/policies`)}/' + key;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}
</script>
`,
  };
}
