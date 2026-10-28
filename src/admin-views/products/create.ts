// Port of resources/views/adminside/products/create.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { brandInitials } from '@/lib/format';
import { errors as errorBag, route, asset, old, csrf_field, collect, max, min, e, json_encode, JSON_UNESCAPED_UNICODE, json_decode, optional, blank, foreach, quillEditor } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  const skuPrefix = brandInitials(companySetting?.name);
  let { categories, allProducts, tbody, existingTags } = d;

  return {
    title: html`    <title>Add Product — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Add a new clothing product with images, sizes, colors, pricing and SEO details for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="add product, new product, create item, product variants, sizes colors, aga collections admin, ecommerce catalog">
`,
    styles: html`<style>
    /* ── Page ── */
    .pf-page { background: var(--page-bg, #FAFAFA); min-height: 100vh; padding: 0 0 60px; }

    /* ── Hero ── */
    .pf-hero {
        background: linear-gradient(135deg, #111111 0%, #1C1C1C 60%, #111111 100%);
        padding: 28px 0 24px; margin-bottom: 28px;
        border-bottom: 1px solid rgba(17,17,17,.18); position: relative; overflow: hidden;
    }
    .pf-hero::before {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(ellipse at 70% 50%, rgba(17,17,17,.10) 0%, transparent 65%);
    }
    .pf-hero-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; position: relative; z-index:1; }
    .pf-hero-left  { display: flex; align-items: center; gap: 14px; }
    .pf-hero-icon  { width: 48px; height: 48px; border-radius: 12px; background: rgba(17,17,17,.18); border: 1px solid rgba(17,17,17,.3); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #FF4F1F; }
    .pf-hero-title { font-size: 1.4rem; font-weight: 700; color: #F4F4F4; margin: 0 0 3px; }
    .pf-hero-sub   { font-size: .76rem; color: #A3A3A3; margin: 0; }
    .pf-hero-sub a { color: #FFE6DC; text-decoration: none; }

    /* ── Section cards ── */
    .pf-card {
        background: #fff; border-radius: 14px; margin-bottom: 20px;
        box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04);
        border: 1px solid #F4F4F4; overflow: hidden;
    }
    .pf-card-header {
        padding: 14px 20px; border-bottom: 1px solid #F4F4F4;
        display: flex; align-items: center; gap: 10px;
    }
    .pf-card-icon { width: 28px; height: 28px; border-radius: 7px; background: #F3F0E9; color: #111111; display: flex; align-items: center; justify-content: center; font-size: .8rem; flex-shrink: 0; }
    .pf-card-header h3 { font-size: .88rem; font-weight: 700; color: #111111; margin: 0; }
    .pf-card-body { padding: 20px; }

    /* ── Form fields ── */
    .pf-label { font-size: .75rem; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 5px; display: block; }
    .pf-input, .pf-select, .pf-textarea {
        width: 100%; border: 1.5px solid #E5E5E5; border-radius: 9px;
        padding: 9px 12px; font-size: .87rem; color: #111111; background: #FAFAFA;
        transition: border-color .18s, box-shadow .18s;
    }
    .pf-input:focus, .pf-select:focus, .pf-textarea:focus {
        border-color: #111111; outline: none; box-shadow: 0 0 0 3px rgba(17,17,17,.1); background: #fff;
    }
    .pf-input[readonly] { background: #FAFAFA; color: #737373; cursor: default; }
    .pf-hint { font-size: .73rem; color: #A3A3A3; margin-top: 4px; }
    .pf-error { font-size: .73rem; color: #DC2626; margin-top: 3px; }

    /* ── Category checkboxes ── */
    .cat-check-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .cat-check-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1.5px solid #E5E5E5; border-radius: 8px; cursor: pointer; transition: all .15s; }
    .cat-check-item:hover { border-color: #FFE6DC; background: #F0F9FF; }
    .cat-check-item input[type="checkbox"] { width: 15px; height: 15px; accent-color: #111111; cursor: pointer; flex-shrink: 0; }
    .cat-check-item.checked { border-color: #111111; background: #F3F0E9; }
    .cat-check-label { font-size: .83rem; font-weight: 600; color: #374151; cursor: pointer; }

    /* ── Image upload zones ── */
    .upload-zone {
        border: 2px dashed #E5E5E5; border-radius: 10px; padding: 20px;
        text-align: center; cursor: pointer; transition: all .2s; background: #FAFAFA; position: relative;
    }
    .upload-zone:hover, .upload-zone.dragover { border-color: #111111; background: #F3F0E9; }
    .upload-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
    .upload-zone i { font-size: 1.6rem; color: #111111; margin-bottom: 6px; display: block; }
    .upload-zone .uz-title { font-size: .84rem; font-weight: 600; color: #374151; }
    .upload-zone .uz-sub   { font-size: .73rem; color: #A3A3A3; margin-top: 2px; }
    .img-preview { border-radius: 10px; border: 1.5px solid #E5E5E5; display: block; }
    .img-preview.square { width: 100px; height: 100px; object-fit: cover; }
    .img-preview.wide   { width: 100%; max-height: 120px; object-fit: cover; margin-top: 10px; }

    /* ── Pricing row ── */
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .input-prefix-wrap { position: relative; }
    .input-prefix { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: .78rem; font-weight: 700; color: #A3A3A3; pointer-events: none; }
    .input-prefix-wrap .pf-input { padding-left: 38px; }
    .calc-badge { display: inline-flex; align-items: center; gap: 5px; font-size: .72rem; color: #111111; background: #F3F0E9; border: 1px solid rgba(17,17,17,.2); border-radius: 6px; padding: 2px 8px; margin-bottom: 4px; }

    /* ── Toggle switch ── */
    .pf-toggle-row { display: flex; align-items: center; justify-content: space-between; }
    .pf-toggle-row h3 { margin: 0; }
    .form-switch .form-check-input { width: 42px; height: 22px; cursor: pointer; }
    .form-switch .form-check-input:checked { background-color: #111111; border-color: #111111; }

    /* ── Option builder ── */
    .option-group { background: #FAFAFA; border: 1.5px solid #E5E5E5; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }
    .btn-add-opt { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; background: #F3F0E9; color: #111111; border: 1.5px solid rgba(17,17,17,.3); border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .18s; }
    .btn-add-opt:hover { background: #E9E4D9; }
    .btn-gen-variants { display: inline-flex; align-items: center; gap: 6px; padding: 7px 18px; background: #111111; color: #fff; border: none; border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; transition: background .18s; }
    .btn-gen-variants:hover { background: #1C1C1C; }
    .btn-remove-opt { background: #FEF2F2; color: #DC2626; border: none; border-radius: 7px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .18s; }
    .btn-remove-opt:hover { background: #DC2626; color: #fff; }

    /* ── Variant table ── */
    .variant-tbl { width: 100%; border-collapse: collapse; }
    .variant-tbl thead th { background: #FAFAFA; color: #737373; font-size: .69rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; padding: 9px 12px; border-bottom: 1.5px solid #E5E5E5; }
    .variant-tbl tbody td { padding: 10px 12px; border-bottom: 1px solid #F4F4F4; vertical-align: middle; }
    .variant-tbl tbody tr:last-child td { border-bottom: none; }
    .variant-tbl .pf-input { padding: 7px 10px; border-radius: 7px; font-size: .83rem; }
    .btn-remove-var { background: #FEF2F2; color: #DC2626; border: none; border-radius: 7px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; margin: auto; transition: all .18s; }
    .btn-remove-var:hover { background: #DC2626; color: #fff; }
    .variant-tbl tfoot td { background: #FAFAFA; font-size: .82rem; font-weight: 600; color: #737373; padding: 9px 12px; text-align: right; }

    /* ── Sidebar ── */
    .sidebar-card { background: #fff; border-radius: 14px; margin-bottom: 16px; border: 1px solid #F4F4F4; box-shadow: 0 1px 4px rgba(0,0,0,.05); overflow: hidden; }
    .sidebar-card-header { padding: 12px 16px; border-bottom: 1px solid #F4F4F4; display: flex; align-items: center; gap: 8px; }
    .sidebar-card-header h4 { font-size: .83rem; font-weight: 700; color: #111111; margin: 0; }
    .sidebar-card-body { padding: 14px 16px; }

    /* Status option cards */
    .status-opts { display: flex; flex-direction: column; gap: 8px; }
    .status-opt { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1.5px solid #E5E5E5; border-radius: 9px; cursor: pointer; transition: all .18s; }
    .status-opt:hover { border-color: #FFE6DC; }
    .status-opt.selected { border-color: #111111; background: #F3F0E9; }
    .status-opt input[type="radio"] { display: none; }
    .status-dot-sm { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .dot-active { background: #16A34A; }
    .dot-draft  { background: #A3A3A3; }

    /* Live preview card */
    .preview-img { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; border: 1px solid #E5E5E5; display: block; }
    .preview-title { font-size: .95rem; font-weight: 700; color: #111111; margin: 10px 0 4px; }
    .preview-price { font-size: 1.05rem; font-weight: 800; color: #111111; }
    .preview-compare { font-size: .8rem; color: #A3A3A3; text-decoration: line-through; margin-left: 6px; }

    /* Submit button */
    .btn-submit { width: 100%; padding: 12px; background: #111111; color: #fff; border: none; border-radius: 10px; font-size: .9rem; font-weight: 700; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-submit:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(17,17,17,.3); }
    .btn-submit:disabled { opacity: .6; cursor: not-allowed; transform: none; }

    /* Related products list */
    .related-list { max-height: 220px; overflow-y: auto; border: 1.5px solid #E5E5E5; border-radius: 9px; padding: 10px 12px; background: #FAFAFA; }
    .related-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #F4F4F4; }
    .related-item:last-child { border-bottom: none; }
    .related-item input { accent-color: #111111; }
    .related-item label { font-size: .83rem; color: #374151; cursor: pointer; }

    .tagify { border: 1.5px solid #E5E5E5 !important; border-radius: 9px !important; background: #FAFAFA !important; padding: 4px 8px !important; min-height: 40px !important; }
    .tagify--focus { border-color: #111111 !important; box-shadow: 0 0 0 3px rgba(17,17,17,.1) !important; }
    .tagify__tag { background: #F3F0E9 !important; border-radius: 6px !important; }
</style>
`,
    content: html`<div class="content-wrapper" style="background: var(--page-bg, #FAFAFA);">
<div class="pf-page">

    
    <div class="pf-hero">
        <div class="container-fluid" style="max-width:1400px;">
            <div class="pf-hero-inner">
                <div class="pf-hero-left">
                    <div class="pf-hero-icon"><i class="fas fa-plus-circle"></i></div>
                    <div>
                        <h1 class="pf-hero-title">Add New Product</h1>
                        <p class="pf-hero-sub">
                            <a href="${route('admin.home')}">Dashboard</a>
                            <span style="margin:0 6px;color:#525252;">/</span>
                            <a href="${route('admin.products.index')}">Products</a>
                            <span style="margin:0 6px;color:#525252;">/</span> Add New
                        </p>
                    </div>
                </div>
                <a href="${route('admin.products.index')}" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;background:rgba(255,255,255,.1);color:#E5E5E5;border:1px solid rgba(255,255,255,.15);border-radius:9px;font-size:.83rem;font-weight:600;text-decoration:none;transition:all .2s;">
                    <i class="fas fa-arrow-left"></i> All Products
                </a>
            </div>
        </div>
    </div>

    <div class="container-fluid" style="max-width:1400px;">

        
        ${(errors?.any()) ? html`        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;">
            <i class="fas fa-exclamation-circle" style="color:#DC2626;margin-top:2px;"></i>
            <div>
                <div style="font-size:.85rem;font-weight:700;color:#991B1B;margin-bottom:6px;">Please fix the following errors:</div>
                <ul style="margin:0;padding-left:16px;font-size:.83rem;color:#B91C1C;">
                    ${foreach(errors?.all(), (error, loop) => html`<li>${error}</li>`)}                </ul>
            </div>
        </div>
        ` : ''}
        <form method="POST" action="${route('admin.products.store')}" enctype="multipart/form-data" id="product-form">
            ${csrf_field()}
            <div class="row g-4">

                
                <div class="col-lg-8">

                    
                    <div class="pf-card">
                        <div class="pf-card-header">
                            <div class="pf-card-icon"><i class="fas fa-info-circle"></i></div>
                            <h3>Product Information</h3>
                        </div>
                        <div class="pf-card-body">
                            <div class="row g-3 mb-3">
                                <div class="col-md-7">
                                    <label class="pf-label">Product Title <span style="color:#DC2626;">*</span></label>
                                    <input type="text" name="name" class="pf-input ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html` is-invalid `; })() : ''}"
                                        value="${old('name')}" placeholder="e.g. Short Sleeve Cotton T-Shirt">
                                    ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html`<div class="pf-error">${message}</div>`; })() : ''}                                </div>
                                <div class="col-md-5">
                                    <label class="pf-label">Slug <span style="font-size:.7rem;color:#A3A3A3;font-weight:400;text-transform:none;">(auto-generated)</span></label>
                                    <input type="text" name="slug" id="slug-input" class="pf-input" value="${old('slug')}" placeholder="auto-generated-from-title">
                                    <div class="pf-hint" id="slug-preview" style="font-family:monospace;">/products/${old('slug')}</div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="pf-label">Categories <span style="color:#DC2626;">*</span></label>
                                <div class="cat-check-grid">
                                    ${foreach(categories, (category, loop) => html`                                    <label class="cat-check-item ${collect(old('category_ids'))?.contains(category?.id) ? 'checked' : ''}" id="cat-wrap-${category?.id}">
                                        <input type="checkbox" name="category_ids[]" value="${category?.id}"
                                            ${collect(old('category_ids'))?.contains(category?.id) ? 'checked' : ''}
                                            onchange="this.closest('.cat-check-item').classList.toggle('checked', this.checked)">
                                        <span class="cat-check-label">${category?.title}</span>
                                    </label>
                                    `)}                                </div>
                                ${(errors.has('category_ids')) ? (() => { const message = errors.first('category_ids');  return html`<div class="pf-error mt-1">${message}</div>`; })() : ''}                            </div>

                            <div>
                                ${quillEditor({ id: 'description', label: 'Description', lang: 'en', mode: 'content', value: old('description'), placeholder: 'Write a detailed product description…' })}
                            </div>
                        </div>
                    </div>

                    
                    <div class="pf-card">
                        <div class="pf-card-header">
                            <div class="pf-card-icon"><i class="fas fa-images"></i></div>
                            <h3>Product Media</h3>
                        </div>
                        <div class="pf-card-body">
                            <div class="row g-3">
                                <div class="col-md-5">
                                    <label class="pf-label">Primary Image</label>
                                    <div class="upload-zone" id="primary-zone">
                                        <input type="file" name="primary_image" accept="image/*" id="primary-file">
                                        <i class="fas fa-cloud-upload-alt"></i>
                                        <div class="uz-title">Click or drag to upload</div>
                                        <div class="uz-sub">JPG, PNG, GIF — main listing image</div>
                                    </div>
                                    <img id="primary-preview" class="img-preview square mt-2" src="#" style="display:none;">
                                </div>
                                <div class="col-md-7">
                                    <label class="pf-label">Additional Images</label>
                                    <div class="upload-zone">
                                        <input type="file" name="additional_images[]" accept="image/*" multiple id="additional-file">
                                        <i class="fas fa-layer-group"></i>
                                        <div class="uz-title">Click or drag multiple images</div>
                                        <div class="uz-sub">Upload gallery / detail images</div>
                                    </div>
                                    <div id="additional-previews" class="d-flex flex-wrap gap-2 mt-2"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    
                    <div class="pf-card">
                        <div class="pf-card-header">
                            <div class="pf-card-icon"><i class="fas fa-tag"></i></div>
                            <h3>Pricing</h3>
                        </div>
                        <div class="pf-card-body">
                            <div class="pricing-grid mb-3">
                                <div>
                                    <label class="pf-label">Price (PKR)</label>
                                    <div class="input-prefix-wrap">
                                        <span class="input-prefix">PKR</span>
                                        <input type="number" name="price" class="pf-input price" value="${old('price')}" placeholder="0.00" step="0.01" min="0">
                                    </div>
                                    <div class="pf-hint">Selling price shown to customers</div>
                                </div>
                                <div>
                                    <label class="pf-label">Compare-at Price</label>
                                    <div class="input-prefix-wrap">
                                        <span class="input-prefix">PKR</span>
                                        <input type="number" name="sale_price" class="pf-input" value="${old('sale_price')}" placeholder="0.00" step="0.01" min="0">
                                    </div>
                                    <div class="pf-hint">Optional — shows strikethrough discount</div>
                                </div>
                                <div>
                                    <label class="pf-label">Cost per Item</label>
                                    <div class="input-prefix-wrap">
                                        <span class="input-prefix">PKR</span>
                                        <input type="number" name="cost" class="pf-input cost" value="${old('cost')}" placeholder="0.00" step="0.01" min="0">
                                    </div>
                                    <div class="pf-hint">Your purchase cost</div>
                                </div>
                            </div>
                            <div class="pricing-grid mb-3">
                                <div>
                                    <div class="calc-badge"><i class="fas fa-calculator" style="font-size:.65rem;"></i> Auto-calculated</div>
                                    <label class="pf-label">Profit</label>
                                    <div class="input-prefix-wrap">
                                        <span class="input-prefix">PKR</span>
                                        <input type="number" name="profit" class="pf-input profit" value="${old('profit')}" readonly placeholder="—">
                                    </div>
                                </div>
                                <div>
                                    <div class="calc-badge"><i class="fas fa-calculator" style="font-size:.65rem;"></i> Auto-calculated</div>
                                    <label class="pf-label">Margin (%)</label>
                                    <input type="number" name="margin" class="pf-input margin" value="${old('margin')}" readonly placeholder="—">
                                </div>
                                <div>
                                    <label class="pf-label">Available Quantity</label>
                                    <input type="number" name="quantity" class="pf-input" value="${old('quantity', 0)}" min="0">
                                    <div class="pf-hint">Used when no variants are set</div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-10 mt-2">
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.84rem;font-weight:600;color:#374151;">
                                    <input type="checkbox" name="is_best_seller" id="is_best_seller" style="accent-color:#111111;width:15px;height:15px;">
                                    Best Seller
                                </label>
                                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:.84rem;font-weight:600;color:#374151;margin-left:20px;">
                                    <input type="checkbox" name="is_featured" id="is_featured" style="accent-color:#111111;width:15px;height:15px;">
                                    Featured Product
                                </label>
                            </div>
                        </div>
                    </div>

                    
                    <div class="pf-card">
                        <div class="pf-card-header">
                            <div class="pf-card-icon"><i class="fas fa-warehouse"></i></div>
                            <h3>Inventory</h3>
                        </div>
                        <div class="pf-card-body">
                            <div style="max-width:380px;">
                                <label class="pf-label">SKU (Stock Keeping Unit)</label>
                                <input type="text" name="sku" id="sku" class="pf-input" value="${old('sku')}" placeholder="e.g. ${skuPrefix}-69-OVE-TEE">
                                <div class="pf-hint">Auto-generated from product name if left blank</div>
                            </div>
                        </div>
                    </div>

                    
                    <div class="pf-card">
                        <div class="pf-card-header pf-toggle-row">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <div class="pf-card-icon"><i class="fas fa-layer-group"></i></div>
                                <h3>Product Variants</h3>
                            </div>
                            <div class="form-check form-switch mb-0">
                                <input class="form-check-input" type="checkbox" id="toggle-variants">
                                <label class="form-check-label" for="toggle-variants" style="font-size:.82rem;font-weight:600;color:#737373;">Has Variants</label>
                            </div>
                        </div>
                        <div class="pf-card-body" id="variants-container" style="display:none;">
                            <div class="pf-hint mb-3">Define options like Size or Color, then generate all variant combinations.</div>

                            <div id="options-section" class="mb-3"></div>

                            <div class="d-flex gap-2 mb-4">
                                <button type="button" class="btn-add-opt" onclick="addOption()">
                                    <i class="fas fa-plus"></i> Add Option
                                </button>
                                <button type="button" class="btn-gen-variants" onclick="generateVariants()">
                                    <i class="fas fa-layer-group"></i> Generate Variants
                                </button>
                            </div>

                            <div style="overflow-x:auto;">
                                <table class="variant-tbl" id="variant-table">
                                    <thead>
                                        <tr>
                                            <th style="width:64px;">Image</th>
                                            <th>Options</th>
                                            <th style="width:150px;">SKU</th>
                                            <th style="width:110px;">Price (PKR)</th>
                                            <th style="width:90px;">Quantity</th>
                                            <th style="width:70px;">Default</th>
                                            <th style="width:40px;"></th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="7">
                                                Total inventory: <span id="total-inventory" style="color:#111111;">0</span> units
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    
                    <div class="pf-card">
                        <div class="pf-card-header pf-toggle-row">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <div class="pf-card-icon" style="background:#F0FDF4;color:#16A34A;"><i class="fas fa-link"></i></div>
                                <h3>Related Products</h3>
                            </div>
                            <div class="form-check form-switch mb-0">
                                <input class="form-check-input" type="checkbox" id="toggle-related">
                                <label class="form-check-label" for="toggle-related" style="font-size:.82rem;font-weight:600;color:#737373;">Include</label>
                            </div>
                        </div>
                        <div class="pf-card-body" id="related-container" style="display:none;">
                            <div class="pf-hint mb-3">Suggest products shown on the detail page. Leave blank to use defaults.</div>
                            <div class="related-list">
                                ${foreach(allProducts, (rp, loop) => html`                                <div class="related-item">
                                    <input type="checkbox" name="related_products[]" id="rp_${rp?.id}" value="${rp?.id}" style="accent-color:#111111;width:14px;height:14px;">
                                    <label for="rp_${rp?.id}" class="related-item" style="border:none;padding:0;cursor:pointer;font-size:.83rem;color:#374151;">${rp?.name}</label>
                                </div>
                                `)}                            </div>
                        </div>
                    </div>

                </div>

                
                <div class="col-lg-4">
                    <div class="position-sticky" style="top:20px;">

                        
                        <div class="sidebar-card">
                            <div class="sidebar-card-header">
                                <i class="fas fa-eye" style="color:#111111;font-size:.85rem;"></i>
                                <h4>Live Preview</h4>
                            </div>
                            <div class="sidebar-card-body">
                                <img id="preview-image" src="${asset('images/placeholder.png')}" class="preview-img" alt="Preview">
                                <div class="preview-title" id="preview-title">Product Title</div>
                                <div>
                                    <span class="preview-price" id="preview-price">PKR 0.00</span>
                                    <span class="preview-compare d-none" id="preview-compare"></span>
                                </div>
                            </div>
                        </div>

                        
                        <div class="sidebar-card">
                            <div class="sidebar-card-header">
                                <i class="fas fa-toggle-on" style="color:#111111;font-size:.85rem;"></i>
                                <h4>Status</h4>
                            </div>
                            <div class="sidebar-card-body">
                                <input type="hidden" name="status" id="status-value" value="${old('status', 'active')}">
                                <div class="status-opts">
                                    <label class="status-opt ${old('status', 'active') === 'active' ? 'selected' : ''}" onclick="setStatus('active')">
                                        <input type="radio" name="_status_r" value="active" ${old('status', 'active') === 'active' ? 'checked' : ''}>
                                        <span class="status-dot-sm dot-active"></span>
                                        <div>
                                            <div style="font-size:.85rem;font-weight:700;color:#111111;">Active</div>
                                            <div style="font-size:.72rem;color:#A3A3A3;">Visible in the store</div>
                                        </div>
                                    </label>
                                    <label class="status-opt ${old('status') === 'draft' ? 'selected' : ''}" onclick="setStatus('draft')">
                                        <input type="radio" name="_status_r" value="draft" ${old('status') === 'draft' ? 'checked' : ''}>
                                        <span class="status-dot-sm dot-draft"></span>
                                        <div>
                                            <div style="font-size:.85rem;font-weight:700;color:#111111;">Draft</div>
                                            <div style="font-size:.72rem;color:#A3A3A3;">Hidden from customers</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        
                        <div class="sidebar-card">
                            <div class="sidebar-card-header">
                                <i class="fas fa-tags" style="color:#D97706;font-size:.85rem;"></i>
                                <h4>Organisation</h4>
                            </div>
                            <div class="sidebar-card-body">
                                <div class="mb-3">
                                    <label class="pf-label">Product Type</label>
                                    <input type="text" name="type" class="pf-input" value="${old('type')}" placeholder="e.g. Apparel">
                                </div>
                                <div>
                                    <label class="pf-label">Tags</label>
                                    <input id="tags-input" name="tags"
                                        value='${old(`tags`) ? json_encode(json_decode(old(`tags`)), JSON_UNESCAPED_UNICODE) : ``}'
                                        placeholder="Add tags…" />
                                    <div class="pf-hint">Press Enter or comma to add</div>
                                </div>
                            </div>
                        </div>

                        
                        <div class="sidebar-card">
                            <div class="sidebar-card-body">
                                <button type="submit" class="btn-submit" id="submit-btn">
                                    <i class="fas fa-save"></i> Save Product
                                </button>
                                <a href="${route('admin.products.index')}" style="display:block;text-align:center;margin-top:10px;font-size:.82rem;color:#A3A3A3;text-decoration:none;">
                                    Cancel
                                </a>
                            </div>
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
$(document).ready(function () {

    /*──────────────────────────────
     *  STATUS SELECTOR
     *──────────────────────────────*/
    window.setStatus = function (val) {
        $('#status-value').val(val);
        $('.status-opt').removeClass('selected');
        $(\`.status-opt input[value="\${val}"]\`).closest('.status-opt').addClass('selected');
    };

    /*──────────────────────────────
     *  SLUG AUTO-GENERATION
     *──────────────────────────────*/
    let manualSlug = false;
    $('input[name="slug"]').on('input', function () {
        manualSlug = true;
        $('#slug-preview').text('/products/' + $(this).val());
    });
    $('input[name="name"]').on('input', function () {
        const name = $(this).val();
        $('#preview-title').text(name || 'Product Title');

        if (!manualSlug) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            $('input[name="slug"]').val(slug);
            $('#slug-preview').text('/products/' + slug);
        }

        // Auto SKU
        const sku = document.getElementById('sku');
        if (sku && name.trim()) {
            sku.value = '${skuPrefix}-' + name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map(w => w.substring(0, 3).toUpperCase()).join('-');
        }
    });

    /*──────────────────────────────
     *  PRICING
     *──────────────────────────────*/
    function calcMargin() {
        const price  = parseFloat($('.price').val()) || 0;
        const cost   = parseFloat($('.cost').val())  || 0;
        const profit = price - cost;
        const margin = price > 0 ? (profit / price * 100) : 0;
        $('.profit').val(profit.toFixed(2));
        $('.margin').val(margin.toFixed(2));
        $('#preview-price').text('PKR ' + price.toFixed(2));
        fixprice = price;
    }
    $('.price, .cost').on('input', calcMargin);

    $('input[name="sale_price"]').on('input', function () {
        const compare = parseFloat($(this).val()) || 0;
        if (compare) {
            $('#preview-compare').text('PKR ' + compare.toFixed(2)).removeClass('d-none');
        } else {
            $('#preview-compare').addClass('d-none');
        }
    });

    /*──────────────────────────────
     *  IMAGES
     *──────────────────────────────*/
    let primaryImageDataUrl = '';

    $('#primary-file').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                primaryImageDataUrl = e.target.result;
                $('#primary-preview').attr('src', e.target.result).show();
                $('#preview-image').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $('#additional-file').on('change', function () {
        const container = $('#additional-previews').empty();
        Array.from(this.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = $('<img>').attr('src', e.target.result)
                    .css({ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #E5E5E5' });
                container.append(img);
            };
            reader.readAsDataURL(file);
        });
    });

    /*──────────────────────────────
     *  TOGGLES
     *──────────────────────────────*/
    $('#toggle-variants').on('change', function () {
        if ($(this).is(':checked')) {
            $('#variants-container').slideDown(200);
        } else {
            $('#variants-container').slideUp(200);
            $('#options-section').empty();
            $('#variant-table tbody').empty();
            $('#total-inventory').text('0');
        }
    });

    $('#toggle-related').on('change', function () {
        $('#related-container').toggle($(this).is(':checked'));
    });

    /*──────────────────────────────
     *  OPTIONS & VARIANTS
     *──────────────────────────────*/
    let fixprice = 0;

    window.addOption = function () {
        const i = $('#options-section .option-group').length;
        $('#options-section').append(\`
            <div class="option-group d-flex gap-3 align-items-center">
                <div style="flex:0 0 200px;">
                    <label class="pf-label">Option Name</label>
                    <input type="text" class="pf-input option-name" name="options[\${i}][name]" placeholder="e.g. Size, Color">
                </div>
                <div style="flex:1;">
                    <label class="pf-label">Values (comma separated)</label>
                    <input type="text" class="pf-input option-values" name="options[\${i}][values]" placeholder="e.g. Small, Medium, Large">
                </div>
                <div style="padding-top:22px;">
                    <button type="button" class="btn-remove-opt remove-option-btn"><i class="fas fa-times"></i></button>
                </div>
            </div>
        \`);
    };

    $(document).on('click', '.remove-option-btn', function () {
        $(this).closest('.option-group').remove();
        generateVariants();
    });

    // Product SKU + the size/colour codes, so every variant SKU is unique (AC-69-OVE-TEE-S)
    function generateSKU(combo) {
        const base = (document.getElementById('sku')?.value || '').trim() || '${skuPrefix}';
        return base + '-' + combo.map(v => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()).join('-');
    }

    window.generateVariants = function () {
        const names = [], values = [];
        const optionNames = new Set();
        let bad = false;

        $('.option-group').each(function () {
            const name = $(this).find('.option-name').val().trim().toLowerCase();
            const vals = $(this).find('.option-values').val().trim();
            if (!name || !vals) return;
            if (optionNames.has(name)) { alert('Duplicate option: ' + name); bad = true; return false; }
            optionNames.add(name);
            names.push(name);
            values.push(vals.split(',').map(v => v.trim().toLowerCase()));
        });

        if (bad || !names.length) return;

        const combos = (arrs, pre = []) => !arrs.length ? [pre] : arrs[0].flatMap(v => combos(arrs.slice(1), [...pre, v]));
        const $tbody = $('#variant-table tbody').empty();

        combos(values).forEach((combo, i) => {
            const opt = Object.fromEntries(combo.map((v, idx) => [names[idx], v]));
            const key = JSON.stringify(opt);
            const sku = generateSKU(combo);
            $tbody.append(\`
                <tr class="variant-row">
                    <td>
                        <label for="vi_\${i}" style="cursor:pointer;display:inline-block;">
                            <img id="vi_prev_\${i}" src="" alt="" style="display:none;width:44px;height:44px;object-fit:cover;border-radius:6px;border:1.5px solid #E5E5E5;">
                            <div id="vi_ph_\${i}" style="width:44px;height:44px;border:2px dashed #D4D4D4;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#A3A3A3;font-size:.75rem;">
                                <i class="fas fa-camera"></i>
                            </div>
                        </label>
                        <input type="file" id="vi_\${i}" name="variant_images[\${i}]" accept="image/*" style="display:none;" onchange="previewVariantImg(this,\${i})">
                    </td>
                    <td>
                        <div style="font-size:.8rem;font-weight:600;color:#374151;">\${Object.entries(opt).map(([k,v]) => \`<span style="color:#737373;font-size:.7rem;text-transform:uppercase;">\${k}:</span> \${v}\`).join(' &nbsp;')}</div>
                        <input type="hidden" name="variants[\${i}][option_values]" value='\${key}'>
                    </td>
                    <td><input type="text" name="variants[\${i}][sku]" class="pf-input" value="\${sku}"></td>
                    <td><input type="number" name="variants[\${i}][price]" class="pf-input" step="0.01" value="\${fixprice > 0 ? fixprice.toFixed(2) : ''}"></td>
                    <td><input type="number" name="variants[\${i}][quantity]" class="pf-input variant-qty" value="0" min="0"></td>
                    <td style="text-align:center;"><input type="radio" name="default_variant" value="\${i}" \${i === 0 ? 'checked' : ''} style="accent-color:#111111;width:15px;height:15px;"></td>
                    <td><button type="button" class="btn-remove-var remove-variant-btn"><i class="fas fa-times"></i></button></td>
                </tr>
            \`);
        });

        updateTotalInventory();
    };

    $(document).on('click', '.remove-variant-btn', function () {
        $(this).closest('tr').remove();
        updateTotalInventory();
    });

    function updateTotalInventory() {
        let t = 0;
        $('.variant-qty').each(function () { t += parseInt($(this).val()) || 0; });
        $('#total-inventory').text(t);
    }
    $(document).on('input', '.variant-qty', updateTotalInventory);

    /*──────────────────────────────
     *  TAGS (Tagify)
     *──────────────────────────────*/
    const tagsEl = document.querySelector('#tags-input');
    if (tagsEl && window.Tagify) {
        new Tagify(tagsEl, {
            whitelist: ${bladeJson(existingTags)},
            dropdown: { enabled: 0, maxItems: 10, position: 'auto', highlightFirst: true }
        });
    }

    /*──────────────────────────────
     *  VARIANT IMAGE PREVIEW
     *──────────────────────────────*/
    window.previewVariantImg = function (input, i) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                $('#vi_prev_' + i).attr('src', e.target.result).show();
                $('#vi_ph_' + i).hide();
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    /*──────────────────────────────
     *  FORM SUBMIT
     *──────────────────────────────*/
    $('#product-form').on('submit', function () {
        const btn = $('#submit-btn');
        btn.attr('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving…');
    });

});
</script>
`,
  };
}
