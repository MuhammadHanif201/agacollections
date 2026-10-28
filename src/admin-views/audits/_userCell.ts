// Port of resources/views/adminside/audits/_userCell.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, User, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { audit } = d;
  let actor = audit?.user;
  return {
    title: html``,
    styles: html``,
    content: html`
<td>
    <div class="d-flex align-items-start gap-2">

        
        ${(audit?.user_type === User.class) ? html`        <span class="badge bg-primary">Admin</span>
        <div>
            <div class="fw-semibold">
                ${actor?.name ?? 'Deleted Admin'}
            </div>
            ${(actor?.email) ? html`            <small class="text-muted">${actor?.email}</small>
            ` : ''}        </div>

        
        ` : (audit?.user_type === Customer.class) ? html`        <span class="badge bg-success">Customer</span>
        <div>
            <div class="fw-semibold">
                ${actor?.full_name ?? 'Deleted Customer'}
            </div>
            ${(actor?.email) ? html`            <small class="text-muted">${actor?.email}</small>
            ` : ''}        </div>

        
        ` : html`        <span class="badge bg-secondary">System</span>
        <div>
            <div class="fw-semibold">Automated Process</div>
            <small class="text-muted">Cron / API / Background job</small>
        </div>
        `}
    </div>
</td>`,
    scripts: html``,
  };
}
