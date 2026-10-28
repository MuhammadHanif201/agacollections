// Port of resources/views/adminside/company_settings/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, old, session, csrf_field, count, ucfirst, max, min, e, json_encode, optional, entries, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { setting, code, label, ico } = d;
  let savedEmails = setting?.getEmailsAsAssociative();
  let emailKeys = ['default','support','sales','contact'];
  let socialLinks = old('social_links', setting?.social_links ?? []);
  let saved_shipping = setting?.shipping_charges ?? [];
  let pkZones: Record<string, any> = {
                                  'karachi'         : ['Karachi', 'fas fa-city'],
                                  'lahore'          : ['Lahore', 'fas fa-building'],
                                  'islamabad'       : ['Islamabad / Rawalpindi', 'fas fa-landmark'],
                                  'other_major'     : ['Other Major Cities', 'fas fa-map-pin'],
                                  'rest_of_pakistan': ['Rest of Pakistan', 'fas fa-map'],
                                  'remote'          : ['Remote / AJK / GB', 'fas fa-mountain'],
                              };
  return {
    title: html`<title>Edit Company Settings — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Update company name, logo, favicon, contact info, address and social links for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="edit company settings, update branding, logo, favicon, contact, social links, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
/* ── Base ─────────────────────────────────────────── */
.cs-page { padding: 32px 32px 120px; }

/* ── Hero ─────────────────────────────────────────── */
.cs-hero {
    background: linear-gradient(135deg, #111111 0%, #1E3A5F 60%, #2A2A2A 100%);
    border-radius: 22px; padding: 32px 36px;
    position: relative; overflow: hidden; margin-bottom: 28px;
}
.cs-hero::before {
    content: ''; position: absolute; inset: 0; opacity: .07;
    background-image: radial-gradient(circle at 1px 1px, #fff 1px, transparent 0);
    background-size: 28px 28px;
}
.cs-hero-body { position: relative; z-index: 1; display: flex; align-items: center; gap: 20px; }
.cs-hero-ico {
    width: 58px; height: 58px; border-radius: 17px; flex-shrink: 0;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18);
    backdrop-filter: blur(8px); display: flex; align-items: center;
    justify-content: center; font-size: 1.4rem; color: #fff;
}
.cs-hero-title  { font-size: 1.55rem; font-weight: 800; color: #fff; margin: 0; letter-spacing: -.02em; }
.cs-hero-sub    { font-size: .82rem; color: rgba(255,255,255,.6); margin: 3px 0 0; }

/* ── Tab Nav ──────────────────────────────────────── */
.cs-tabs {
    display: flex; gap: 6px; margin-bottom: 24px;
    background: #fff; border: 1px solid #E8EDF5;
    border-radius: 16px; padding: 6px; flex-wrap: wrap;
    box-shadow: 0 2px 12px rgba(15,23,42,.05);
}
.cs-tab-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 11px; border: none; background: transparent;
    font-size: .82rem; font-weight: 600; color: #737373; cursor: pointer;
    transition: all .2s; white-space: nowrap;
}
.cs-tab-btn:hover { background: #F4F4F4; color: #1C1C1C; }
.cs-tab-btn.active {
    background: linear-gradient(135deg, #2A2A2A, #111111);
    color: #fff; box-shadow: 0 4px 12px rgba(17,17,17,.3);
}
.cs-tab-btn .tab-ico { font-size: .85rem; }
.cs-tab-pane { display: none; }
.cs-tab-pane.active { display: block; }

/* ── Card ─────────────────────────────────────────── */
.cs-card {
    background: #fff; border: 1px solid #E8EDF5;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 2px 16px rgba(15,23,42,.06); margin-bottom: 20px;
}
.cs-card-hd {
    padding: 16px 24px; border-bottom: 1px solid #F4F4F4;
    display: flex; align-items: center; gap: 12px; background: #FAFBFE;
}
.cs-card-hd-ico {
    width: 34px; height: 34px; border-radius: 10px;
    background: rgba(17,17,17,.1); color: #111111;
    display: flex; align-items: center; justify-content: center; font-size: .85rem;
}
.cs-card-hd-title { font-size: .78rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .1em; }
.cs-card-body { padding: 24px; }

/* ── Fields ───────────────────────────────────────── */
.cs-field { margin-bottom: 20px; }
.cs-lbl {
    display: block; font-size: .75rem; font-weight: 700;
    color: #374151; margin-bottom: 7px; letter-spacing: .02em;
}
.cs-lbl .req { color: #EF4444; margin-left: 2px; }
.cs-lbl .opt { color: #9CA3AF; font-weight: 400; font-size: .7rem; }
.cs-inp {
    width: 100%; padding: 11px 15px;
    border: 1.5px solid #E5E5E5; border-radius: 11px;
    font-size: .88rem; color: #1C1C1C; background: #fff;
    transition: border-color .2s, box-shadow .2s;
    box-shadow: 0 1px 3px rgba(15,23,42,.04);
}
.cs-inp:focus { outline: none; border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,.13); }
.cs-inp.is-invalid { border-color: #EF4444; }
.cs-hint { font-size: .72rem; color: #A3A3A3; margin-top: 5px; }
.cs-err  { font-size: .73rem; color: #EF4444; margin-top: 5px; font-weight: 500; }
textarea.cs-inp { resize: vertical; min-height: 90px; }

/* ── Upload box ───────────────────────────────────── */
.cs-upload-wrap { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.cs-upload-preview {
    width: 88px; height: 88px; border-radius: 13px;
    border: 2px dashed #D4D4D4; background: #FAFAFA;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0; cursor: pointer;
}
.cs-upload-preview img { width: 100%; height: 100%; object-fit: contain; }
.cs-upload-preview.favicon { width: 52px; height: 52px; }
.cs-upload-preview.banner  { width: 140px; height: 70px; }
.cs-upload-trigger {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 16px; border: 1.5px dashed #D4D4D4; border-radius: 10px;
    font-size: .8rem; font-weight: 600; color: #525252; cursor: pointer;
    background: #FAFAFA; transition: all .2s;
}
.cs-upload-trigger:hover { border-color: #111111; color: #111111; background: #F3F0E9; }
input[type="file"].cs-file { display: none; }

/* ── Dynamic list ─────────────────────────────────── */
.cs-dyn-item {
    display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.cs-dyn-item .cs-inp { flex: 1; margin-bottom: 0; }
.cs-dyn-rm {
    width: 34px; height: 34px; border-radius: 9px;
    border: 1.5px solid #FCA5A5; background: #FEF2F2;
    color: #EF4444; font-size: .8rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all .15s;
}
.cs-dyn-rm:hover { background: #EF4444; color: #fff; }
.cs-add-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 14px; border-radius: 9px;
    border: 1.5px dashed #FFE6DC; background: #F3F0E9;
    color: #111111; font-size: .78rem; font-weight: 700; cursor: pointer;
    transition: all .2s;
}
.cs-add-btn:hover { background: #E9E4D9; border-color: #111111; }

/* ── Email grid ───────────────────────────────────── */
.cs-email-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 600px) { .cs-email-grid { grid-template-columns: 1fr; } }
.cs-email-item { display: flex; flex-direction: column; gap: 5px; }
.cs-email-prefix {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
    color: #737373; margin-bottom: 3px;
}

/* ── Social link row ──────────────────────────────── */
.cs-social-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
.cs-social-select {
    width: 140px; flex-shrink: 0;
    padding: 10px 12px; border: 1.5px solid #E5E5E5; border-radius: 11px;
    font-size: .85rem; color: #1C1C1C; background: #fff; cursor: pointer;
}
.cs-social-select:focus { outline: none; border-color: #111111; }

/* ── Toggle switch ────────────────────────────────── */
.cs-toggle-wrap { display: flex; align-items: center; gap: 14px; }
.cs-toggle { position: relative; width: 46px; height: 26px; flex-shrink: 0; }
.cs-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.cs-toggle-slider {
    position: absolute; inset: 0; border-radius: 99px;
    background: #D4D4D4; cursor: pointer; transition: background .2s;
}
.cs-toggle-slider::before {
    content: ''; position: absolute;
    width: 20px; height: 20px; border-radius: 50%;
    background: #fff; top: 3px; left: 3px;
    box-shadow: 0 1px 4px rgba(0,0,0,.2); transition: transform .2s;
}
.cs-toggle input:checked + .cs-toggle-slider { background: #111111; }
.cs-toggle input:checked + .cs-toggle-slider::before { transform: translateX(20px); }
.cs-toggle-label { font-size: .88rem; font-weight: 600; color: #1C1C1C; }
.cs-toggle-sub   { font-size: .75rem; color: #A3A3A3; }

/* ── Shipping mode cards ──────────────────────────── */
.cs-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.cs-mode-opt input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
.cs-mode-opt { position: relative; }
.cs-mode-lbl {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px; border: 2px solid #E5E5E5;
    border-radius: 13px; cursor: pointer; transition: all .2s;
    background: #FAFBFE;
}
.cs-mode-lbl:hover { border-color: #111111; background: #F3F0E9; }
.cs-mode-opt input:checked + .cs-mode-lbl {
    border-color: #111111; background: #F3F0E9;
    box-shadow: 0 0 0 3px rgba(17,17,17,.12);
}
.cs-mode-ico {
    width: 40px; height: 40px; border-radius: 11px;
    background: rgba(17,17,17,.1); color: #111111;
    display: flex; align-items: center; justify-content: center; font-size: 1rem;
    flex-shrink: 0;
}
.cs-mode-title { font-size: .88rem; font-weight: 700; color: #1C1C1C; }
.cs-mode-desc  { font-size: .74rem; color: #A3A3A3; margin-top: 2px; }

/* ── Shipping rates grid ──────────────────────────── */
.cs-shipping-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.cs-shipping-cell { display: flex; flex-direction: column; gap: 5px; }
.cs-shipping-cell .cs-lbl { margin-bottom: 4px; }
.cs-inp-prefix-wrap { display: flex; border: 1.5px solid #E5E5E5; border-radius: 11px; overflow: hidden; }
.cs-inp-prefix {
    padding: 10px 12px; background: #F4F4F4;
    font-size: .75rem; font-weight: 700; color: #737373;
    border-right: 1px solid #E5E5E5; white-space: nowrap;
    display: flex; align-items: center;
}
.cs-inp-prefix-wrap .cs-inp { border: none; border-radius: 0; box-shadow: none; }
.cs-inp-prefix-wrap .cs-inp:focus { box-shadow: none; }
.cs-inp-prefix-wrap:focus-within { border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,.13); }

/* ── Secret field ─────────────────────────────────── */
.cs-secret-wrap { position: relative; }
.cs-secret-wrap .cs-inp { padding-right: 44px; font-family: monospace; }
.cs-secret-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: #A3A3A3; cursor: pointer; padding: 4px;
    font-size: .85rem;
}

/* ── 2-col layout ─────────────────────────────────── */
.cs-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 700px) { .cs-2col { grid-template-columns: 1fr; } }
.cs-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
@media (max-width: 800px) { .cs-3col { grid-template-columns: 1fr 1fr; } }
@media (max-width: 500px) { .cs-3col { grid-template-columns: 1fr; } }

/* ── Coupon type cards ────────────────────────────── */
.cs-coupon-grid { display: flex; gap: 10px; }
.cs-coupon-opt input[type="radio"] { position: absolute; opacity: 0; width: 0; height: 0; }
.cs-coupon-opt { position: relative; }
.cs-coupon-lbl {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border: 2px solid #E5E5E5;
    border-radius: 11px; cursor: pointer; transition: all .2s;
    background: #FAFBFE; font-size: .84rem; font-weight: 700; color: #374151;
}
.cs-coupon-lbl:hover { border-color: #111111; background: #F3F0E9; }
.cs-coupon-opt input:checked + .cs-coupon-lbl {
    border-color: #111111; background: #F3F0E9;
    box-shadow: 0 0 0 3px rgba(17,17,17,.12);
}

/* ── Sticky save bar ──────────────────────────────── */
.cs-save-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: rgba(15,23,42,.96); backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255,255,255,.08);
    padding: 14px 32px; display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
}
.cs-save-info { font-size: .78rem; color: rgba(255,255,255,.5); }
.cs-save-info strong { color: rgba(255,255,255,.85); }
.cs-save-actions { display: flex; gap: 10px; }
.cs-btn-save {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #2A2A2A, #111111); color: #fff;
    border: none; border-radius: 11px; padding: 11px 26px;
    font-size: .88rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 14px rgba(17,17,17,.4); transition: all .2s;
}
.cs-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(17,17,17,.5); }
.cs-btn-cancel {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.08); color: rgba(255,255,255,.8);
    border: 1.5px solid rgba(255,255,255,.15); border-radius: 11px;
    padding: 11px 20px; font-size: .88rem; font-weight: 600;
    cursor: pointer; text-decoration: none; transition: all .2s;
}
.cs-btn-cancel:hover { background: rgba(255,255,255,.14); color: #fff; }

/* ── Collapsible section ──────────────────────────── */
.cs-collapse-row {
    overflow: hidden; transition: max-height .35s ease;
}
</style>

<div class="content-wrapper">
<div class="cs-page">

    
    <div class="cs-hero">
        <div class="cs-hero-body">
            <div class="cs-hero-ico"><i class="fas fa-building"></i></div>
            <div>
                <h1 class="cs-hero-title">Company Settings</h1>
                <p class="cs-hero-sub">Manage your brand, contact info, shipping, and marketing integrations.</p>
            </div>
        </div>
    </div>

    
    ${(session('success')) ? html`    <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px;font-size:.85rem;color:#166534;">
        <i class="fas fa-circle-check" style="color:#16A34A;"></i> ${session('success')}
    </div>
    ` : ''}    ${(errors?.any()) ? html`    <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:.85rem;color:#991B1B;">
        <i class="fas fa-triangle-exclamation" style="color:#EF4444;margin-right:8px;"></i>
        Please fix the errors below before saving.
    </div>
    ` : ''}
    <form action="${route('admin.company-settings.update')}" method="POST" enctype="multipart/form-data" id="csForm">
        ${csrf_field()}
        
        <div class="cs-tabs" id="csTabs">
            <button type="button" class="cs-tab-btn active" data-tab="branding">
                <span class="tab-ico"><i class="fas fa-palette"></i></span> Branding
            </button>
            <button type="button" class="cs-tab-btn" data-tab="contact">
                <span class="tab-ico"><i class="fas fa-address-book"></i></span> Contact
            </button>
            <button type="button" class="cs-tab-btn" data-tab="shipping">
                <span class="tab-ico"><i class="fas fa-truck"></i></span> Shipping
            </button>
        </div>

        
        <div class="cs-tab-pane active" id="pane-branding">

            <div class="cs-card">
                <div class="cs-card-hd">
                    <div class="cs-card-hd-ico"><i class="fas fa-building"></i></div>
                    <div class="cs-card-hd-title">Company Identity</div>
                </div>
                <div class="cs-card-body">
                    <div class="cs-2col">
                        <div class="cs-field" style="grid-column: 1/-1;">
                            <label class="cs-lbl">Company Name <span class="req">*</span></label>
                            <input type="text" name="name" class="cs-inp ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html` is-invalid `; })() : ''}"
                                value="${old('name', setting?.name)}" placeholder="e.g. AGA Collections" required>
                            ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html`<div class="cs-err">${message}</div>`; })() : ''}                        </div>
                        <div class="cs-field" style="grid-column: 1/-1;">
                            <label class="cs-lbl">Description <span class="opt">optional</span></label>
                            <textarea name="description" class="cs-inp">${old('description', setting?.description)}</textarea>
                            <div class="cs-hint">Shown in the footer of your website.</div>
                        </div>
                        <div class="cs-field" style="grid-column: 1/-1;">
                            <label class="cs-lbl">Business Address <span class="opt">optional</span></label>
                            <textarea name="address" class="cs-inp" rows="2">${old('address', setting?.address)}</textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="cs-card">
                <div class="cs-card-hd">
                    <div class="cs-card-hd-ico"><i class="fas fa-image"></i></div>
                    <div class="cs-card-hd-title">Brand Assets</div>
                </div>
                <div class="cs-card-body">

                    
                    <div class="cs-field">
                        <label class="cs-lbl">Company Logo</label>
                        <div class="cs-upload-wrap">
                            <div class="cs-upload-preview" id="logoPreviewWrap" onclick="document.getElementById('logoFile').click()">
                                <img id="logoPreview"
                                    src="${setting?.logo ? asset('storage/' + (setting?.logo ?? '')) : asset('images/default-logo.png')}"
                                    alt="Logo">
                            </div>
                            <div>
                                <label class="cs-upload-trigger" for="logoFile">
                                    <i class="fas fa-upload"></i> Upload Logo
                                </label>
                                <input type="file" name="logo" id="logoFile" class="cs-file" accept="image/*"
                                    onchange="previewImg(this,'logoPreview')">
                                <div class="cs-hint" style="margin-top:8px;">PNG, JPG — max 2 MB. Shown in nav & emails.</div>
                                ${(errors.has('logo')) ? (() => { const message = errors.first('logo');  return html`<div class="cs-err">${message}</div>`; })() : ''}                            </div>
                        </div>
                    </div>

                    
                    <div class="cs-field">
                        <label class="cs-lbl">Favicon</label>
                        <div class="cs-upload-wrap">
                            <div class="cs-upload-preview favicon" onclick="document.getElementById('faviconFile').click()">
                                <img id="faviconPreview"
                                    src="${setting?.favicon ? asset('storage/' + (setting?.favicon ?? '')) : asset('images/default-favicon.png')}"
                                    alt="Favicon">
                            </div>
                            <div>
                                <label class="cs-upload-trigger" for="faviconFile">
                                    <i class="fas fa-upload"></i> Upload Favicon
                                </label>
                                <input type="file" name="favicon" id="faviconFile" class="cs-file" accept="image/*"
                                    onchange="previewImg(this,'faviconPreview')">
                                <div class="cs-hint" style="margin-top:8px;">ICO or PNG — ideally 32×32 px.</div>
                                ${(errors.has('favicon')) ? (() => { const message = errors.first('favicon');  return html`<div class="cs-err">${message}</div>`; })() : ''}                            </div>
                        </div>
                    </div>

                    
                    <div class="cs-field">
                        <label class="cs-lbl">Default Category Banner</label>
                        <div class="cs-upload-wrap">
                            <div class="cs-upload-preview banner" onclick="document.getElementById('bannerFile').click()">
                                <img id="bannerPreview"
                                    src="${setting?.default_category_banner ? asset('storage/' + (setting?.default_category_banner ?? '')) : 'https://placehold.co/280x140/f1f5f9/94a3b8?text=Banner'}"
                                    alt="Banner">
                            </div>
                            <div>
                                <label class="cs-upload-trigger" for="bannerFile">
                                    <i class="fas fa-upload"></i> Upload Banner
                                </label>
                                <input type="file" name="default_category_banner" id="bannerFile" class="cs-file" accept="image/*"
                                    onchange="previewImg(this,'bannerPreview')">
                                <div class="cs-hint" style="margin-top:8px;">Fallback banner for categories without a custom image. Max 5 MB.</div>
                            </div>
                        </div>
                    </div>

                    
                    <div class="cs-field">
                        <label class="cs-lbl">Size Chart Image <span style="font-weight:400;color:#A3A3A3;">(shown on every product detail page)</span></label>
                        <div class="cs-upload-wrap">
                            <div class="cs-upload-preview banner" onclick="document.getElementById('sizeChartFile').click()">
                                <img id="sizeChartPreview"
                                    src="${setting?.size_chart_image ? asset('storage/' + (setting?.size_chart_image ?? '')) : 'https://placehold.co/280x140/f1f5f9/94a3b8?text=Size+Chart'}"
                                    alt="Size Chart">
                            </div>
                            <div>
                                <label class="cs-upload-trigger" for="sizeChartFile">
                                    <i class="fas fa-ruler-combined"></i> Upload Size Chart
                                </label>
                                <input type="file" name="size_chart_image" id="sizeChartFile" class="cs-file" accept="image/*"
                                    onchange="previewImg(this,'sizeChartPreview')">
                                <div class="cs-hint" style="margin-top:8px;">A single image shown on all product detail pages. Recommended: clear table with size labels (S/M/L/XL) and measurements. Max 5 MB.</div>
                                ${(setting?.size_chart_image) ? html`                                <label style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:.78rem;color:#dc2626;cursor:pointer;">
                                    <input type="checkbox" name="remove_size_chart" value="1" style="margin:0;"> Remove current size chart
                                </label>
                                ` : ''}                                ${(errors.has('size_chart_image')) ? (() => { const message = errors.first('size_chart_image');  return html`<div class="cs-err">${message}</div>`; })() : ''}                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        
        <div class="cs-tab-pane" id="pane-contact">

            
            <div class="cs-card">
                <div class="cs-card-hd">
                    <div class="cs-card-hd-ico"><i class="fas fa-envelope"></i></div>
                    <div class="cs-card-hd-title">Email Addresses</div>
                </div>
                <div class="cs-card-body">
                                        <div class="cs-email-grid">
                        ${foreach(emailKeys, (ekey, loop) => html`                        <div class="cs-email-item">
                            <span class="cs-email-prefix">
                                ${(ekey === 'default') ? html` <i class="fas fa-circle-dot" style="color:#111111;"></i>
                                ` : (ekey === 'support') ? html` <i class="fas fa-headset" style="color:#8B5CF6;"></i>
                                ` : (ekey === 'sales') ? html` <i class="fas fa-tag" style="color:#16A34A;"></i>
                                ` : html` <i class="fas fa-message" style="color:#F59E0B;"></i>
                                `}                                ${ucfirst(ekey)}
                            </span>
                            <input type="email" name="emails[${ekey}]"
                                class="cs-inp"
                                value="${old('emails.' + (ekey ?? ''), savedEmails?.[ekey] ?? '')}"
                                placeholder="${ekey}@yourstore.com">
                        </div>
                        `)}                    </div>
                </div>
            </div>

            
            <div class="cs-card">
                <div class="cs-card-hd">
                    <div class="cs-card-hd-ico"><i class="fas fa-phone"></i></div>
                    <div class="cs-card-hd-title">Phone Numbers</div>
                </div>
                <div class="cs-card-body">
                    <div id="phoneList">
                        ${count(old('phones', setting?.phones ?? [])) ? foreach(old('phones', setting?.phones ?? []), (phone, loop) => html`                        <div class="cs-dyn-item">
                            <input type="text" name="phones[]" class="cs-inp" value="${phone}" placeholder="+92 300 0000000">
                            <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                        `) : html`                        <div class="cs-dyn-item">
                            <input type="text" name="phones[]" class="cs-inp" placeholder="+92 300 0000000">
                            <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                        `}                    </div>
                    <button type="button" class="cs-add-btn" onclick="addPhone()">
                        <i class="fas fa-plus"></i> Add Phone
                    </button>
                </div>
            </div>

            
            <div class="cs-card">
                <div class="cs-card-hd">
                    <div class="cs-card-hd-ico" style="background:rgba(37,211,102,.1);color:#25D366;"><i class="fab fa-whatsapp"></i></div>
                    <div class="cs-card-hd-title">WhatsApp Numbers</div>
                </div>
                <div class="cs-card-body">
                    <div id="whatsappList">
                        ${count(old('whatsapps', setting?.whatsapps ?? [])) ? foreach(old('whatsapps', setting?.whatsapps ?? []), (wa, loop) => html`                        <div class="cs-dyn-item">
                            <input type="text" name="whatsapps[]" class="cs-inp" value="${wa}" placeholder="+92 300 0000000">
                            <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                        `) : html`                        <div class="cs-dyn-item">
                            <input type="text" name="whatsapps[]" class="cs-inp" placeholder="+92 300 0000000">
                            <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                        `}                    </div>
                    <button type="button" class="cs-add-btn" onclick="addWhatsapp()">
                        <i class="fas fa-plus"></i> Add WhatsApp
                    </button>
                </div>
            </div>

            
            <div class="cs-card">
                <div class="cs-card-hd">
                    <div class="cs-card-hd-ico" style="background:rgba(99,102,241,.1);color:#6366F1;"><i class="fas fa-share-nodes"></i></div>
                    <div class="cs-card-hd-title">Social Media Links</div>
                </div>
                <div class="cs-card-body">
                    <div id="socialList">
                                                ${count(socialLinks) ? foreach(entries(socialLinks), ([idx, link], loop) => html`                        <div class="cs-social-row">
                            <select name="social_links[${idx}][platform]" class="cs-social-select">
                                ${foreach(['facebook','instagram','twitter','tiktok','youtube','pinterest','linkedin','snapchat'], (pl, loop) => html`                                <option value="${pl}" ${(link?.['platform'] ?? '') === pl ? 'selected' : ''}>${ucfirst(pl)}</option>
                                `)}                            </select>
                            <input type="url" name="social_links[${idx}][url]" class="cs-inp"
                                value="${link?.['url'] ?? ''}" placeholder="https://...">
                            <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                        `) : html`                        <div class="cs-social-row">
                            <select name="social_links[0][platform]" class="cs-social-select">
                                ${foreach(['facebook','instagram','twitter','tiktok','youtube','pinterest','linkedin','snapchat'], (pl, loop) => html`                                <option value="${pl}">${ucfirst(pl)}</option>
                                `)}                            </select>
                            <input type="url" name="social_links[0][url]" class="cs-inp" placeholder="https://...">
                            <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                        `}                    </div>
                    <button type="button" class="cs-add-btn" onclick="addSocial()">
                        <i class="fas fa-plus"></i> Add Social Link
                    </button>
                </div>
            </div>

        </div>

        
        <div class="cs-tab-pane" id="pane-shipping">

            <div class="cs-card">
                <div class="cs-card-hd">
                    <div class="cs-card-hd-ico"><i class="fas fa-truck"></i></div>
                    <div class="cs-card-hd-title">Pakistan Shipping</div>
                </div>
                <div class="cs-card-body">

                    
                    <div class="cs-field">
                        <label class="cs-lbl">Rate Mode</label>
                        <div class="cs-mode-grid">
                            <div class="cs-mode-opt">
                                <input type="radio" name="shipping_mode" id="mode_flat" value="flat"
                                    ${old('shipping_mode', setting?.shipping_mode ?? 'flat') === 'flat' ? 'checked' : ''}
                                    onchange="toggleByRegion(false)">
                                <label for="mode_flat" class="cs-mode-lbl">
                                    <div class="cs-mode-ico"><i class="fas fa-tag"></i></div>
                                    <div>
                                        <div class="cs-mode-title">Flat Rate</div>
                                        <div class="cs-mode-desc">One price for all of Pakistan</div>
                                    </div>
                                </label>
                            </div>
                            <div class="cs-mode-opt">
                                <input type="radio" name="shipping_mode" id="mode_by_region" value="by_region"
                                    ${old('shipping_mode', setting?.shipping_mode ?? 'flat') === 'by_region' ? 'checked' : ''}
                                    onchange="toggleByRegion(true)">
                                <label for="mode_by_region" class="cs-mode-lbl">
                                    <div class="cs-mode-ico"><i class="fas fa-map-location-dot"></i></div>
                                    <div>
                                        <div class="cs-mode-title">By Region</div>
                                        <div class="cs-mode-desc">Different rates per city / zone</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    
                    <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:13px;padding:16px 20px;margin-bottom:20px;">
                        <div class="cs-toggle-wrap" style="margin-bottom:12px;">
                            <label class="cs-toggle">
                                <input type="checkbox" name="free_shipping_enabled" id="freeShippingToggle" value="1"
                                    ${old('free_shipping_enabled', setting?.free_shipping_enabled ?? false) ? 'checked' : ''}>
                                <span class="cs-toggle-slider"></span>
                            </label>
                            <div>
                                <div class="cs-toggle-label">Free Shipping</div>
                                <div class="cs-toggle-sub">Waive shipping charges on orders above a threshold</div>
                            </div>
                        </div>
                        <div class="cs-field" style="margin-bottom:0;">
                            <label class="cs-lbl">Free Shipping Threshold (PKR)</label>
                            <div class="cs-inp-prefix-wrap" style="max-width:260px;">
                                <span class="cs-inp-prefix">PKR</span>
                                <input type="number" name="free_shipping_threshold" class="cs-inp" step="1" min="0"
                                    value="${old('free_shipping_threshold', setting?.free_shipping_threshold ?? 0)}"
                                    placeholder="e.g. 5000">
                            </div>
                        </div>
                    </div>

                    
                                        <div id="flatRates">
                        <div class="cs-lbl" style="margin-bottom:12px;">Nationwide Rate (PKR)</div>
                        <div class="cs-shipping-cell" style="max-width:260px;">
                            <div class="cs-inp-prefix-wrap">
                                <span class="cs-inp-prefix">PKR</span>
                                <input type="number" name="shipping_charges[rest_of_pakistan]" class="cs-inp"
                                    step="1" min="0" placeholder="e.g. 250"
                                    value="${old('shipping_charges.rest_of_pakistan', saved_shipping?.['rest_of_pakistan'] ?? '')}">
                            </div>
                        </div>
                    </div>

                    
                    <div id="regionRates" style="${old('shipping_mode', setting?.shipping_mode ?? 'flat') === 'by_region' ? '' : 'display:none;'}">
                        <div class="cs-lbl" style="margin-bottom:12px;">Rates by Zone (PKR)</div>
                        <div class="cs-shipping-grid">
                                                        ${foreach(entries(pkZones), ([code, [label, ico]], loop) => html`                            <div class="cs-shipping-cell">
                                <label class="cs-lbl">
                                    <i class="${ico}" style="margin-right:4px;color:#737373;"></i> ${label}
                                </label>
                                <div class="cs-inp-prefix-wrap">
                                    <span class="cs-inp-prefix">PKR</span>
                                    <input type="number" name="shipping_charges[${code}]" class="cs-inp"
                                        step="1" min="0" placeholder="0"
                                        value="${old('shipping_charges.' + (code ?? ''), saved_shipping?.[code] ?? '')}">
                                </div>
                            </div>
                            `)}                        </div>
                    </div>

                </div>
            </div>
        </div>


    </form>

</div>
</div>


<div class="cs-save-bar">
    <div class="cs-save-info">
        <strong>${setting?.name}</strong> · Last saved ${setting?.updated_at?.diffForHumans()}
    </div>
    <div class="cs-save-actions">
        <a href="${route('admin.company-settings.index')}" class="cs-btn-cancel">
            <i class="fas fa-arrow-left"></i> Back
        </a>
        <button type="submit" form="csForm" class="cs-btn-save" id="saveBtn">
            <i class="fas fa-floppy-disk"></i> Save Changes
        </button>
    </div>
</div>


`,
    scripts: html`<script>
// ── Tab switching ────────────────────────────────────────────
(function () {
    const tabs  = document.querySelectorAll('.cs-tab-btn');
    const panes = document.querySelectorAll('.cs-tab-pane');

    function activate(name) {
        tabs.forEach(t  => t.classList.toggle('active', t.dataset.tab === name));
        panes.forEach(p => p.classList.toggle('active', p.id === 'pane-' + name));
        history.replaceState(null, '', location.pathname + '?tab=' + name);
    }

    tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));

    // Restore tab from URL or validation error
    const urlTab = new URLSearchParams(location.search).get('tab');
    ${(errors?.any()) ? html`        // Auto-focus the tab that has errors
        const errorFields = ${raw(json_encode(errors?.keys()))};
        const tabMap = {
            branding: ['name','description','address','logo','favicon'],
            contact:  ['emails','phones','whatsapps','social_links'],
            shipping: ['shipping_mode','shipping_charges','free_shipping_enabled','free_shipping_threshold'],
        };
        let autoTab = null;
        for (const [tab, fields] of Object.entries(tabMap)) {
            if (errorFields.some(f => fields.some(t => f.startsWith(t)))) { autoTab = tab; break; }
        }
        if (autoTab) activate(autoTab);
        else if (urlTab) activate(urlTab);
    ` : html`        if (urlTab) activate(urlTab);
    `}})();

// ── Image preview ────────────────────────────────────────────
function previewImg(input, previewId) {
    const file = input.files[0];
    if (file) document.getElementById(previewId).src = URL.createObjectURL(file);
}

// ── Remove dynamic item ──────────────────────────────────────
function rmItem(btn) {
    const row = btn.closest('.cs-dyn-item') || btn.closest('.cs-social-row');
    if (row) row.remove();
}

// ── Add phone ────────────────────────────────────────────────
function addPhone() {
    const list = document.getElementById('phoneList');
    const div  = document.createElement('div');
    div.className = 'cs-dyn-item';
    div.innerHTML = \`<input type="text" name="phones[]" class="cs-inp" placeholder="+92 300 0000000">
        <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>\`;
    list.appendChild(div);
}

// ── Add WhatsApp ─────────────────────────────────────────────
function addWhatsapp() {
    const list = document.getElementById('whatsappList');
    const div  = document.createElement('div');
    div.className = 'cs-dyn-item';
    div.innerHTML = \`<input type="text" name="whatsapps[]" class="cs-inp" placeholder="+92 300 0000000">
        <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>\`;
    list.appendChild(div);
}

// ── Add social link ──────────────────────────────────────────
let _socialIdx = ${count(setting?.social_links ?? [])};
function addSocial() {
    const list = document.getElementById('socialList');
    const platforms = ['facebook','instagram','twitter','tiktok','youtube','pinterest','linkedin','snapchat'];
    const opts = platforms.map(p => \`<option value="\${p}">\${p.charAt(0).toUpperCase()+p.slice(1)}</option>\`).join('');
    const div = document.createElement('div');
    div.className = 'cs-social-row';
    div.innerHTML = \`<select name="social_links[\${_socialIdx}][platform]" class="cs-social-select">\${opts}</select>
        <input type="url" name="social_links[\${_socialIdx}][url]" class="cs-inp" placeholder="https://...">
        <button type="button" class="cs-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>\`;
    list.appendChild(div);
    _socialIdx++;
}

// ── Pakistan region toggle ───────────────────────────────────
function toggleByRegion(show) {
    const regionDiv = document.getElementById('regionRates');
    const flatDiv   = document.getElementById('flatRates');

    regionDiv.style.display = show ? '' : 'none';
    flatDiv.style.display   = show ? 'none' : '';

    // Disable inputs in the hidden section so they are not submitted
    regionDiv.querySelectorAll('input').forEach(i => i.disabled = !show);
    flatDiv.querySelectorAll('input').forEach(i => i.disabled = show);
}
// init on load
(function() {
    const mode = document.querySelector('input[name="shipping_mode"]:checked');
    if (mode) toggleByRegion(mode.value === 'by_region');
})();

// ── Secret token reveal ──────────────────────────────────────
function toggleSecret(id, btn) {
    const inp = document.getElementById(id);
    const ico = btn.querySelector('i');
    if (inp.type === 'password') {
        inp.type = 'text'; ico.className = 'fas fa-eye-slash';
    } else {
        inp.type = 'password'; ico.className = 'fas fa-eye';
    }
}

// ── Save spinner ─────────────────────────────────────────────
document.getElementById('csForm').addEventListener('submit', function() {
    const btn = document.getElementById('saveBtn');
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving…';
    btn.disabled = true;
});
</script>
`,
  };
}
