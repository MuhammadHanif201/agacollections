// Port of resources/views/adminside/category/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, old, csrf_field, method_field, Collection, max, min, e, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { category } = d;

  return {
    title: html`    <title>Edit Category — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Update category name, description, image and visibility for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="edit category, update category, manage catalog, product category, aga collections admin">
`,
    styles: html`<link href="https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css" rel="stylesheet">
<style>
    /* ── Shell ── */
    .cf-page { background: #f4f5f7; min-height: 100vh; padding: 28px 0 56px; }

    /* ── Page header ── */
    .cf-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .cf-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0; display: flex; align-items: center; gap: 10px; }
    .cf-header h1 i { color: #111111; }
    .cf-breadcrumb { font-size: 0.78rem; color: #888; margin-top: 3px; }
    .cf-breadcrumb a { color: #111111; text-decoration: none; }

    /* ── Layout ── */
    .cf-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
    @media (max-width: 900px) { .cf-grid { grid-template-columns: 1fr; } }

    /* ── Cards ── */
    .cf-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.06); overflow: hidden; }
    .cf-card-header { padding: 16px 24px; border-bottom: 1px solid #F4F4F4; display: flex; align-items: center; gap: 10px; }
    .cf-card-header h3 { font-size: 0.9rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .cf-card-header .header-icon {
        width: 30px; height: 30px; border-radius: 8px; background: #F3F0E9;
        color: #111111; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
    }
    .cf-card-body { padding: 24px; }

    /* ── Form fields ── */
    .field-group { margin-bottom: 22px; }
    .field-group:last-child { margin-bottom: 0; }
    .field-label { display: block; font-size: 0.78rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 7px; }
    .field-label .req { color: #111111; margin-left: 2px; }
    .field-input {
        width: 100%; border: 1.5px solid #E5E5E5; border-radius: 9px;
        padding: 10px 14px; font-size: 0.9rem; color: #1a1a2e;
        background: #fafbfc; transition: border-color .2s, box-shadow .2s; outline: none;
    }
    .field-input:focus { border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,.1); background: #fff; }
    .field-hint { font-size: 0.75rem; color: #A3A3A3; margin-top: 5px; }
    .field-error { font-size: 0.75rem; color: #dc2626; margin-top: 4px; }

    /* ── Slug preview ── */
    .slug-preview { display: flex; align-items: center; gap: 6px; margin-top: 7px; font-size: 0.78rem; color: #737373; background: #FAFAFA; border-radius: 6px; padding: 6px 10px; }
    .slug-preview i { color: #111111; font-size: 0.75rem; }
    #slug-output { font-family: monospace; color: #1a1a2e; }

    /* ── Upload zone ── */
    .upload-zone {
        border: 2px dashed #E5E5E5; border-radius: 10px;
        padding: 22px 20px; text-align: center; cursor: pointer;
        transition: all .2s; background: #fafbfc; position: relative;
    }
    .upload-zone:hover, .upload-zone.dragover { border-color: #111111; background: #F3F0E9; }
    .upload-zone i.uz-icon { font-size: 1.5rem; color: #111111; margin-bottom: 6px; display: block; }
    .upload-zone .uz-title { font-size: 0.82rem; font-weight: 600; color: #374151; }
    .upload-zone .uz-sub { font-size: 0.73rem; color: #A3A3A3; margin-top: 2px; }
    .upload-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

    /* ── Current image display ── */
    .current-img-wrap {
        display: flex; align-items: flex-start; gap: 14px;
        padding: 14px; background: #FAFAFA; border-radius: 10px;
        border: 1.5px solid #E5E5E5; margin-bottom: 14px;
    }
    .current-img-thumb { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; border: 1.5px solid #E5E5E5; flex-shrink: 0; }
    .current-img-banner { width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; border: 1.5px solid #E5E5E5; }
    .current-img-meta { font-size: 0.78rem; }
    .current-img-meta strong { display: block; color: #374151; font-size: 0.82rem; margin-bottom: 3px; }
    .current-img-meta span { color: #A3A3A3; }

    /* ── New preview ── */
    .img-preview-wrap { margin-top: 10px; display: none; }
    .img-preview-wrap.show { display: block; }
    .img-preview { border-radius: 8px; border: 1.5px solid #E5E5E5; display: block; }
    .img-preview.square { width: 80px; height: 80px; object-fit: cover; }
    .img-preview.banner { width: 100%; max-height: 120px; object-fit: cover; }
    .new-badge { display: inline-block; font-size: 0.7rem; font-weight: 700; background: #111111; color: #fff; padding: 2px 8px; border-radius: 20px; margin-bottom: 6px; }
    .img-meta { font-size: 0.73rem; color: #737373; margin-top: 5px; }

    /* ── Status toggle ── */
    .status-options { display: flex; flex-direction: column; gap: 8px; }
    .status-option {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px; border: 1.5px solid #E5E5E5; border-radius: 10px;
        cursor: pointer; transition: all .2s; background: #fafbfc;
    }
    .status-option:hover { border-color: #D4D4D4; }
    .status-option input[type="radio"] { display: none; }
    .status-option.selected { border-color: #111111; background: #F3F0E9; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-active { background: #16a34a; }
    .dot-draft  { background: #A3A3A3; }
    .status-option-text { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .status-option-sub  { font-size: 0.72rem; color: #A3A3A3; }

    /* ── Category meta info ── */
    .meta-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #F4F4F4; font-size: 0.82rem; }
    .meta-item:last-child { border-bottom: none; }
    .meta-key { color: #737373; }
    .meta-val { color: #1a1a2e; font-weight: 600; }

    /* ── Buttons ── */
    .btn-submit {
        width: 100%; padding: 13px; background: #111111; color: #fff;
        border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 700;
        cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-submit:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(17,17,17,.3); }
    .btn-submit:disabled { opacity: .65; cursor: not-allowed; transform: none; }
    .btn-cancel { display: block; text-align: center; margin-top: 10px; color: #737373; font-size: 0.82rem; text-decoration: none; transition: color .2s; }
    .btn-cancel:hover { color: #111111; }

    /* ── Danger zone ── */
    .danger-card { border: 1.5px solid #fee2e2; background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.04); overflow: hidden; }
    .danger-card-header { padding: 14px 20px; background: #fef2f2; border-bottom: 1px solid #fee2e2; display: flex; align-items: center; gap: 8px; }
    .danger-card-header h3 { font-size: 0.85rem; font-weight: 700; color: #dc2626; margin: 0; }
    .danger-card-body { padding: 18px 20px; }
    .btn-delete {
        width: 100%; padding: 11px; background: transparent; color: #dc2626;
        border: 1.5px solid #fca5a5; border-radius: 10px; font-size: 0.85rem; font-weight: 600;
        cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-delete:hover { background: #dc2626; color: #fff; border-color: #dc2626; }
</style>
`,
    content: html`


<div class="content-wrapper" style="background:#f4f5f7;">
<div class="cf-page">
<div class="container-fluid" style="max-width:1200px;">

    
    <div class="cf-header">
        <div>
            <h1><i class="fas fa-pen-to-square"></i> Edit Category</h1>
            <div class="cf-breadcrumb">
                <a href="${route('admin.category.index')}">Categories</a> / ${category?.title}
            </div>
        </div>
        <a href="${route('admin.category.index')}" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:#374151;border-radius:9px;font-size:0.82rem;font-weight:600;text-decoration:none;border:1.5px solid #E5E5E5;transition:all .2s;" onmouseover="this.style.borderColor='#111111';this.style.color='#111111'" onmouseout="this.style.borderColor='#E5E5E5';this.style.color='#374151'">
            <i class="fas fa-arrow-left"></i> Back to Categories
        </a>
    </div>

    <form id="category-form" action="${route('admin.category.update', category?.id)}" method="POST" enctype="multipart/form-data">
        ${csrf_field()}        <div class="cf-grid">

            
            <div>

                
                <div class="cf-card" style="margin-bottom:20px;">
                    <div class="cf-card-header">
                        <div class="header-icon"><i class="fas fa-tag"></i></div>
                        <h3>General Information</h3>
                    </div>
                    <div class="cf-card-body">
                        <div class="field-group">
                            <label class="field-label">Category Title <span class="req">*</span></label>
                            <input type="text" name="title" id="title"
                                   class="field-input ${errors?.has('title') ? 'is-invalid' : ''}"
                                   placeholder="e.g. Summer Collection"
                                   value="${old('title', category?.title)}" autocomplete="off">
                            <div class="slug-preview">
                                <i class="fas fa-link"></i>
                                URL slug: <span id="slug-output">${category?.slug}</span>
                            </div>
                            ${(errors.has('title')) ? (() => { const message = errors.first('title');  return html`<div class="field-error">${message}</div>`; })() : ''}                        </div>
                    </div>
                </div>

                
                <div class="cf-card" style="margin-bottom:20px;">
                    <div class="cf-card-header">
                        <div class="header-icon"><i class="fas fa-image"></i></div>
                        <h3>Category Image</h3>
                    </div>
                    <div class="cf-card-body">

                        
                        <div class="field-group">
                            <label class="field-label">Thumbnail</label>
                            ${(category?.image) ? html`                            <div class="current-img-wrap">
                                <a href="${asset('storage/'  +  (category?.image ?? ''))}" class="glightbox">
                                    <img src="${asset('storage/'  +  (category?.image ?? ''))}" class="current-img-thumb" alt="Current Image">
                                </a>
                                <div class="current-img-meta">
                                    <strong>Current thumbnail</strong>
                                    <span>Upload a new image below to replace it.</span>
                                </div>
                            </div>
                            ` : ''}                            <div class="upload-zone" id="img-zone">
                                <input type="file" name="image" id="img-input" accept="image/*">
                                <i class="fas fa-cloud-upload-alt uz-icon"></i>
                                <div class="uz-title">${category?.image ? 'Replace image' : 'Upload image'}</div>
                                <div class="uz-sub">JPEG, PNG, WEBP · Max 5 MB · Saved as WebP</div>
                            </div>
                            <div class="img-preview-wrap" id="img-preview-wrap">
                                <div class="new-badge">New</div>
                                <img id="img-preview" class="img-preview square" src="" alt="New Preview">
                                <div class="img-meta" id="img-meta"></div>
                            </div>
                            ${(errors.has('image')) ? (() => { const message = errors.first('image');  return html`<div class="field-error">${message}</div>`; })() : ''}                        </div>

                        
                        <div class="field-group">
                            <label class="field-label">Banner</label>
                            ${(category?.banner) ? html`                            <div class="current-img-wrap" style="flex-direction:column; gap:10px;">
                                <a href="${asset('storage/'  +  (category?.banner ?? ''))}" class="glightbox" style="width:100%;">
                                    <img src="${asset('storage/'  +  (category?.banner ?? ''))}" class="current-img-banner" alt="Current Banner">
                                </a>
                                <div class="current-img-meta">
                                    <span>Upload a new banner below to replace it.</span>
                                </div>
                            </div>
                            ` : ''}                            <div class="upload-zone" id="banner-zone">
                                <input type="file" name="banner" id="banner-input" accept="image/*">
                                <i class="fas fa-panorama uz-icon"></i>
                                <div class="uz-title">${category?.banner ? 'Replace banner' : 'Upload banner'}</div>
                                <div class="uz-sub">Recommended: 1400×400 px · Saved as WebP</div>
                            </div>
                            <div class="img-preview-wrap" id="banner-preview-wrap">
                                <div class="new-badge">New</div>
                                <img id="banner-preview" class="img-preview banner" src="" alt="New Banner">
                                <div class="img-meta" id="banner-meta"></div>
                            </div>
                            ${(errors.has('banner')) ? (() => { const message = errors.first('banner');  return html`<div class="field-error">${message}</div>`; })() : ''}                        </div>

                    </div>
                </div>

            </div>

            
            <div>

                
                <div class="cf-card" style="margin-bottom:16px;">
                    <div class="cf-card-header">
                        <div class="header-icon"><i class="fas fa-rocket"></i></div>
                        <h3>Publish</h3>
                    </div>
                    <div class="cf-card-body">
                        <div class="field-group">
                            <label class="field-label">Visibility Status</label>
                            <div class="status-options" id="status-options">
                                <label class="status-option ${old('status', category?.status) === 'active' ? 'selected' : ''}" data-val="active">
                                    <input type="radio" name="status" value="active" ${old('status', category?.status) === 'active' ? 'checked' : ''}>
                                    <span class="status-dot dot-active"></span>
                                    <div>
                                        <div class="status-option-text">Active</div>
                                        <div class="status-option-sub">Visible on the shop</div>
                                    </div>
                                </label>
                                <label class="status-option ${old('status', category?.status) === 'draft' ? 'selected' : ''}" data-val="draft">
                                    <input type="radio" name="status" value="draft" ${old('status', category?.status) === 'draft' ? 'checked' : ''}>
                                    <span class="status-dot dot-draft"></span>
                                    <div>
                                        <div class="status-option-text">Draft</div>
                                        <div class="status-option-sub">Hidden from visitors</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" class="btn-submit" id="submit-btn">
                            <i class="fas fa-save"></i> Update Category
                        </button>
                        <a href="${route('admin.category.index')}" class="btn-cancel">Cancel</a>
                    </div>
                </div>

                
                <div class="cf-card" style="margin-bottom:16px;">
                    <div class="cf-card-header">
                        <div class="header-icon"><i class="fas fa-circle-info"></i></div>
                        <h3>Details</h3>
                    </div>
                    <div class="cf-card-body" style="padding-top:8px; padding-bottom:8px;">
                        <div class="meta-item">
                            <span class="meta-key">ID</span>
                            <span class="meta-val">#${category?.id}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-key">Products</span>
                            <span class="meta-val">${category?.products()?.count()}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-key">Created</span>
                            <span class="meta-val">${category?.created_at?.format('d M Y')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-key">Updated</span>
                            <span class="meta-val">${category?.updated_at?.diffForHumans()}</span>
                        </div>
                    </div>
                </div>

                
                ${(category?.title !== 'Home Page - New Arrival') ? html`                <div class="danger-card">
                    <div class="danger-card-header">
                        <i class="fas fa-triangle-exclamation" style="color:#dc2626;"></i>
                        <h3>Danger Zone</h3>
                    </div>
                    <div class="danger-card-body">
                        <p style="font-size:0.78rem;color:#737373;margin:0 0 4px;">
                            <strong style="color:#dc2626;">Warning:</strong> Deleting this category will
                            <strong>unlink all ${category?.products()?.count()} product(s)</strong> from it.
                            The products will still exist but will have no category.
                        </p>
                        <p style="font-size:0.78rem;color:#A3A3A3;margin:0 0 12px;">This action is permanent and cannot be undone.</p>
                        <button type="button" id="delete-trigger-btn" class="btn-delete">
                            <i class="fas fa-trash-alt"></i> Delete This Category
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </form>

    
    ${(category?.title !== 'Home Page - New Arrival') ? html`    <form action="${route('admin.category.destroy', category?.id)}" method="POST" id="delete-form" style="display:none;">
        ${csrf_field()}        ${method_field('DELETE')}    </form>
    ` : ''}
</div>
</div>
</div>


`,
    scripts: html`<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script src="https://cdn.jsdelivr.net/npm/glightbox/dist/js/glightbox.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function () {

    GLightbox({ selector: '.glightbox' });

    // ── Slug generator ──
    const titleEl = document.getElementById('title');
    const slugOut = document.getElementById('slug-output');
    titleEl.addEventListener('input', () => {
        const slug = titleEl.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        slugOut.textContent = slug || '—';
    });

    // ── Status option toggle ──
    document.querySelectorAll('#status-options .status-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('#status-options .status-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            opt.querySelector('input[type="radio"]').checked = true;
        });
    });

    // ── Upload zone helper ──
    function initUpload(zoneId, inputId, previewId, previewWrapId, metaId, isBanner) {
        const zone    = document.getElementById(zoneId);
        const input   = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const wrap    = document.getElementById(previewWrapId);
        const meta    = document.getElementById(metaId);

        zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault(); zone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) showPreview(e.dataTransfer.files[0]);
        });
        input.addEventListener('change', () => { if (input.files[0]) showPreview(input.files[0]); });

        function showPreview(file) {
            if (!file.type.startsWith('image/')) return;
            preview.src = URL.createObjectURL(file);
            preview.className = 'img-preview ' + (isBanner ? 'banner' : 'square');
            wrap.classList.add('show');
            const kb  = (file.size / 1024).toFixed(0);
            const fmt = file.type.split('/')[1].toUpperCase();
            meta.textContent = fmt + ' · ' + kb + ' KB';
        }
    }

    initUpload('img-zone',    'img-input',    'img-preview',    'img-preview-wrap',    'img-meta',    false);
    initUpload('banner-zone', 'banner-input', 'banner-preview', 'banner-preview-wrap', 'banner-meta', true);

    // ── Loading state ──
    document.getElementById('category-form').addEventListener('submit', () => {
        const btn = document.getElementById('submit-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating…';
        btn.disabled = true;
    });

    // ── Delete confirm (type-to-confirm) ──
    const deleteForm    = document.getElementById('delete-form');
    const deleteTrigger = document.getElementById('delete-trigger-btn');
    const categoryTitle = ${bladeJson(category?.title)};
    const productCount  = ${category?.products()?.count()};

    if (deleteTrigger && deleteForm) {
        deleteTrigger.addEventListener('click', () => {
            Swal.fire({
                title: '<span style="color:#dc2626">Delete Category?</span>',
                html: \`
                    <p style="font-size:0.88rem;color:#374151;margin-bottom:12px;">
                        This will <strong>unlink \${productCount} product(s)</strong> from <strong>\${categoryTitle}</strong>.
                        The products will still exist but have no category assigned.
                    </p>
                    <p style="font-size:0.85rem;color:#737373;margin-bottom:8px;">
                        Type <strong style="color:#dc2626">\${categoryTitle}</strong> to confirm:
                    </p>
                    <input id="swal-confirm-input" class="swal2-input" placeholder="Type category name…" style="font-size:0.9rem;">
                \`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#A3A3A3',
                confirmButtonText: 'Yes, delete it',
                cancelButtonText: 'Cancel',
                preConfirm: () => {
                    const val = document.getElementById('swal-confirm-input').value.trim();
                    if (val !== categoryTitle) {
                        Swal.showValidationMessage(\`Please type the exact category name: "\${categoryTitle}"\`);
                        return false;
                    }
                    return true;
                }
            }).then(r => { if (r.isConfirmed || r.value) deleteForm.submit(); });
        });
    }
});
</script>
`,
  };
}
