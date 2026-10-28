// Port of resources/views/adminside/affiliate_withdrawals/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, session, csrf_field, number_format, count, empty, ucfirst, in_array, max, optional, entries, foreach, addslashes } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { status, counts, withdrawals } = d;

  return {
    title: html`<title>Affiliate Withdrawals — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Approve and pay affiliate withdrawal requests for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
`,
    styles: html`<style>
.wp-page { padding: 28px; }
.wp-head { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom: 22px; }
.wp-head h1 { font-size: 1.4rem; font-weight: 600; margin: 0; }
.wp-tabs  { display:flex; gap:4px; flex-wrap:wrap; margin-bottom: 18px; }
.wp-tab   { padding: 8px 14px; font-size:.78rem; color:#737373; background:#F4F4F4; border-radius:8px; text-decoration:none; transition: all .15s; }
.wp-tab.is-active { background:#111111; color:#fff; }
.wp-tab:hover:not(.is-active) { background:#E5E5E5; color:#111111; }
.wp-tab .ct { background:rgba(0,0,0,.08); padding:1px 7px; border-radius:10px; font-size:.7rem; margin-left:4px; }

.wp-card { background:#fff; border:1px solid #E5E5E5; border-radius: 14px; overflow: hidden; }
.wp-table { width:100%; border-collapse: collapse; }
.wp-table th, .wp-table td { padding: 12px 14px; border-bottom: 1px solid #F4F4F4; font-size:.85rem; vertical-align: middle; }
.wp-table th { text-align:left; font-size:.7rem; letter-spacing: .12em; text-transform:uppercase; color:#737373; background:#FAFAFA; font-weight: 600; }
.wp-empty { padding: 60px 20px; text-align:center; color:#A3A3A3; }
.pill { display:inline-block; padding: 3px 9px; font-size:.66rem; letter-spacing:.1em; text-transform:uppercase; font-weight:700; border-radius: 4px; }
.pill.requested { background:#fef3c7; color:#92400e; }
.pill.approved  { background:#E9E4D9; color:#1e40af; }
.pill.paid      { background:#d1fae5; color:#065f46; }
.pill.rejected  { background:#fee2e2; color:#991b1b; }

.btn-sm { padding: 5px 11px; border:none; border-radius: 6px; cursor:pointer; font-size:.72rem; font-weight: 600; }
.btn-approve { background:#111111; color:#fff; }
.btn-paid    { background:#10b981; color:#fff; }
.btn-reject  { background:#ef4444; color:#fff; }
form.inline-form { display: inline-block; margin-right: 4px; }

.modal-bg { display:none; position: fixed; inset:0; background:rgba(0,0,0,.4); z-index: 1000; align-items: center; justify-content: center; }
.modal-bg.is-open { display: flex; }
.modal { background:#fff; padding: 26px 28px; border-radius:14px; max-width: 460px; width: 100%; }
.modal h4 { margin: 0 0 14px; font-size: 1.05rem; }
.modal input, .modal textarea { width: 100%; padding: 9px 12px; border:1px solid #E5E5E5; border-radius:6px; margin-bottom: 12px; font-size:.85rem; }
</style>
`,
    content: html`<div class="content-wrapper">
<div class="wp-page">

    <div class="wp-head">
        <h1><i class="fas fa-money-check-alt me-2"></i> Affiliate Withdrawals</h1>
        <a href="${route('admin.affiliates.index')}" style="color:#111111;text-decoration:none;font-size:.85rem;">← All affiliates</a>
    </div>

    <div class="wp-tabs">
        ${foreach(entries({'all':'All','requested':'Requested','approved':'Approved','paid':'Paid'}), ([key, label], loop) => html`            <a href="${route('admin.affiliate-withdrawals.index', {'status':key})}"
               class="wp-tab ${status === key ? 'is-active' : ''}">
                ${label} <span class="ct">${counts?.[key] ?? 0}</span>
            </a>
        `)}    </div>

    ${(session('success')) ? html`<div style="background:#ecfdf5;color:#065f46;border-left:3px solid #10b981;padding:12px 18px;margin-bottom:18px;font-size:.9rem;border-radius:6px;">${session('success')}</div>` : ''}    ${(session('error')) ? html`<div style="background:#fef2f2;color:#991b1b;border-left:3px solid #ef4444;padding:12px 18px;margin-bottom:18px;font-size:.9rem;border-radius:6px;">${session('error')}</div>` : ''}
    <div class="wp-card">
        <table class="wp-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Affiliate</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Account</th>
                    <th>Status</th>
                    <th>Paid On / Ref</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${count(withdrawals) ? foreach(withdrawals, (w, loop) => html`                    <tr>
                        <td style="font-size:.82rem;color:#737373;">${w?.created_at?.format('d M, H:i')}</td>
                        <td>
                            <div style="font-weight:600;">${w?.affiliate?.full_name}</div>
                            <div style="color:#A3A3A3;font-size:.75rem;">${w?.affiliate?.referral_code} · ${w?.affiliate?.phone}</div>
                        </td>
                        <td><strong>PKR ${number_format(w?.amount, 0)}</strong></td>
                        <td>${ucfirst(w?.payment_method)}${(w?.bank_name) ? html` <small style="color:#A3A3A3;">(${w?.bank_name})</small>` : ''}</td>
                        <td style="font-family:monospace;font-size:.78rem;">
                            ${w?.payment_account_number}<br>
                            <small style="color:#A3A3A3;">${w?.payment_account_name}</small>
                        </td>
                        <td><span class="pill ${w?.status}">${w?.status}</span></td>
                        <td style="font-size:.78rem;">
                            ${(w?.paid_at) ? html`                                <div style="color:#065f46;">${w?.paid_at?.format('d M Y')}</div>
                                ${(w?.transaction_ref) ? html`<div style="color:#A3A3A3;font-family:monospace;">${w?.transaction_ref}</div>` : ''}                            ` : html` — `}                        </td>
                        <td>
                            ${(in_array(w?.status, ['requested', 'approved'])) ? html`                                ${(w?.status === 'requested') ? html`                                    <form method="POST" action="${route('admin.affiliate-withdrawals.approve', w?.id)}" class="inline-form">
                                        ${csrf_field()}                                        <button type="submit" class="btn-sm btn-approve" onclick="return confirm('Approve this withdrawal?')">Approve</button>
                                    </form>
                                ` : ''}
                                
                                <form method="POST" action="${route('admin.affiliate-withdrawals.paid', w?.id)}" class="inline-form"
                                      onsubmit="
                                          var ref = prompt('Mark this withdrawal as PAID.\\n\\nAffiliate: ${addslashes(w?.affiliate?.full_name)}\\nAmount: PKR ${number_format(w?.amount, 0)}\\n\\nEnter transaction reference (optional, or leave empty):', '');
                                          if (ref === null) return false;
                                          this.querySelector('[name=transaction_ref]').value = ref;
                                          return true;
                                      ">
                                    ${csrf_field()}                                    <input type="hidden" name="transaction_ref" value="">
                                    <button type="submit" class="btn-sm btn-paid">Mark Paid</button>
                                </form>

                                
                                <form method="POST" action="${route('admin.affiliate-withdrawals.reject', w?.id)}" class="inline-form"
                                      onsubmit="
                                          var reason = prompt('Reject this withdrawal.\\n\\nReason (shown to affiliate):', '');
                                          if (reason === null || reason.trim() === '') return false;
                                          this.querySelector('[name=admin_note]').value = reason;
                                          return true;
                                      ">
                                    ${csrf_field()}                                    <input type="hidden" name="admin_note" value="">
                                    <button type="submit" class="btn-sm btn-reject">Reject</button>
                                </form>
                            ` : ''}                        </td>
                    </tr>
                `) : html`                    <tr><td colspan="8" class="wp-empty">No withdrawals found.</td></tr>
                `}            </tbody>
        </table>
    </div>

    <div style="margin-top: 18px;">${withdrawals?.links()}</div>
</div>
</div>

`,
    scripts: html``,
  };
}
