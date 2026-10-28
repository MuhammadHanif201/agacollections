// Port of resources/views/adminside/newsletter/campaigns/show.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, ucfirst, max, min, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { campaign } = d;

  return {
    title: html`<title>Campaign Preview: ${campaign?.subject} — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Preview, review stats and delivery status for campaign &ldquo;${campaign?.subject}&rdquo; at ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="campaign preview, email preview, delivery report, campaign analytics, aga collections admin">
`,
    styles: html`<style>
    .email-content img {
        max-width: 100%;
        height: auto;
    }
    .email-content table {
        width: 100%;
    }
</style>
`,
    content: html`<div class="content-wrapper bg-light">

    
    <section class="content-header text-white shadow-sm border-bottom mb-4"
        style="background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); border-radius: 0 0 .75rem .75rem;">
        <div class="container-fluid py-4 px-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center shadow"
                    style="width: 50px; height: 50px; background: linear-gradient(135deg, #00c6ff, #0072ff);">
                    <i class="fas fa-eye text-white fa-lg"></i>
                </div>
                <div>
                    <h1 class="h4 mb-1 fw-bold text-white">Campaign Preview</h1>
                    <small class="text-white-50">
                        See how your newsletter email will appear to subscribers
                    </small>
                </div>
            </div>
            <a href="${route('admin.newsletter.campaigns.index')}"
                class="btn btn-light bg-white text-dark border-0 rounded-pill px-4 d-flex align-items-center gap-2 shadow-sm">
                <i class="fas fa-list text-primary"></i> Back to Campaigns
            </a>
        </div>
    </section>

    
    <section class="content">
        <div class="container-fluid">

            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 class="fw-bold mb-1">${campaign?.subject}</h5>
                            <small class="text-muted">${campaign?.created_at?.format('d M Y - h:i A')}</small>
                        </div>
                        <span class="badge bg-primary px-3 py-2">${ucfirst(campaign?.status)}</span>
                    </div>

                    
                    <div class="border rounded p-4 bg-white" style="min-height: 500px;">
                        ${raw(campaign?.body_html)}
                    </div>

                </div>
            </div>

        </div>
    </section>
</div>
`,
    scripts: html``,
  };
}
