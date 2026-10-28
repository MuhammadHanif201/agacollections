// Port of resources/views/adminside/newsletter/campaigns/create.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, old, csrf_field, Collection, ucfirst, max, e, optional, foreach, quillEditor, NewsletterCampaign } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { prefill } = d;
  let statusOptions = NewsletterCampaign.statusOptions();
  let selectedStatus = old('status', NewsletterCampaign.STATUS_DRAFT);
  return {
    title: html`    <title>Create Campaign — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Compose a new newsletter campaign with subject, HTML content and schedule for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="create campaign, new newsletter, compose email, send broadcast, marketing, aga collections admin">
`,
    styles: html``,
    content: html`<div class="content-wrapper bg-light">

    
    <section class="content-header text-white shadow-sm border-bottom mb-4"
        style="background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); border-radius: 0 0 0.75rem 0.75rem;">
        <div class="container-fluid py-4 px-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center shadow"
                     style="width: 50px; height: 50px; background: linear-gradient(135deg, #00c6ff, #0072ff);">
                    <i class="fas fa-envelope-open-text text-white fa-lg"></i>
                </div>
                <div>
                    <h1 class="h4 mb-1 fw-bold text-white">Create Newsletter Campaign</h1>
                    <small class="text-white-50">
                        Draft a campaign, preview how it looks in inboxes and save it for sending later.
                    </small>
                </div>
            </div>

            <a href="${route('admin.newsletter.campaigns.index')}"
               class="btn btn-light bg-white text-dark border-0 rounded-pill px-4 d-flex align-items-center gap-2 shadow-sm">
                <i class="fas fa-list text-primary"></i> View All Campaigns
            </a>
        </div>
    </section>

    
    <section class="content">
        <div class="container-fluid">

            <form method="POST" action="${route('admin.newsletter.campaigns.store')}" id="campaign-form">
                ${csrf_field()}
                
                ${(errors?.any()) ? html`                    <div class="alert alert-danger shadow-sm mb-4">
                        <h5 class="fw-bold mb-2">
                            <i class="fas fa-exclamation-circle me-2"></i> Please fix the following:
                        </h5>
                        <ul class="mb-0 ps-3">
                            ${foreach(errors?.all(), (e, loop) => html`                                <li>${e}</li>
                            `)}                        </ul>
                    </div>
                ` : ''}
                <div class="row">
                    
                    <div class="col-lg-9">

                        
                        <div class="card p-4 mb-3 shadow-sm border-0">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="mb-0 fw-semibold text-dark">
                                    <i class="fas fa-info-circle text-primary me-2"></i> Campaign Details
                                </h5>
                                <span class="badge bg-light text-muted">
                                    ${companySetting?.name ?? 'Your brand'}
                                </span>
                            </div>

                            
                            <div class="mb-3">
                                <label class="form-label fw-bold">
                                    Subject <span class="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    class="form-control ${(errors.has('subject')) ? (() => { const message = errors.first('subject');  return html` is-invalid `; })() : ''}"
                                    value="${old('subject', prefill?.['subject'] ?? '')}"
                                    placeholder="e.g. New Collection Launch – Exclusive Offer"
                                    required
                                >
                                ${(errors.has('subject')) ? (() => { const message = errors.first('subject');  return html`                                    <small class="text-danger">${message}</small>
                                `; })() : ''}                                <small class="text-muted d-block mt-1">
                                    This will appear as the email subject line in your subscribers’ inbox.
                                </small>
                            </div>

                            
                                                        <div class="mb-0">
                                <label class="form-label fw-bold">Status</label>
                                <select name="status" class="form-select">
                                    ${foreach(statusOptions, (status, loop) => html`                                        <option value="${status}" ${selectedStatus === status ? 'selected' : ''}>
                                            ${ucfirst(status)}
                                        </option>
                                    `)}                                </select>
                                <small class="text-muted d-block mt-1">
                                    We recommend keeping this as <strong>Draft</strong>.
                                    You’ll send the campaign from the campaigns list when you’re ready.
                                </small>
                            </div>
                        </div>

                        
                        <div class="card p-4 mb-3 shadow-sm border-0">
                            ${quillEditor({ id: 'body_html', label: 'Email Content', lang: '', value: old('body_html'), placeholder: 'Enter you email content' })}
                        </div>
                    </div>

                    
                    <div class="col-lg-3">
                        <div class="position-sticky" style="top: 90px">

                            
                            <div class="card p-3 mb-3 shadow-sm border-0">
                                <h5 class="fw-semibold mb-3 text-dark">
                                    <i class="fas fa-eye text-info me-2"></i> Inbox Preview
                                </h5>

                                <div class="border rounded p-3 bg-white">
                                    <div class="mb-2">
                                        <div class="small text-muted text-uppercase">Subject</div>
                                        <div class="fw-bold" id="preview-subject">
                                            ${old('subject', prefill?.['subject'] ?? 'Your campaign subject will appear here')}
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <div class="small text-muted text-uppercase">Snippet</div>
                                        <div class="text-muted small" id="preview-snippet"
                                             style="max-height: 150px; overflow:auto; line-height: 1.4;">
                                            Email preview text will appear here...
                                        </div>
                                    </div>
                                </div>
                            </div>

                            
                            <div class="card p-3 mb-3 shadow-sm border-0">
                                <h6 class="fw-semibold mb-2">
                                    <i class="fas fa-lightbulb text-warning me-2"></i> Best Practices
                                </h6>
                                <ul class="small text-muted mb-0 ps-3">
                                    <li>Keep subject lines short and clear.</li>
                                    <li>Use one main call-to-action.</li>
                                    <li>Add an unsubscribe link in your email template.</li>
                                </ul>
                            </div>

                            
                            <div class="card p-3 shadow-sm border-0">
                                <button type="submit" class="btn btn-primary w-100 py-2">
                                    <i class="fas fa-save me-1"></i> Save Campaign
                                </button>
                            </div>
                        </div>
                    </div>
                </div> 
            </form>
        </div>
    </section>
</div>
`,
    scripts: html`<script>
document.addEventListener('DOMContentLoaded', function () {

    const subjectInput   = document.querySelector('input[name="subject"]');
    const previewSubject = document.getElementById('preview-subject');
    const previewSnippet = document.getElementById('preview-snippet');

    // Subject live preview
    const updateSubjectPreview = () => {
        previewSubject.textContent =
            (subjectInput?.value?.trim() || 'Your campaign subject will appear here');
    };

    subjectInput?.addEventListener('input', updateSubjectPreview);
    updateSubjectPreview();

    // -------- QUILL SNIPPET PREVIEW ----------
    // We listen to Quill instance from the Quill component:
    window.addEventListener('quill-change-body_html', function (e) {

        // HTML for preview
        const html = e.detail.html?.trim();

        if (html && html !== '<p><br></p>') {
            previewSnippet.innerHTML = html;
        } else {
            previewSnippet.innerHTML = 'Email preview text will appear here...';
        }

    });

});
</script>
`,
  };
}
