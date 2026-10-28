// Port of resources/views/adminside/headlines/create.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, old, csrf_field, max, min, e, optional, blank } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let {  } = d;

  return {
    title: html`<title>Add Headline — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Create a new marquee headline with message, link and styling to announce updates on ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="add headline, new announcement, promo banner, marquee message, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
.hlc-page { padding: 32px 32px 80px; max-width: 780px; margin: 0 auto; }

.hlc-hero {
    background: linear-gradient(135deg, #111111 0%, #1E3A5F 60%, #2A2A2A 100%);
    border-radius: 22px; padding: 26px 30px;
    position: relative; overflow: hidden; margin-bottom: 26px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.hlc-hero::before {
    content:''; position:absolute; inset:0; opacity:.07;
    background-image:radial-gradient(circle at 1px 1px,#fff 1px,transparent 0);
    background-size:28px 28px;
}
.hlc-hero-body { position:relative; z-index:1; display:flex; align-items:center; gap:16px; }
.hlc-hero-ico {
    width:48px; height:48px; border-radius:14px; flex-shrink:0;
    background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
    backdrop-filter:blur(8px); display:flex; align-items:center;
    justify-content:center; font-size:1.2rem; color:#fff;
}
.hlc-hero-title { font-size:1.3rem; font-weight:800; color:#fff; margin:0; }
.hlc-hero-sub   { font-size:.78rem; color:rgba(255,255,255,.55); margin:2px 0 0; }
.hlc-back-btn {
    position:relative; z-index:1;
    display:inline-flex; align-items:center; gap:7px;
    background:rgba(255,255,255,.12); border:1.5px solid rgba(255,255,255,.22);
    color:#fff !important; border-radius:11px; padding:9px 18px;
    font-size:.82rem; font-weight:700; text-decoration:none !important; transition:all .2s;
}
.hlc-back-btn:hover { background:rgba(255,255,255,.22); }

.hlc-card {
    background:#fff; border:1px solid #E8EDF5; border-radius:18px;
    overflow:hidden; box-shadow:0 2px 14px rgba(15,23,42,.06); margin-bottom:18px;
}
.hlc-card-hd {
    padding:15px 22px; border-bottom:1px solid #F4F4F4;
    display:flex; align-items:center; gap:10px; background:#FAFBFE;
}
.hlc-card-hd-ico {
    width:32px; height:32px; border-radius:9px;
    background:rgba(17,17,17,.1); color:#111111;
    display:flex; align-items:center; justify-content:center; font-size:.8rem;
}
.hlc-card-hd-title { font-size:.76rem; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:.1em; }
.hlc-card-body { padding:22px; }

.hlc-field { margin-bottom:18px; }
.hlc-lbl { display:block; font-size:.74rem; font-weight:700; color:#374151; margin-bottom:7px; letter-spacing:.02em; }
.hlc-lbl .req { color:#EF4444; margin-left:2px; }
.hlc-lbl .opt { color:#9CA3AF; font-weight:400; font-size:.7rem; }
.hlc-inp {
    width:100%; padding:10px 14px; border:1.5px solid #E5E5E5; border-radius:11px;
    font-size:.88rem; color:#1C1C1C; background:#fff;
    transition:border-color .2s, box-shadow .2s;
}
.hlc-inp:focus { outline:none; border-color:#111111; box-shadow:0 0 0 3px rgba(17,17,17,.13); }
.hlc-inp.is-invalid { border-color:#EF4444; }
.hlc-err  { font-size:.72rem; color:#EF4444; margin-top:5px; font-weight:500; }
.hlc-hint { font-size:.71rem; color:#A3A3A3; margin-top:5px; }

.hlc-2col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.hlc-3col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
@media(max-width:560px){
    .hlc-2col, .hlc-3col { grid-template-columns:1fr; }
}

/* Color swatch row */
.hlc-color-row { display:flex; align-items:center; gap:10px; }
.hlc-color-row .hlc-inp[type="color"] {
    width:52px; height:42px; padding:4px; border-radius:9px; cursor:pointer; flex-shrink:0;
}
.hlc-color-hex {
    flex:1; padding:10px 14px; border:1.5px solid #E5E5E5; border-radius:11px;
    font-size:.86rem; color:#1C1C1C; font-family:monospace;
}
.hlc-color-hex:focus { outline:none; border-color:#111111; box-shadow:0 0 0 3px rgba(17,17,17,.13); }

/* Live preview */
.hlc-preview-wrap { border-radius:12px; overflow:hidden; border:1.5px solid #E5E5E5; }
.hlc-preview-bar {
    padding:13px 20px; font-weight:700; font-size:.9rem;
    display:flex; align-items:center; gap:10px; min-height:50px;
    transition:background .2s,color .2s;
}
.hlc-preview-label {
    font-size:.72rem; font-weight:700; color:#A3A3A3;
    text-transform:uppercase; letter-spacing:.08em;
    padding:8px 20px; background:#FAFAFA; border-top:1px solid #F4F4F4;
}

/* Submit */
.hlc-submit {
    display:inline-flex; align-items:center; gap:8px;
    padding:11px 28px; border-radius:12px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#2A2A2A,#111111);
    color:#fff; font-size:.88rem; font-weight:700;
    box-shadow:0 4px 14px rgba(17,17,17,.3);
    transition:opacity .2s,transform .1s;
}
.hlc-submit:hover { opacity:.9; }
.hlc-submit:active { transform:scale(.98); }
.hlc-submit:disabled { opacity:.65; cursor:not-allowed; }
</style>

<div class="content-wrapper">
<div class="hlc-page">

    
    <div class="hlc-hero">
        <div class="hlc-hero-body">
            <div class="hlc-hero-ico"><i class="fas fa-bullhorn"></i></div>
            <div>
                <h1 class="hlc-hero-title">Add Headline</h1>
                <p class="hlc-hero-sub">Create a new scrolling announcement banner.</p>
            </div>
        </div>
        <a href="${route('admin.headlines.index')}" class="hlc-back-btn">
            <i class="fas fa-arrow-left"></i> Back
        </a>
    </div>

    <form id="hlc-form" action="${route('admin.headlines.store')}" method="POST">
        ${csrf_field()}
        
        <div class="hlc-card">
            <div class="hlc-card-hd">
                <div class="hlc-card-hd-ico"><i class="fas fa-align-left"></i></div>
                <div class="hlc-card-hd-title">Headline Content</div>
            </div>
            <div class="hlc-card-body">
                <div class="hlc-field">
                    <label class="hlc-lbl" for="message_en">Headline Text <span class="req">*</span></label>
                    <textarea name="message_en" id="message_en" rows="2" maxlength="200"
                              class="hlc-inp${errors?.has('message_en') ? ' is-invalid' : ''}"
                              placeholder="e.g. Free shipping on all orders over $50" required>${old('message_en')}</textarea>
                    ${(errors.has('message_en')) ? (() => { const message = errors.first('message_en');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    <div class="hlc-hint">Max 200 characters. This text will scroll across the storefront ticker.</div>
                </div>

                <div class="hlc-field">
                    <label class="hlc-lbl" for="link_url">Link URL <span class="opt">(optional)</span></label>
                    <input type="url" name="link_url" id="link_url"
                           class="hlc-inp${errors?.has('link_url') ? ' is-invalid' : ''}"
                           placeholder="https://example.com/sale"
                           value="${old('link_url')}">
                    ${(errors.has('link_url')) ? (() => { const message = errors.first('link_url');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    <div class="hlc-hint">Clicking the headline will navigate to this URL.</div>
                </div>
            </div>
        </div>

        
        <div class="hlc-card">
            <div class="hlc-card-hd">
                <div class="hlc-card-hd-ico"><i class="fas fa-palette"></i></div>
                <div class="hlc-card-hd-title">Appearance</div>
            </div>
            <div class="hlc-card-body">
                <div class="hlc-2col">
                    <div class="hlc-field">
                        <label class="hlc-lbl" for="bg_color">Background Color</label>
                        <div class="hlc-color-row">
                            <input type="color" name="bg_color" id="bg_color"
                                   class="hlc-inp" value="${old('bg_color', '#111111')}">
                            <input type="text" id="bg_color_hex" class="hlc-color-hex"
                                   value="${old('bg_color', '#111111')}" maxlength="7" placeholder="#111111">
                        </div>
                        ${(errors.has('bg_color')) ? (() => { const message = errors.first('bg_color');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    </div>
                    <div class="hlc-field">
                        <label class="hlc-lbl" for="text_color">Text Color</label>
                        <div class="hlc-color-row">
                            <input type="color" name="text_color" id="text_color"
                                   class="hlc-inp" value="${old('text_color', '#ffffff')}">
                            <input type="text" id="text_color_hex" class="hlc-color-hex"
                                   value="${old('text_color', '#ffffff')}" maxlength="7" placeholder="#ffffff">
                        </div>
                        ${(errors.has('text_color')) ? (() => { const message = errors.first('text_color');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    </div>
                </div>

                
                <div class="hlc-field" style="margin-bottom:0;">
                    <label class="hlc-lbl">Live Preview</label>
                    <div class="hlc-preview-wrap">
                        <div id="hlcPreview" class="hlc-preview-bar">
                            <i class="fas fa-bullhorn" style="opacity:.6;flex-shrink:0;"></i>
                            <span id="hlcPreviewText">Your headline…</span>
                        </div>
                        <div class="hlc-preview-label">Storefront ticker preview</div>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="hlc-card">
            <div class="hlc-card-hd">
                <div class="hlc-card-hd-ico"><i class="fas fa-sliders"></i></div>
                <div class="hlc-card-hd-title">Settings</div>
            </div>
            <div class="hlc-card-body">
                <div class="hlc-3col">
                    <div class="hlc-field">
                        <label class="hlc-lbl" for="is_active">Status</label>
                        <select name="is_active" id="is_active" class="hlc-inp">
                            <option value="1" ${old('is_active', 1) == 1 ? 'selected' : ''}>Active</option>
                            <option value="0" ${old('is_active', 1) == 0 ? 'selected' : ''}>Inactive</option>
                        </select>
                        ${(errors.has('is_active')) ? (() => { const message = errors.first('is_active');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    </div>
                    <div class="hlc-field">
                        <label class="hlc-lbl" for="sort_order">Sort Order</label>
                        <input type="number" name="sort_order" id="sort_order"
                               class="hlc-inp${errors?.has('sort_order') ? ' is-invalid' : ''}"
                               value="${old('sort_order', 0)}" min="0">
                        <div class="hlc-hint">Lower number = higher priority.</div>
                        ${(errors.has('sort_order')) ? (() => { const message = errors.first('sort_order');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    </div>
                </div>

                <div class="hlc-2col">
                    <div class="hlc-field">
                        <label class="hlc-lbl" for="starts_at">Starts At <span class="opt">(optional)</span></label>
                        <input type="datetime-local" name="starts_at" id="starts_at"
                               class="hlc-inp${errors?.has('starts_at') ? ' is-invalid' : ''}"
                               value="${old('starts_at')}">
                        <div class="hlc-hint">Leave blank to start immediately.</div>
                        ${(errors.has('starts_at')) ? (() => { const message = errors.first('starts_at');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    </div>
                    <div class="hlc-field">
                        <label class="hlc-lbl" for="ends_at">Ends At <span class="opt">(optional)</span></label>
                        <input type="datetime-local" name="ends_at" id="ends_at"
                               class="hlc-inp${errors?.has('ends_at') ? ' is-invalid' : ''}"
                               value="${old('ends_at')}">
                        <div class="hlc-hint">Leave blank to show indefinitely.</div>
                        ${(errors.has('ends_at')) ? (() => { const message = errors.first('ends_at');  return html`<div class="hlc-err">${message}</div>`; })() : ''}                    </div>
                </div>
            </div>
        </div>

        
        <div style="display:flex;justify-content:flex-end;gap:12px;">
            <a href="${route('admin.headlines.index')}"
               style="display:inline-flex;align-items:center;gap:7px;padding:11px 22px;border-radius:12px;border:1.5px solid #E5E5E5;background:#fff;color:#374151;font-size:.88rem;font-weight:600;text-decoration:none;transition:background .15s;">
                Cancel
            </a>
            <button type="submit" class="hlc-submit" id="hlc-submit">
                <i class="fas fa-save"></i> Create Headline
            </button>
        </div>

    </form>
</div>
</div>
`,
    scripts: html`<script>
(function () {
    var msgEl   = document.getElementById('message_en');
    var bgEl    = document.getElementById('bg_color');
    var tcEl    = document.getElementById('text_color');
    var bgHex   = document.getElementById('bg_color_hex');
    var tcHex   = document.getElementById('text_color_hex');
    var preview = document.getElementById('hlcPreview');
    var prevTxt = document.getElementById('hlcPreviewText');

    function render() {
        preview.style.backgroundColor = bgEl.value || '#111111';
        preview.style.color           = tcEl.value || '#ffffff';
        prevTxt.textContent = (msgEl.value || '').trim() || 'Your headline…';
    }

    // Sync color picker ↔ hex text field
    bgEl.addEventListener('input', function () { bgHex.value = bgEl.value; render(); });
    tcEl.addEventListener('input', function () { tcHex.value = tcEl.value; render(); });
    bgHex.addEventListener('input', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(bgHex.value)) { bgEl.value = bgHex.value; render(); }
    });
    tcHex.addEventListener('input', function () {
        if (/^#[0-9a-fA-F]{6}$/.test(tcHex.value)) { tcEl.value = tcHex.value; render(); }
    });
    msgEl.addEventListener('input', render);

    render();

    // Submit state
    document.getElementById('hlc-form').addEventListener('submit', function () {
        var btn = document.getElementById('hlc-submit');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
        btn.disabled  = true;
    });
})();
</script>
`,
  };
}
