// Port of resources/views/adminside/newsletter/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, max, optional, foreach, User } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { subs } = d;

  return {
    title: html`    <title>Newsletter Subscribers — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Manage newsletter email subscribers, export and segment audiences for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="newsletter subscribers, email list, mailing list, audience, email marketing, aga collections admin">
`,
    styles: html``,
    content: html`    <div class="content-wrapper">
        <section class="content-header">
            <div class="container-fluid d-flex justify-content-between align-items-center">
                <h1><i class="fas fa-envelope-open-text"></i> Newsletter Subscribers</h1>
                <div>
                    <a href="${route('admin.newsletter.campaigns.index')}" class="btn btn-primary">Campaigns</a>
                    <a href="${route('admin.newsletter.subscribers.export')}" class="btn btn-outline-secondary">Export CSV</a>
                </div>
            </div>
        </section>

        <section class="content">
            <div class="container-fluid">
                <div class="card">
                    <div class="table-responsive">
                        <table class="table table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>IP</th>
                                    <th>User Agent</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${foreach(subs, (s, loop) => html`                                    <tr>
                                        <td>${s?.email}</td>
                                        <td><span
                                                class="badge bg-${s?.status === 'subscribed' ? 'success' : 'secondary'}">${s?.status}</span>
                                        </td>
                                        <td>${s?.ip}</td>
                                        <td>
                                            <code class="ua-block d-inline-block text-muted small"
                                                    style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
                                                        white-space:normal; overflow-wrap:anywhere; word-break:break-word; max-width:420px; display:inline-block;">
                                                ${s?.user_agent}
                                            </code>
                                        </td>

                                        <td>${s?.created_at?.timezone('Asia/Karachi')?.format('d M Y H:i')}</td>
                                    </tr>
                                `)}                            </tbody>
                        </table>
                    </div>
                    <div class="card-footer d-flex justify-content-end">
                        ${subs?.links('pagination::bootstrap-4')}
                    </div>
                </div>
            </div>
        </section>
    </div>
`,
    scripts: html``,
  };
}
