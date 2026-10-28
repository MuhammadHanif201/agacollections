// Port of resources/views/adminside/policies/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, old, csrf_field, strtolower, ucfirst, e, optional, quillEditor } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { policy } = d;

  return {
    title: html`    <title>Edit ${policy?.title_en  ||  ucfirst(policy?.key)} — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Update the content and visibility of the ${policy?.title_en  ||  ucfirst(policy?.key)} policy for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="edit policy, update policy, legal content, ${strtolower(policy?.title_en  ||  policy?.key)}, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
.po-page { padding: 32px 32px 72px; }

.po-breadcrumb {
    display: flex; align-items: center; gap: 8px;
    font-size: .75rem; color: #A3A3A3; margin-bottom: 24px;
}
.po-breadcrumb a { color: #111111; text-decoration: none; font-weight: 600; }
.po-breadcrumb a:hover { text-decoration: underline; }
.po-breadcrumb i { font-size: .6rem; }

.po-header {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 28px;
}
.po-header-left { display: flex; align-items: center; gap: 16px; }
.po-header-ico {
    width: 52px; height: 52px; border-radius: 15px;
    background: linear-gradient(135deg, #2A2A2A, #111111);
    box-shadow: 0 8px 24px rgba(17,17,17,.28);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; color: #fff; flex-shrink: 0;
}
.po-header-title { font-size: 1.5rem; font-weight: 800; color: #111111; letter-spacing: -.02em; margin: 0; }
.po-header-sub   { font-size: .82rem; color: #A3A3A3; margin: 2px 0 0; }

/* Key pill in header */
.po-key-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: .74rem; font-weight: 700; font-family: monospace;
    background: #F4F4F4; color: #525252; border: 1px solid #E5E5E5;
    border-radius: 7px; padding: 4px 10px;
}

.po-card {
    background: #fff; border: 1px solid #E8EDF5;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 2px 16px rgba(15,23,42,.06); margin-bottom: 20px;
}
.po-card-hd {
    padding: 16px 24px; border-bottom: 1px solid #F4F4F4;
    display: flex; align-items: center; gap: 12px; background: #FAFBFE;
}
.po-card-hd-ico {
    width: 32px; height: 32px; border-radius: 9px;
    background: rgba(17,17,17,.1); color: #111111;
    display: flex; align-items: center; justify-content: center; font-size: .8rem;
}
.po-card-hd-title { font-size: .78rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .1em; }
.po-card-body { padding: 24px; }

.po-field { margin-bottom: 20px; }
.po-lbl { display: block; font-size: .75rem; font-weight: 700; color: #374151; margin-bottom: 7px; letter-spacing: .02em; }
.po-lbl .req { color: #EF4444; margin-left: 2px; }
.po-inp {
    width: 100%; padding: 11px 15px;
    border: 1.5px solid #E5E5E5; border-radius: 11px;
    font-size: .88rem; color: #1C1C1C; background: #fff;
    transition: border-color .2s, box-shadow .2s;
    box-shadow: 0 1px 3px rgba(15,23,42,.04);
}
.po-inp:focus { outline: none; border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,.13); }
.po-inp.is-invalid { border-color: #EF4444; }
.po-err { font-size: .74rem; color: #EF4444; margin-top: 5px; font-weight: 500; }

/* Status toggle */
.po-status-grid { display: flex; gap: 12px; }
.po-status-opt { flex: 1; position: relative; }
.po-status-opt input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
.po-status-lbl {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; border: 2px solid #E5E5E5;
    border-radius: 12px; cursor: pointer; transition: all .2s; background: #FAFBFE;
}
.po-status-lbl:hover { border-color: #111111; background: #F3F0E9; }
.po-status-opt input:checked + .po-status-lbl {
    border-color: #111111; background: #F3F0E9;
    box-shadow: 0 0 0 3px rgba(17,17,17,.12);
}
.po-status-opt input:checked + .po-status-lbl.draft-lbl {
    border-color: #F59E0B; background: #FFFBEB;
    box-shadow: 0 0 0 3px rgba(245,158,11,.12);
}
.po-status-ico {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; font-size: .9rem;
}
.po-status-ico.pub  { background: rgba(22,163,74,.12);  color: #16A34A; }
.po-status-ico.drft { background: rgba(245,158,11,.12); color: #D97706; }
.po-status-text-title { font-size: .84rem; font-weight: 700; color: #1C1C1C; }
.po-status-text-sub   { font-size: .72rem; color: #A3A3A3; }

/* Preview banner */
.po-preview-banner {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
    background: #F0FDF4; border: 1px solid #BBF7D0;
    border-radius: 12px; padding: 12px 18px; margin-bottom: 20px;
    font-size: .82rem; color: #15803D; font-weight: 500;
}
.po-preview-banner a {
    color: #15803D; font-weight: 700; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
}
.po-preview-banner a:hover { text-decoration: underline; }
.po-draft-banner {
    background: #FFFBEB; border: 1px solid #FDE68A; color: #B45309;
}

/* Actions */
.po-actions-bar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; padding-top: 4px;
}
.btn-po-save {
    display: inline-flex; align-items: center; gap: 9px;
    background: #111111; color: #fff; border: none; border-radius: 12px;
    padding: 12px 28px; font-size: .88rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 14px rgba(17,17,17,.3); transition: all .2s;
}
.btn-po-save:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(17,17,17,.38); }
.btn-po-cancel {
    display: inline-flex; align-items: center; gap: 8px;
    background: #F3F4F6; color: #374151; border: 1.5px solid #E5E5E5;
    border-radius: 12px; padding: 12px 24px; font-size: .88rem; font-weight: 700;
    cursor: pointer; transition: all .2s; text-decoration: none;
}
.btn-po-cancel:hover { background: #E9ECF0; color: #374151; }
</style>

<div class="content-wrapper">
<div class="po-page">

    
    <div class="po-breadcrumb">
        <a href="${route('admin.policies.index')}"><i class="fas fa-file-shield me-1"></i>Policies</a>
        <i class="fas fa-chevron-right"></i>
        <span>${policy?.title_en  ||  ucfirst(policy?.key)}</span>
    </div>

    
    <div class="po-header">
        <div class="po-header-left">
            <div class="po-header-ico"><i class="fas fa-file-pen"></i></div>
            <div>
                <h1 class="po-header-title">${policy?.title_en  ||  ucfirst(policy?.key)}</h1>
                <p class="po-header-sub">
                    <span class="po-key-pill"><i class="fas fa-key" style="font-size:.6rem;"></i>${policy?.key}</span>
                    &nbsp;Last updated ${policy?.updated_at ? policy?.updated_at?.diffForHumans() : 'never'}
                </p>
            </div>
        </div>
    </div>

    
    ${(policy?.status === 'published') ? html`    <div class="po-preview-banner">
        <span><i class="fas fa-circle-check me-2"></i>This policy is live and visible to customers.</span>
        <a href="${url('/policy/' + (policy?.key ?? ''))}" target="_blank">
            <i class="fas fa-arrow-up-right-from-square"></i> Preview on site
        </a>
    </div>
    ` : html`    <div class="po-preview-banner po-draft-banner">
        <span><i class="fas fa-file-pen me-2"></i>This policy is a draft — not visible to customers.</span>
    </div>
    `}
    <form action="${route('admin.policies.update', policy?.key)}" method="POST">
        ${csrf_field()}
        
        <div class="po-card">
            <div class="po-card-hd">
                <div class="po-card-hd-ico"><i class="fas fa-file-lines"></i></div>
                <div class="po-card-hd-title">Policy Details</div>
            </div>
            <div class="po-card-body">

                <div class="po-field">
                    <label class="po-lbl">Title <span class="req">*</span></label>
                    <input type="text" name="title_en"
                        class="po-inp ${(errors.has('title_en')) ? (() => { const message = errors.first('title_en');  return html` is-invalid `; })() : ''}"
                        value="${old('title_en', policy?.title_en)}"
                        placeholder="e.g. Privacy Policy" required>
                    ${(errors.has('title_en')) ? (() => { const message = errors.first('title_en');  return html`<div class="po-err">${message}</div>`; })() : ''}                </div>

                ${quillEditor({ id: 'content_en', label: 'Content', lang: '', value: old('content_en', policy?.content_en), height: '420px' })}

            </div>
        </div>

        
        <div class="po-card">
            <div class="po-card-hd">
                <div class="po-card-hd-ico"><i class="fas fa-toggle-on"></i></div>
                <div class="po-card-hd-title">Visibility</div>
            </div>
            <div class="po-card-body">
                <div class="po-status-grid">
                    <div class="po-status-opt">
                        <input type="radio" name="status" id="s_published" value="published"
                            ${old('status', policy?.status) === 'published' ? 'checked' : ''}>
                        <label for="s_published" class="po-status-lbl">
                            <div class="po-status-ico pub"><i class="fas fa-circle-check"></i></div>
                            <div>
                                <div class="po-status-text-title">Published</div>
                                <div class="po-status-text-sub">Visible to customers in footer &amp; site</div>
                            </div>
                        </label>
                    </div>
                    <div class="po-status-opt">
                        <input type="radio" name="status" id="s_draft" value="draft"
                            ${old('status', policy?.status) === 'draft' ? 'checked' : ''}>
                        <label for="s_draft" class="po-status-lbl draft-lbl">
                            <div class="po-status-ico drft"><i class="fas fa-file-pen"></i></div>
                            <div>
                                <div class="po-status-text-title">Draft</div>
                                <div class="po-status-text-sub">Hidden from customers — work in progress</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="po-actions-bar">
            <a href="${route('admin.policies.index')}" class="btn-po-cancel">
                <i class="fas fa-arrow-left"></i> Back
            </a>
            <button type="submit" class="btn-po-save">
                <i class="fas fa-save"></i> Save Changes
            </button>
        </div>

    </form>

</div>
</div>
`,
    scripts: html``,
  };
}
