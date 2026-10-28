// Port of resources/views/adminside/category/create.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, old, csrf_field, Collection, max, min, e, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let {  } = d;

  return {
    title: html`    <title>Add Category — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Add a new product category with name, image and SEO details for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="add category, create category, new clothing category, product catalog, aga collections admin">
`,
    styles: html`<style>
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
    .cf-card {
        background: #fff; border-radius: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,.06); overflow: hidden;
    }
    .cf-card-header {
        padding: 16px 24px; border-bottom: 1px solid #F4F4F4;
        display: flex; align-items: center; gap: 10px;
    }
    .cf-card-header h3 { font-size: 0.9rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .cf-card-header .header-icon {
        width: 30px; height: 30px; border-radius: 8px; background: #F3F0E9;
        color: #111111; display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
    }
    .cf-card-body { padding: 24px; }

    /* ── Form fields ── */
    .field-group { margin-bottom: 22px; }
    .field-group:last-child { margin-bottom: 0; }
    .field-label {
        display: block; font-size: 0.78rem; font-weight: 700; color: #374151;
        text-transform: uppercase; letter-spacing: .05em; margin-bottom: 7px;
    }
    .field-label .req { color: #111111; margin-left: 2px; }
    .field-input {
        width: 100%; border: 1.5px solid #E5E5E5; border-radius: 9px;
        padding: 10px 14px; font-size: 0.9rem; color: #1a1a2e;
        background: #fafbfc; transition: border-color .2s, box-shadow .2s;
        outline: none;
    }
    .field-input:focus { border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,.1); background: #fff; }
    .field-input.is-invalid { border-color: #dc2626; }
    .field-hint { font-size: 0.75rem; color: #A3A3A3; margin-top: 5px; }
    .field-error { font-size: 0.75rem; color: #dc2626; margin-top: 4px; }

    /* ── Slug preview ── */
    .slug-preview {
        display: flex; align-items: center; gap: 6px;
        margin-top: 7px; font-size: 0.78rem; color: #737373;
        background: #FAFAFA; border-radius: 6px; padding: 6px 10px;
    }
    .slug-preview i { color: #111111; font-size: 0.75rem; }
    #slug-output { font-family: monospace; color: #1a1a2e; }

    /* ── Select ── */
    .field-select {
        width: 100%; border: 1.5px solid #E5E5E5; border-radius: 9px;
        padding: 10px 14px; font-size: 0.9rem; color: #1a1a2e;
        background: #fafbfc url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 10px center/18px no-repeat;
        appearance: none; outline: none; transition: border-color .2s;
    }
    .field-select:focus { border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,.1); }

    /* ── Upload zone ── */
    .upload-zone {
        border: 2px dashed #E5E5E5; border-radius: 10px;
        padding: 28px 20px; text-align: center; cursor: pointer;
        transition: all .2s; background: #fafbfc; position: relative;
    }
    .upload-zone:hover, .upload-zone.dragover { border-color: #111111; background: #F3F0E9; }
    .upload-zone i { font-size: 1.8rem; color: #111111; margin-bottom: 8px; display: block; }
    .upload-zone .uz-title { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .upload-zone .uz-sub { font-size: 0.75rem; color: #A3A3A3; margin-top: 3px; }
    .upload-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

    /* preview */
    .img-preview-wrap { margin-top: 12px; display: none; }
    .img-preview-wrap.show { display: block; }
    .img-preview {
        border-radius: 10px; border: 1.5px solid #E5E5E5; display: block;
        box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }
    .img-preview.square { width: 100px; height: 100px; object-fit: cover; }
    .img-preview.banner { width: 100%; max-height: 160px; object-fit: cover; }
    .img-meta { font-size: 0.73rem; color: #737373; margin-top: 6px; }

    /* ── Sidebar ── */
    .sidebar-section { margin-bottom: 16px; }
    .sidebar-section:last-child { margin-bottom: 0; }

    /* ── Status toggle ── */
    .status-options { display: flex; flex-direction: column; gap: 8px; }
    .status-option {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 14px; border: 1.5px solid #E5E5E5; border-radius: 10px;
        cursor: pointer; transition: all .2s; background: #fafbfc;
    }
    .status-option:hover { border-color: #D4D4D4; background: #FAFAFA; }
    .status-option input[type="radio"] { display: none; }
    .status-option.selected { border-color: #111111; background: #F3F0E9; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-active { background: #16a34a; }
    .dot-draft  { background: #A3A3A3; }
    .status-option-text { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .status-option-sub  { font-size: 0.72rem; color: #A3A3A3; }

    /* ── Submit button ── */
    .btn-submit {
        width: 100%; padding: 13px; background: #111111; color: #fff;
        border: none; border-radius: 10px; font-size: 0.9rem; font-weight: 700;
        cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-submit:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(17,17,17,.3); }
    .btn-submit:disabled { opacity: .65; cursor: not-allowed; transform: none; }

    .btn-cancel {
        display: block; text-align: center; margin-top: 10px;
        color: #737373; font-size: 0.82rem; text-decoration: none; transition: color .2s;
    }
    .btn-cancel:hover { color: #111111; }

    /* ── Tips card ── */
    .tips-list { list-style: none; padding: 0; margin: 0; }
    .tips-list li {
        display: flex; gap: 8px; align-items: flex-start;
        font-size: 0.8rem; color: #737373; padding: 5px 0; border-bottom: 1px solid #F4F4F4;
    }
    .tips-list li:last-child { border-bottom: none; }
    .tips-list li i { color: #111111; font-size: 0.75rem; margin-top: 2px; flex-shrink: 0; }
</style>
`,
    content: html`


<div class="content-wrapper" style="background:#f4f5f7;">
<div class="cf-page">
<div class="container-fluid" style="max-width:1200px;">

    
    <div class="cf-header">
        <div>
            <h1><i class="fas fa-plus-circle"></i> Add Category</h1>
            <div class="cf-breadcrumb">
                <a href="${route('admin.category.index')}">Categories</a> / New Category
            </div>
        </div>
        <a href="${route('admin.category.index')}" style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:#fff;color:#374151;border-radius:9px;font-size:0.82rem;font-weight:600;text-decoration:none;border:1.5px solid #E5E5E5;transition:all .2s;" onmouseover="this.style.borderColor='#111111';this.style.color='#111111'" onmouseout="this.style.borderColor='#E5E5E5';this.style.color='#374151'">
            <i class="fas fa-arrow-left"></i> Back to Categories
        </a>
    </div>

    <form id="category-form" action="${route('admin.category.store')}" method="POST" enctype="multipart/form-data">
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
                                   value="${old('title')}" autocomplete="off">
                            <div class="slug-preview">
                                <i class="fas fa-link"></i>
                                URL slug: <span id="slug-output">enter title above</span>
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
                            <label class="field-label">Thumbnail Image</label>
                            <div class="upload-zone" id="img-zone">
                                <input type="file" name="image" id="img-input" accept="image/*">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <div class="uz-title">Click or drag image here</div>
                                <div class="uz-sub">JPEG, PNG, WEBP · Max 5 MB · Saved as WebP</div>
                            </div>
                            <div class="img-preview-wrap" id="img-preview-wrap">
                                <img id="img-preview" class="img-preview square" src="" alt="Preview">
                                <div class="img-meta" id="img-meta"></div>
                            </div>
                            ${(errors.has('image')) ? (() => { const message = errors.first('image');  return html`<div class="field-error">${message}</div>`; })() : ''}                        </div>

                        <div class="field-group">
                            <label class="field-label">Category Banner</label>
                            <div class="field-hint" style="margin-bottom:8px;">Wide banner shown at the top of the category page.</div>
                            <div class="upload-zone" id="banner-zone">
                                <input type="file" name="banner" id="banner-input" accept="image/*">
                                <i class="fas fa-panorama"></i>
                                <div class="uz-title">Click or drag banner here</div>
                                <div class="uz-sub">Recommended: 1400×400 px · Saved as WebP</div>
                            </div>
                            <div class="img-preview-wrap" id="banner-preview-wrap">
                                <img id="banner-preview" class="img-preview banner" src="" alt="Banner Preview">
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
                                <label class="status-option ${old('status', 'active') === 'active' ? 'selected' : ''}" data-val="active">
                                    <input type="radio" name="status" value="active" ${old('status', 'active') === 'active' ? 'checked' : ''}>
                                    <span class="status-dot dot-active"></span>
                                    <div>
                                        <div class="status-option-text">Active</div>
                                        <div class="status-option-sub">Visible on the shop</div>
                                    </div>
                                </label>
                                <label class="status-option ${old('status') === 'draft' ? 'selected' : ''}" data-val="draft">
                                    <input type="radio" name="status" value="draft" ${old('status') === 'draft' ? 'checked' : ''}>
                                    <span class="status-dot dot-draft"></span>
                                    <div>
                                        <div class="status-option-text">Draft</div>
                                        <div class="status-option-sub">Hidden from visitors</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" class="btn-submit" id="submit-btn">
                            <i class="fas fa-save"></i> Save Category
                        </button>
                        <a href="${route('admin.category.index')}" class="btn-cancel">Cancel</a>
                    </div>
                </div>

                
                <div class="cf-card">
                    <div class="cf-card-header">
                        <div class="header-icon"><i class="fas fa-lightbulb"></i></div>
                        <h3>Tips</h3>
                    </div>
                    <div class="cf-card-body" style="padding-top:16px; padding-bottom:16px;">
                        <ul class="tips-list">
                            <li><i class="fas fa-circle-dot"></i> Keep titles short and descriptive.</li>
                            <li><i class="fas fa-circle-dot"></i> Slugs are auto-generated from the title.</li>
                            <li><i class="fas fa-circle-dot"></i> Images are converted to WebP automatically.</li>
                            <li><i class="fas fa-circle-dot"></i> Use a 1:1 ratio for the thumbnail.</li>
                            <li><i class="fas fa-circle-dot"></i> Banner recommended at 1400×400 px.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    </form>

</div>
</div>
</div>


`,
    scripts: html`<script>
document.addEventListener('DOMContentLoaded', function () {

    // ── Slug generator ──
    const titleEl   = document.getElementById('title');
    const slugOut   = document.getElementById('slug-output');
    titleEl.addEventListener('input', () => {
        const slug = titleEl.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        slugOut.textContent = slug || 'enter title above';
    });
    // init on load (for old() value)
    if (titleEl.value) titleEl.dispatchEvent(new Event('input'));

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
        const zone     = document.getElementById(zoneId);
        const input    = document.getElementById(inputId);
        const preview  = document.getElementById(previewId);
        const wrap     = document.getElementById(previewWrapId);
        const meta     = document.getElementById(metaId);

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
            const kb = (file.size / 1024).toFixed(0);
            const fmt = file.type.split('/')[1].toUpperCase();
            meta.textContent = fmt + ' · ' + kb + ' KB';
        }
    }

    initUpload('img-zone',    'img-input',    'img-preview',    'img-preview-wrap',    'img-meta',    false);
    initUpload('banner-zone', 'banner-input', 'banner-preview', 'banner-preview-wrap', 'banner-meta', true);

    // ── Loading state on submit ──
    document.getElementById('category-form').addEventListener('submit', () => {
        const btn = document.getElementById('submit-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
        btn.disabled = true;
    });
});
</script>
`,
  };
}
