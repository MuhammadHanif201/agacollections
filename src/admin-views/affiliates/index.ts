// Port of resources/views/adminside/affiliates/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, request, number_format, count, empty, rtrim, min, optional, entries, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { status, counts, affiliates } = d;

  return {
    title: html`<title>Affiliates — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Manage affiliate program applications and approvals for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="affiliates, affiliate management, referral program, marketing, aga collections admin">
`,
    styles: html`<style>
.aff-page { padding: 28px; }
.aff-head { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom: 22px; }
.aff-head h1 { font-size: 1.4rem; font-weight: 600; margin: 0; }
.aff-tabs  { display:flex; gap:4px; flex-wrap:wrap; margin-bottom: 18px; }
.aff-tab   { padding: 8px 14px; font-size:.78rem; color:#737373; background:#F4F4F4; border-radius:8px; text-decoration:none; transition: all .15s; }
.aff-tab.is-active { background:#111111; color:#fff; }
.aff-tab:hover:not(.is-active) { background:#E5E5E5; color:#111111; }
.aff-tab .ct { background:rgba(0,0,0,.08); padding:1px 7px; border-radius:10px; font-size:.7rem; margin-left:4px; }

.aff-card { background:#fff; border:1px solid #E5E5E5; border-radius: 14px; overflow: hidden; }
.aff-table { width:100%; border-collapse: collapse; }
.aff-table th, .aff-table td { padding: 12px 14px; border-bottom: 1px solid #F4F4F4; font-size:.85rem; vertical-align: middle; }
.aff-table th { text-align:left; font-size:.7rem; letter-spacing: .12em; text-transform:uppercase; color:#737373; background:#FAFAFA; font-weight: 600; }
.aff-table tbody tr:last-child td { border-bottom:none; }
.aff-table tbody tr:hover { background:#fafbfc; }
.aff-empty { padding: 60px 20px; text-align:center; color:#A3A3A3; }
.pill { display:inline-block; padding: 3px 9px; font-size:.66rem; letter-spacing:.1em; text-transform:uppercase; font-weight:700; border-radius: 4px; }
.pill.pending   { background:#fef3c7; color:#92400e; }
.pill.approved  { background:#d1fae5; color:#065f46; }
.pill.rejected  { background:#fee2e2; color:#991b1b; }
.pill.suspended { background:#e5e7eb; color:#374151; }
.code-tag { font-family: monospace; background:#F4F4F4; padding: 3px 8px; font-size:.78rem; color:#111111; border-radius: 4px; }
.aff-search { display:flex; gap:8px; }
.aff-search input { padding: 8px 14px; border: 1px solid #E5E5E5; border-radius: 8px; font-size:.85rem; min-width: 240px; }
.aff-search button { padding: 8px 18px; background: #111111; color:#fff; border:none; border-radius: 8px; cursor:pointer; }
.btn-link { color: #111111; text-decoration: none; font-weight: 500; font-size: .82rem; }
.btn-link:hover { text-decoration: underline; }
</style>
`,
    content: html`<div class="content-wrapper">
<div class="aff-page">

    <div class="aff-head">
        <h1><i class="fas fa-users-cog me-2"></i> Affiliates</h1>
        <a href="${route('admin.affiliate-withdrawals.index')}" class="btn-link"><i class="fas fa-money-check-alt me-1"></i> Withdrawals →</a>
    </div>

    <div class="aff-tabs">
        ${foreach(entries({'all':'All','pending':'Pending','approved':'Approved','rejected':'Rejected'}), ([key, label], loop) => html`            <a href="${route('admin.affiliates.index', {'status':key})}"
               class="aff-tab ${status === key ? 'is-active' : ''}">
                ${label} <span class="ct">${counts?.[key] ?? 0}</span>
            </a>
        `)}        <form method="GET" class="aff-search ms-auto">
            <input type="hidden" name="status" value="${status}">
            <input type="text" name="q" value="${request('q')}" placeholder="Name, phone, email, code…">
            <button type="submit"><i class="fas fa-search"></i></button>
        </form>
    </div>

    <div class="aff-card">
        <table class="aff-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Code</th>
                    <th>Rate</th>
                    <th>Orders</th>
                    <th>Earned</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${count(affiliates) ? foreach(affiliates, (a, loop) => html`                    <tr>
                        <td>
                            <div style="font-weight:600;">${a?.full_name}</div>
                            <div style="color:#A3A3A3;font-size:.75rem;">${a?.payment_method} · ${a?.payment_account_number}</div>
                        </td>
                        <td>
                            <div>${a?.phone}</div>
                            ${(a?.email) ? html`<div style="color:#A3A3A3;font-size:.75rem;">${a?.email}</div>` : ''}                        </td>
                        <td><span class="code-tag">${a?.referral_code}</span></td>
                        <td>${a?.commission_rate !== null ? rtrim(rtrim(number_format(a?.commission_rate,2),'0'),'.') + '%' : 'Default'}</td>
                        <td>${a?.orders_count}</td>
                        <td>PKR ${number_format(a?.totalEarned(), 0)}</td>
                        <td><span class="pill ${a?.status}">${a?.status}</span></td>
                        <td style="font-size:.78rem;color:#737373;">${a?.created_at?.diffForHumans()}</td>
                        <td><a href="${route('admin.affiliates.show', a?.id)}" class="btn-link">View</a></td>
                    </tr>
                `) : html`                    <tr><td colspan="9" class="aff-empty">No affiliates found.</td></tr>
                `}            </tbody>
        </table>
    </div>

    <div style="margin-top: 18px;">${affiliates?.withQueryString()?.links()}</div>

</div>
</div>
`,
    scripts: html``,
  };
}
