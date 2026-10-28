// Port of resources/views/adminside/affiliates/show.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, old, session, csrf_field, number_format, count, empty, ucfirst, rtrim, max, min, optional, foreach, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { affiliate } = d;

  return {
    title: html`<title>Affiliate: ${affiliate?.full_name} — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Affiliate detail and management — ${affiliate?.full_name}.">
`,
    styles: html`<style>
.aff-show { padding: 28px; max-width: 1200px; }
.aff-back { color:#737373; text-decoration:none; font-size:.82rem; display:inline-block; margin-bottom: 14px; }
.aff-back:hover { color:#111111; }
.aff-grid { display:grid; grid-template-columns: 1fr 360px; gap: 22px; }
@media (max-width: 991px) { .aff-grid { grid-template-columns: 1fr; } }
.aff-card { background:#fff; border:1px solid #E5E5E5; border-radius: 14px; padding: 22px 24px; margin-bottom: 18px; }
.aff-card h3 { font-size: .95rem; font-weight: 700; margin: 0 0 16px; }
.kv { display:grid; grid-template-columns: 140px 1fr; gap: 8px 14px; font-size: .85rem; }
.kv .k { color:#737373; font-size:.75rem; letter-spacing:.06em; text-transform:uppercase; font-weight:600; padding-top: 2px; }
.kv .v { color:#111111; }
.code-tag { font-family: monospace; background:#F4F4F4; padding: 3px 8px; font-size:.82rem; color:#111111; border-radius: 4px; }

.pill { display:inline-block; padding: 3px 9px; font-size:.66rem; letter-spacing:.1em; text-transform:uppercase; font-weight:700; border-radius: 4px; }
.pill.pending   { background:#fef3c7; color:#92400e; }
.pill.approved  { background:#d1fae5; color:#065f46; }
.pill.rejected  { background:#fee2e2; color:#991b1b; }
.pill.suspended { background:#e5e7eb; color:#374151; }
.pill.available { background:#E9E4D9; color:#1e40af; }
.pill.paid      { background:#d1fae5; color:#065f46; }
.pill.cancelled { background:#f3f4f6; color:#6b7280; }
.pill.requested { background:#fef3c7; color:#92400e; }

.aff-stats { display:grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px; }
.aff-stat { background:#FAFAFA; border-radius: 8px; padding: 14px; }
.aff-stat .lbl { font-size:.7rem; color:#737373; letter-spacing:.1em; text-transform:uppercase; font-weight:600; }
.aff-stat .val { font-size: 1.2rem; font-weight: 700; color:#111111; margin-top: 4px; }

.btn { padding: 10px 16px; border:none; border-radius: 8px; cursor:pointer; font-size:.78rem; font-weight: 600; letter-spacing:.05em; transition: opacity .15s; }
.btn:hover { opacity: 0.85; }
.btn-approve  { background:#10b981; color:#fff; }
.btn-reject   { background:#ef4444; color:#fff; }
.btn-suspend  { background:#A3A3A3; color:#fff; }
.btn-save     { background:#111111; color:#fff; }
.action-row   { display:flex; gap:8px; flex-wrap:wrap; }
form.inline-form { display: inline; }

table.simple { width:100%; border-collapse: collapse; }
table.simple th, table.simple td { padding: 10px 12px; border-bottom: 1px solid #F4F4F4; font-size:.83rem; }
table.simple th { text-align:left; font-size:.68rem; letter-spacing:.1em; text-transform:uppercase; color:#737373; }

.field { margin-bottom: 14px; }
.field label { display:block; font-size:.7rem; letter-spacing:.1em; text-transform:uppercase; color:#737373; font-weight:600; margin-bottom: 5px; }
.field input, .field textarea { width: 100%; padding: 9px 12px; border: 1px solid #E5E5E5; border-radius: 6px; font-size:.85rem; }
.field textarea { min-height: 70px; resize: vertical; }
</style>
`,
    content: html`<div class="content-wrapper">
<div class="aff-show">

    <a href="${route('admin.affiliates.index')}" class="aff-back"><i class="fas fa-arrow-left me-1"></i> Back to affiliates</a>

    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;margin-bottom:16px;">
        <div>
            <h1 style="font-size:1.5rem;margin:0 0 4px;">${affiliate?.full_name}</h1>
            <div style="color:#737373;font-size:.85rem;">
                <span class="code-tag">${affiliate?.referral_code}</span> &middot;
                <span class="pill ${affiliate?.status}">${affiliate?.status}</span>
            </div>
        </div>
    </div>

    ${(session('success')) ? html`<div style="background:#ecfdf5;color:#065f46;border-left:3px solid #10b981;padding:12px 18px;margin-bottom:18px;font-size:.9rem;border-radius:6px;">${session('success')}</div>` : ''}    ${(session('error')) ? html`<div style="background:#fef2f2;color:#991b1b;border-left:3px solid #ef4444;padding:12px 18px;margin-bottom:18px;font-size:.9rem;border-radius:6px;">${session('error')}</div>` : ''}
    <div class="aff-grid">

        
        <div>
            <div class="aff-card">
                <h3>Profile</h3>
                <div class="kv">
                    <div class="k">Customer</div><div class="v">${affiliate?.customer?.full_name ?? '— (guest application)'}</div>
                    <div class="k">Phone</div><div class="v">${affiliate?.phone}</div>
                    <div class="k">Email</div><div class="v">${affiliate?.email  ||  '—'}</div>
                    <div class="k">Referral Code</div><div class="v"><span class="code-tag">${affiliate?.referral_code}</span></div>
                    <div class="k">Effective Rate</div><div class="v">${rtrim(rtrim(number_format(affiliate?.effectiveRate(),2),'0'),'.')}%</div>
                </div>
            </div>

            <div class="aff-card">
                <h3>Payout Details</h3>
                <div class="kv">
                    <div class="k">Method</div><div class="v">${ucfirst(affiliate?.payment_method)}</div>
                    <div class="k">Account #</div><div class="v">${affiliate?.payment_account_number}</div>
                    <div class="k">Account Name</div><div class="v">${affiliate?.payment_account_name}</div>
                    ${(affiliate?.bank_name) ? html`                        <div class="k">Bank</div><div class="v">${affiliate?.bank_name}</div>
                    ` : ''}                </div>
            </div>

            <div class="aff-card">
                <h3>Commissions (${affiliate?.commissions?.count()})</h3>
                <table class="simple">
                    <thead><tr><th>Order</th><th>Date</th><th>Base</th><th>Rate</th><th>Earned</th><th>Status</th></tr></thead>
                    <tbody>
                    ${count(affiliate?.commissions) ? foreach(affiliate?.commissions, (c, loop) => html`                        <tr>
                            <td>#${c?.order_id}</td>
                            <td>${c?.created_at?.format('d M Y')}</td>
                            <td>PKR ${number_format(c?.base_amount, 0)}</td>
                            <td>${rtrim(rtrim(number_format(c?.rate_used,2),'0'),'.')}%</td>
                            <td><strong>PKR ${number_format(c?.commission_amount, 0)}</strong></td>
                            <td><span class="pill ${c?.status}">${c?.status}</span></td>
                        </tr>
                    `) : html`                        <tr><td colspan="6" style="text-align:center;color:#A3A3A3;padding:20px;">No commissions yet.</td></tr>
                    `}                    </tbody>
                </table>
            </div>

            <div class="aff-card">
                <h3>Withdrawals (${affiliate?.withdrawals?.count()})</h3>
                <table class="simple">
                    <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid On</th></tr></thead>
                    <tbody>
                    ${count(affiliate?.withdrawals) ? foreach(affiliate?.withdrawals, (w, loop) => html`                        <tr>
                            <td>${w?.created_at?.format('d M Y')}</td>
                            <td><strong>PKR ${number_format(w?.amount, 0)}</strong></td>
                            <td>${ucfirst(w?.payment_method)}</td>
                            <td><span class="pill ${w?.status}">${w?.status}</span></td>
                            <td>${w?.paid_at?.format('d M Y') ?? '—'}</td>
                        </tr>
                    `) : html`                        <tr><td colspan="5" style="text-align:center;color:#A3A3A3;padding:20px;">No withdrawals yet.</td></tr>
                    `}                    </tbody>
                </table>
            </div>
        </div>

        
        <div>
            <div class="aff-card">
                <h3>Earnings Summary</h3>
                <div class="aff-stats">
                    <div class="aff-stat"><div class="lbl">Total Earned</div><div class="val">PKR ${number_format(affiliate?.totalEarned(), 0)}</div></div>
                    <div class="aff-stat"><div class="lbl">Pending</div><div class="val">PKR ${number_format(affiliate?.pendingAmount(), 0)}</div></div>
                    <div class="aff-stat"><div class="lbl">Available</div><div class="val">PKR ${number_format(affiliate?.availableAmount(), 0)}</div></div>
                    <div class="aff-stat"><div class="lbl">Paid</div><div class="val">PKR ${number_format(affiliate?.paidAmount(), 0)}</div></div>
                </div>
            </div>

            <div class="aff-card">
                <h3>Admin Actions</h3>
                <div class="action-row" style="margin-bottom: 18px;">
                    ${(affiliate?.status !== 'approved') ? html`                        <form method="POST" action="${route('admin.affiliates.approve', affiliate?.id)}" class="inline-form">
                            ${csrf_field()}                            <button type="submit" class="btn btn-approve" onclick="return confirm('Approve this affiliate?')"><i class="fas fa-check"></i> Approve</button>
                        </form>
                    ` : ''}                    ${(affiliate?.status === 'approved') ? html`                        <form method="POST" action="${route('admin.affiliates.suspend', affiliate?.id)}" class="inline-form">
                            ${csrf_field()}                            <button type="submit" class="btn btn-suspend" onclick="return confirm('Suspend this affiliate?')"><i class="fas fa-pause"></i> Suspend</button>
                        </form>
                    ` : ''}                </div>

                <form method="POST" action="${route('admin.affiliates.update', affiliate?.id)}">
                    ${csrf_field()}                    <div class="field">
                        <label>Custom Commission Rate (%)</label>
                        <input type="number" step="0.01" min="0" max="100" name="commission_rate"
                               value="${old('commission_rate', affiliate?.commission_rate)}"
                               placeholder="Leave empty to use default (${rtrim(rtrim(number_format(companySetting?.affiliate_default_rate ?? 8,2),'0'),'.')}%)">
                    </div>
                    <div class="field">
                        <label>Admin Note</label>
                        <textarea name="admin_note" placeholder="Internal note about this affiliate…">${old('admin_note', affiliate?.admin_note)}</textarea>
                    </div>
                    <button type="submit" class="btn btn-save"><i class="fas fa-save"></i> Save</button>
                </form>
            </div>

            ${(affiliate?.status === 'pending') ? html`                <div class="aff-card">
                    <h3>Reject Application</h3>
                    <form method="POST" action="${route('admin.affiliates.reject', affiliate?.id)}">
                        ${csrf_field()}                        <div class="field">
                            <label>Reason (visible to applicant)</label>
                            <textarea name="admin_note" placeholder="Reason for rejection…"></textarea>
                        </div>
                        <button type="submit" class="btn btn-reject" onclick="return confirm('Reject this application?')"><i class="fas fa-times"></i> Reject</button>
                    </form>
                </div>
            ` : ''}        </div>

    </div>

</div>
</div>
`,
    scripts: html``,
  };
}
