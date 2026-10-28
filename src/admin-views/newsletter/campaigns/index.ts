// Port of resources/views/adminside/newsletter/campaigns/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, request, session, csrf_field, count, ucfirst, trim, strip_tags, optional, Str, foreach, NewsletterCampaign } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { campaigns, statusColors, statusIcon, color, icon, snippet } = d;
  let statusFilter = request('status');
  let statusOptions = NewsletterCampaign.statusOptions();
  return {
    title: html`    <title>Newsletter Campaigns — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Plan, send and track email marketing campaigns to subscribers of ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="email campaigns, newsletter marketing, email broadcast, email blast, campaign analytics, aga collections admin">
`,
    styles: html``,
    content: html`    <div class="content-wrapper bg-light">

        
        <section class="content-header border-bottom mb-3">
            <div class="container-fluid py-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <h1 class="h4 fw-bold mb-1">
                        <i class="fas fa-bullhorn me-2 text-primary"></i> Newsletter Campaigns
                    </h1>
                    <p class="text-muted mb-0 small">
                        Manage your marketing campaigns and monitor their sending status.
                    </p>
                </div>

                <div class="d-flex align-items-center gap-2">
                    
                    <span class="badge bg-light text-muted border">
                        Total campaigns: <strong>${campaigns?.total()}</strong>
                    </span>

                    <a href="${route('admin.newsletter.campaigns.create')}" class="btn btn-primary">
                        <i class="fas fa-plus-circle me-1"></i> Create Campaign
                    </a>
                </div>
            </div>

            ${(session('success')) ? html`                <div class="container-fluid">
                    <div class="alert alert-success mt-2 mb-0 shadow-sm">${session('success')}</div>
                </div>
            ` : ''}            ${(session('error')) ? html`                <div class="container-fluid">
                    <div class="alert alert-danger mt-2 mb-0 shadow-sm">${session('error')}</div>
                </div>
            ` : ''}        </section>

        
        <section class="content mb-2">
            <div class="container-fluid">
                <div class="card shadow-sm border-0 mb-0">
                    <div class="card-body py-2">
                        <form method="GET" class="row g-2 align-items-center">
                            <div class="col-md-4">
                                <div class="input-group input-group-sm">
                                    <span class="input-group-text bg-white">
                                        <i class="fas fa-search text-muted"></i>
                                    </span>
                                    <input type="text" name="q" class="form-control" value="${request('q')}"
                                        placeholder="Search by subject...">
                                </div>
                            </div>
                            <div class="col-md-4">
                                                                <select name="status" class="form-select form-select-sm">
                                    <option value="">All statuses</option>
                                    ${foreach(statusOptions, (status, loop) => html`                                        <option value="${status}"
                                            ${statusFilter === status ? 'selected' : ''}>
                                            ${ucfirst(status)}
                                        </option>
                                    `)}                                </select>
                            </div>
                            <div class="col-md-4 text-md-end">
                                <button class="btn btn-sm btn-outline-secondary">
                                    <i class="fas fa-filter me-1"></i> Apply Filters
                                </button>
                                <a href="${route('admin.newsletter.campaigns.index')}"
                                    class="btn btn-sm btn-link text-decoration-none">
                                    Clear
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>

        
        <section class="content">
            <div class="container-fluid">
                <div class="card shadow-sm border-0">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th width="5%">#</th>
                                        <th>Subject &amp; Preview</th>
                                        <th>Status</th>
                                        <th>Sent At</th>
                                        <th width="18%" class="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${count(campaigns) ? foreach(campaigns, (campaign, loop) => { let statusColors: Record<string, any> = {
                                                'draft' : 'secondary',
                                                'sent' : 'success',
                                            };
let statusIcon: Record<string, any> = {
                                                'draft' : 'far fa-file-alt',
                                                'sent' : 'fas fa-check-circle',
                                            };
let color = statusColors?.[campaign?.status] ?? 'secondary';
let icon = statusIcon?.[campaign?.status] ?? 'far fa-file-alt';
let snippet = strip_tags(campaign?.body_html);
snippet = Str.limit(trim(snippet), 90);
 return html`                                                                                <tr>
                                            
                                            <td class="text-muted">${campaign?.id}</td>

                                            
                                            <td>
                                                <div class="fw-semibold mb-1">
                                                    ${campaign?.subject}
                                                </div>
                                                                                                <div class="text-muted small">
                                                    ${snippet  ||  'No preview text available.'}
                                                </div>
                                            </td>

                                            
                                            <td>
                                                <span
                                                    class="badge bg-${color} d-inline-flex align-items-center gap-1">
                                                    <i class="${icon}"></i> ${ucfirst(campaign?.status)}
                                                </span>
                                            </td>

                                            
                                            <td>
                                                ${(campaign?.sent_at) ? html`                                                    ${campaign?.sent_at?.timezone('Asia/Karachi')?.format('d M Y H:i')}
                                                ` : html`                                                    <span class="text-muted">—</span>
                                                `}                                            </td>

                                            
                                            <td class="text-end">
                                                <div class="d-flex justify-content-end gap-1">
                                                    ${(campaign?.status === NewsletterCampaign.STATUS_DRAFT) ? html`                                                        
                                                        <form
                                                            action="${route('admin.newsletter.campaigns.send', campaign)}"
                                                            method="POST"
                                                            onsubmit="return confirm('Send this campaign to all subscribed contacts?');">
                                                            ${csrf_field()}                                                            <button class="btn btn-sm btn-success">
                                                                <i class="fas fa-paper-plane me-1"></i> Send
                                                            </button>
                                                            <a href="${route('admin.newsletter.campaigns.edit', campaign?.id)}"
                                                                class="btn btn-sm btn-info">
                                                                <i class="fas fa-edit"></i> Edit
                                                            </a>
                                                        </form>
                                                    ` : (campaign?.status === NewsletterCampaign.STATUS_SENT) ? html`                                                        <span class="text-success fw-semibold">
                                                            <i class="fas fa-check-circle me-1"></i> Sent
                                                        </span>
                                                    ` : html`                                                        <span class="text-muted">—</span>
                                                    `}
                                                    <a href="${route('admin.newsletter.campaigns.show', campaign?.id)}"
                                                        class="btn btn-sm btn-info">
                                                        <i class="fas fa-eye"></i> View
                                                    </a>

                                                </div>
                                            </td>
                                        </tr>
                                    `; }) : html`                                        <tr>
                                            <td colspan="6" class="text-center text-muted py-4">
                                                <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                                                No campaigns found.
                                            </td>
                                        </tr>
                                    `}                                </tbody>
                            </table>
                        </div>
                    </div>

                    ${(campaigns?.hasPages()) ? html`                        <div class="card-footer d-flex justify-content-between align-items-center border-0">
                            <div class="small text-muted">
                                Showing ${campaigns?.firstItem()}–${campaigns?.lastItem()}
                                of ${campaigns?.total()} campaigns
                            </div>
                            <div>
                                ${campaigns?.links('pagination::bootstrap-4')}
                            </div>
                        </div>
                    ` : ''}                </div>
            </div>
        </section>
    </div>
`,
    scripts: html``,
  };
}
