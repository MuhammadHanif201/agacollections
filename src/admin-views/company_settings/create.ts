// Port of resources/views/adminside/company_settings/create.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, old, csrf_field, ucfirst, max, min, e, optional, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let {  } = d;

  return {
    title: html`<title>Setup Company Settings — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Initial store setup — company name, logo, contact details and social links for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="setup company, store setup, initial configuration, branding, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
.csc-page { padding: 32px 32px 100px; max-width: 860px; margin: 0 auto; }

/* Hero */
.csc-hero {
    background: linear-gradient(135deg, #111111 0%, #1E3A5F 60%, #2A2A2A 100%);
    border-radius: 22px; padding: 28px 32px;
    position: relative; overflow: hidden; margin-bottom: 28px;
}
.csc-hero::before {
    content: ''; position: absolute; inset: 0; opacity: .07;
    background-image: radial-gradient(circle at 1px 1px, #fff 1px, transparent 0);
    background-size: 28px 28px;
}
.csc-hero-body { position: relative; z-index: 1; display: flex; align-items: center; gap: 18px; }
.csc-hero-ico {
    width: 52px; height: 52px; border-radius: 15px; flex-shrink: 0;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18);
    backdrop-filter: blur(8px); display: flex; align-items: center;
    justify-content: center; font-size: 1.25rem; color: #fff;
}
.csc-hero-title { font-size: 1.35rem; font-weight: 800; color: #fff; margin: 0; }
.csc-hero-sub   { font-size: .8rem; color: rgba(255,255,255,.55); margin: 3px 0 0; }

/* Card */
.csc-card {
    background: #fff; border: 1px solid #E8EDF5;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 2px 14px rgba(15,23,42,.06); margin-bottom: 20px;
}
.csc-card-hd {
    padding: 15px 22px; border-bottom: 1px solid #F4F4F4;
    display: flex; align-items: center; gap: 10px; background: #FAFBFE;
}
.csc-card-hd-ico {
    width: 32px; height: 32px; border-radius: 9px;
    background: rgba(17,17,17,.1); color: #111111;
    display: flex; align-items: center; justify-content: center; font-size: .8rem;
}
.csc-card-hd-title { font-size: .76rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .1em; }
.csc-card-body { padding: 22px; }

/* Fields */
.csc-field { margin-bottom: 18px; }
.csc-lbl {
    display: block; font-size: .74rem; font-weight: 700;
    color: #374151; margin-bottom: 7px; letter-spacing: .02em;
}
.csc-lbl .req { color: #EF4444; margin-left: 2px; }
.csc-lbl .opt { color: #9CA3AF; font-weight: 400; font-size: .7rem; }
.csc-inp {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid #E5E5E5; border-radius: 11px;
    font-size: .88rem; color: #1C1C1C; background: #fff;
    transition: border-color .2s, box-shadow .2s;
}
.csc-inp:focus { outline: none; border-color: #111111; box-shadow: 0 0 0 3px rgba(17,17,17,.13); }
.csc-inp.is-invalid { border-color: #EF4444; }
textarea.csc-inp { resize: vertical; min-height: 80px; }
.csc-err  { font-size: .73rem; color: #EF4444; margin-top: 5px; font-weight: 500; }
.csc-hint { font-size: .71rem; color: #A3A3A3; margin-top: 5px; }

/* 2-col */
.csc-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 600px) { .csc-2col { grid-template-columns: 1fr; } }

/* Upload */
.csc-upload-wrap { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.csc-upload-preview {
    width: 76px; height: 76px; border-radius: 12px;
    border: 2px dashed #D4D4D4; background: #FAFAFA;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; flex-shrink: 0; cursor: pointer;
}
.csc-upload-preview img { width: 100%; height: 100%; object-fit: contain; }
.csc-upload-trigger {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 14px; border: 1.5px dashed #D4D4D4; border-radius: 10px;
    font-size: .78rem; font-weight: 600; color: #525252; cursor: pointer;
    background: #FAFAFA; transition: all .2s;
}
.csc-upload-trigger:hover { border-color: #111111; color: #111111; background: #F3F0E9; }
input[type="file"].csc-file { display: none; }

/* Dynamic items */
.csc-dyn-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.csc-dyn-item .csc-inp { flex: 1; margin-bottom: 0; }
.csc-dyn-rm {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1.5px solid #FCA5A5; background: #FEF2F2;
    color: #EF4444; font-size: .78rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all .15s;
}
.csc-dyn-rm:hover { background: #EF4444; color: #fff; }
.csc-add-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 8px;
    border: 1.5px dashed #FFE6DC; background: #F3F0E9;
    color: #111111; font-size: .77rem; font-weight: 700; cursor: pointer;
    transition: all .2s;
}
.csc-add-btn:hover { background: #E9E4D9; border-color: #111111; }

/* Email grid */
.csc-email-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 560px) { .csc-email-grid { grid-template-columns: 1fr; } }
.csc-email-prefix {
    font-size: .7rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .08em; color: #737373; margin-bottom: 4px;
    display: flex; align-items: center; gap: 5px;
}

/* Social row */
.csc-social-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
.csc-social-select {
    width: 130px; flex-shrink: 0;
    padding: 9px 11px; border: 1.5px solid #E5E5E5; border-radius: 10px;
    font-size: .84rem; color: #1C1C1C; background: #fff; cursor: pointer;
}
.csc-social-select:focus { outline: none; border-color: #111111; }

/* Actions */
.csc-actions {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
}
.csc-btn-save {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #2A2A2A, #111111); color: #fff;
    border: none; border-radius: 12px; padding: 13px 28px;
    font-size: .9rem; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 14px rgba(17,17,17,.35); transition: all .2s;
}
.csc-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(17,17,17,.45); }
</style>

<div class="content-wrapper">
<div class="csc-page">

    
    <div class="csc-hero">
        <div class="csc-hero-body">
            <div class="csc-hero-ico"><i class="fas fa-wand-magic-sparkles"></i></div>
            <div>
                <h1 class="csc-hero-title">First-Time Setup</h1>
                <p class="csc-hero-sub">Configure your company profile to get the store ready.</p>
            </div>
        </div>
    </div>

    ${(errors?.any()) ? html`    <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:14px 18px;margin-bottom:20px;font-size:.84rem;color:#991B1B;">
        <i class="fas fa-triangle-exclamation" style="color:#EF4444;margin-right:8px;"></i>
        Please fix the errors below.
    </div>
    ` : ''}
    <form action="${route('admin.company-settings.store')}" method="POST" enctype="multipart/form-data">
        ${csrf_field()}
        
        <div class="csc-card">
            <div class="csc-card-hd">
                <div class="csc-card-hd-ico"><i class="fas fa-building"></i></div>
                <div class="csc-card-hd-title">Company Identity</div>
            </div>
            <div class="csc-card-body">
                <div class="csc-field">
                    <label class="csc-lbl">Company Name <span class="req">*</span></label>
                    <input type="text" name="name" class="csc-inp ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html` is-invalid `; })() : ''}"
                        value="${old('name')}" placeholder="e.g. AGA Collections" required>
                    ${(errors.has('name')) ? (() => { const message = errors.first('name');  return html`<div class="csc-err">${message}</div>`; })() : ''}                </div>
                <div class="csc-field">
                    <label class="csc-lbl">Description <span class="opt">optional</span></label>
                    <textarea name="description" class="csc-inp" placeholder="A short description shown in the footer…">${old('description')}</textarea>
                </div>
                <div class="csc-field">
                    <label class="csc-lbl">Business Address <span class="opt">optional</span></label>
                    <textarea name="address" class="csc-inp" rows="2" placeholder="e.g. Main Blvd, DHA, Lahore">${old('address')}</textarea>
                </div>

                
                <div class="csc-field">
                    <label class="csc-lbl">Logo</label>
                    <div class="csc-upload-wrap">
                        <div class="csc-upload-preview" onclick="document.getElementById('logoFile').click()">
                            <img id="logoPreview" src="https://placehold.co/76x76/f1f5f9/94a3b8?text=Logo" alt="Logo">
                        </div>
                        <div>
                            <label class="csc-upload-trigger" for="logoFile"><i class="fas fa-upload"></i> Upload Logo</label>
                            <input type="file" name="logo" id="logoFile" class="csc-file" accept="image/*"
                                onchange="previewImg(this,'logoPreview')">
                            <div class="csc-hint" style="margin-top:6px;">PNG or JPG — max 2 MB.</div>
                            ${(errors.has('logo')) ? (() => { const message = errors.first('logo');  return html`<div class="csc-err">${message}</div>`; })() : ''}                        </div>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="csc-card">
            <div class="csc-card-hd">
                <div class="csc-card-hd-ico"><i class="fas fa-address-book"></i></div>
                <div class="csc-card-hd-title">Contact Information</div>
            </div>
            <div class="csc-card-body">

                
                <div class="csc-field">
                    <label class="csc-lbl">Email Addresses</label>
                    <div class="csc-email-grid">
                        ${foreach(['default','support','sales','contact'], (ekey, loop) => html`                        <div>
                            <div class="csc-email-prefix">${ucfirst(ekey)}</div>
                            <input type="email" name="emails[${ekey}]" class="csc-inp"
                                value="${old('emails.' + (ekey ?? ''))}" placeholder="${ekey}@yourstore.com">
                        </div>
                        `)}                    </div>
                </div>

                
                <div class="csc-field">
                    <label class="csc-lbl">Phone Numbers</label>
                    <div id="phoneList">
                        <div class="csc-dyn-item">
                            <input type="text" name="phones[]" class="csc-inp" placeholder="+92 300 0000000">
                            <button type="button" class="csc-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <button type="button" class="csc-add-btn" onclick="addPhone()"><i class="fas fa-plus"></i> Add Phone</button>
                </div>

                
                <div class="csc-field">
                    <label class="csc-lbl">WhatsApp Numbers</label>
                    <div id="whatsappList">
                        <div class="csc-dyn-item">
                            <input type="text" name="whatsapps[]" class="csc-inp" placeholder="+92 300 0000000">
                            <button type="button" class="csc-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <button type="button" class="csc-add-btn" onclick="addWhatsapp()"><i class="fas fa-plus"></i> Add WhatsApp</button>
                </div>

                
                <div class="csc-field">
                    <label class="csc-lbl">Social Media Links <span class="opt">optional</span></label>
                    <div id="socialList">
                        <div class="csc-social-row">
                            <select name="social_links[0][platform]" class="csc-social-select">
                                ${foreach(['facebook','instagram','twitter','tiktok','youtube','pinterest','linkedin','snapchat'], (pl, loop) => html`                                <option value="${pl}">${ucfirst(pl)}</option>
                                `)}                            </select>
                            <input type="url" name="social_links[0][url]" class="csc-inp" placeholder="https://...">
                            <button type="button" class="csc-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <button type="button" class="csc-add-btn" onclick="addSocial()"><i class="fas fa-plus"></i> Add Social Link</button>
                </div>

            </div>
        </div>

        
        <div class="csc-actions">
            <div style="font-size:.8rem;color:#A3A3A3;">You can configure shipping and marketing after creating.</div>
            <button type="submit" class="csc-btn-save" id="cscSaveBtn">
                <i class="fas fa-rocket"></i> Create Settings
            </button>
        </div>

    </form>

</div>
</div>


`,
    scripts: html`<script>
function previewImg(input, id) {
    const file = input.files[0];
    if (file) document.getElementById(id).src = URL.createObjectURL(file);
}
function rmItem(btn) {
    const row = btn.closest('.csc-dyn-item') || btn.closest('.csc-social-row');
    if (row) row.remove();
}
function addPhone() {
    const l = document.getElementById('phoneList');
    const d = document.createElement('div'); d.className = 'csc-dyn-item';
    d.innerHTML = \`<input type="text" name="phones[]" class="csc-inp" placeholder="+92 300 0000000">
        <button type="button" class="csc-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>\`;
    l.appendChild(d);
}
function addWhatsapp() {
    const l = document.getElementById('whatsappList');
    const d = document.createElement('div'); d.className = 'csc-dyn-item';
    d.innerHTML = \`<input type="text" name="whatsapps[]" class="csc-inp" placeholder="+92 300 0000000">
        <button type="button" class="csc-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>\`;
    l.appendChild(d);
}
let _si = 1;
function addSocial() {
    const l = document.getElementById('socialList');
    const platforms = ['facebook','instagram','twitter','tiktok','youtube','pinterest','linkedin','snapchat'];
    const opts = platforms.map(p => \`<option value="\${p}">\${p.charAt(0).toUpperCase()+p.slice(1)}</option>\`).join('');
    const d = document.createElement('div'); d.className = 'csc-social-row';
    d.innerHTML = \`<select name="social_links[\${_si}][platform]" class="csc-social-select">\${opts}</select>
        <input type="url" name="social_links[\${_si}][url]" class="csc-inp" placeholder="https://...">
        <button type="button" class="csc-dyn-rm" onclick="rmItem(this)"><i class="fas fa-trash"></i></button>\`;
    l.appendChild(d); _si++;
}
document.querySelector('form').addEventListener('submit', function() {
    const btn = document.getElementById('cscSaveBtn');
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving…';
    btn.disabled = true;
});
</script>
`,
  };
}
