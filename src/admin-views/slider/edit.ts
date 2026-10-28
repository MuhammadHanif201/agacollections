// Port of resources/views/adminside/slider/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, old, csrf_field, Collection, empty, max, min, e, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { slider } = d;
  let currentType = old('media_type', slider?.media_type ?? 'image');
  return {
    title: html`<title>Edit Slider — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Update a homepage slider — image, heading, subtitle, CTA and display order for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="edit slider, update banner, manage carousel, hero image, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
.sle-page { padding: 32px 32px 80px; max-width: 780px; margin: 0 auto; }

.sle-hero {
    background: linear-gradient(135deg, #111111 0%, #1E3A5F 60%, #2A2A2A 100%);
    border-radius: 22px; padding: 26px 30px;
    position: relative; overflow: hidden; margin-bottom: 26px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.sle-hero::before {
    content:'';position:absolute;inset:0;opacity:.07;
    background-image:radial-gradient(circle at 1px 1px,#fff 1px,transparent 0);
    background-size:28px 28px;
}
.sle-hero-body { position:relative;z-index:1;display:flex;align-items:center;gap:16px; }
.sle-hero-ico {
    width:48px;height:48px;border-radius:14px;flex-shrink:0;
    background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);
    backdrop-filter:blur(8px);display:flex;align-items:center;
    justify-content:center;font-size:1.2rem;color:#fff;
}
.sle-hero-title { font-size:1.3rem;font-weight:800;color:#fff;margin:0; }
.sle-hero-sub   { font-size:.78rem;color:rgba(255,255,255,.55);margin:2px 0 0; }
.sle-back-btn {
    position:relative;z-index:1;
    display:inline-flex;align-items:center;gap:7px;
    background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.22);
    color:#fff !important;border-radius:11px;padding:9px 18px;
    font-size:.82rem;font-weight:700;text-decoration:none !important;transition:all .2s;
}
.sle-back-btn:hover { background:rgba(255,255,255,.22); }

.sle-card {
    background:#fff;border:1px solid #E8EDF5;border-radius:18px;
    overflow:hidden;box-shadow:0 2px 14px rgba(15,23,42,.06);margin-bottom:18px;
}
.sle-card-hd {
    padding:15px 22px;border-bottom:1px solid #F4F4F4;
    display:flex;align-items:center;gap:10px;background:#FAFBFE;
}
.sle-card-hd-ico {
    width:32px;height:32px;border-radius:9px;
    background:rgba(17,17,17,.1);color:#111111;
    display:flex;align-items:center;justify-content:center;font-size:.8rem;
}
.sle-card-hd-title { font-size:.76rem;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.1em; }
.sle-card-body { padding:22px; }

.sle-field { margin-bottom:18px; }
.sle-lbl { display:block;font-size:.74rem;font-weight:700;color:#374151;margin-bottom:7px;letter-spacing:.02em; }
.sle-lbl .req { color:#EF4444;margin-left:2px; }
.sle-lbl .opt { color:#9CA3AF;font-weight:400;font-size:.7rem; }
.sle-inp {
    width:100%;padding:10px 14px;border:1.5px solid #E5E5E5;border-radius:11px;
    font-size:.88rem;color:#1C1C1C;background:#fff;
    transition:border-color .2s,box-shadow .2s;
}
.sle-inp:focus { outline:none;border-color:#111111;box-shadow:0 0 0 3px rgba(17,17,17,.13); }
.sle-inp.is-invalid { border-color:#EF4444; }
.sle-err  { font-size:.72rem;color:#EF4444;margin-top:5px;font-weight:500; }
.sle-hint { font-size:.71rem;color:#A3A3A3;margin-top:5px; }

.sle-2col { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
@media(max-width:560px){ .sle-2col { grid-template-columns:1fr; } }

/* ── Media type toggle ── */
.sle-media-toggle { display:flex;gap:10px;margin-bottom:20px; }
.sle-media-opt input { position:absolute;opacity:0;width:0;height:0; }
.sle-media-opt { position:relative; }
.sle-media-lbl {
    display:flex;align-items:center;gap:9px;padding:11px 20px;
    border:2px solid #E5E5E5;border-radius:11px;cursor:pointer;
    transition:all .2s;background:#FAFBFE;font-size:.84rem;font-weight:700;color:#374151;
}
.sle-media-lbl:hover { border-color:#111111;background:#F3F0E9; }
.sle-media-opt input:checked + .sle-media-lbl {
    border-color:#111111;background:#F3F0E9;color:#2A2A2A;
    box-shadow:0 0 0 3px rgba(17,17,17,.12);
}

/* Current media preview */
.sle-current-img {
    width:100%;max-height:200px;object-fit:cover;
    border-radius:13px;border:1.5px solid #E5E5E5;display:block;margin-bottom:12px;
}
.sle-current-vid {
    width:100%;max-height:200px;
    border-radius:13px;border:1.5px solid #E5E5E5;display:block;margin-bottom:12px;
}

/* Upload trigger */
.sle-upload-trigger {
    display:inline-flex;align-items:center;gap:7px;
    padding:9px 16px;border:1.5px dashed #D4D4D4;border-radius:10px;
    font-size:.8rem;font-weight:600;color:#525252;cursor:pointer;
    background:#FAFAFA;transition:all .2s;
}
.sle-upload-trigger:hover { border-color:#111111;color:#111111;background:#F3F0E9; }
input[type="file"].sle-file { display:none; }
#newImgPreview { width:100%;max-height:180px;object-fit:cover;border-radius:11px;margin-top:10px;display:none; }
#newVidPreview { width:100%;max-height:180px;border-radius:11px;margin-top:10px;display:none; }

/* Status */
.sle-status-grid { display:flex;gap:10px; }
.sle-status-opt input { position:absolute;opacity:0;width:0;height:0; }
.sle-status-opt { position:relative; }
.sle-status-lbl {
    display:flex;align-items:center;gap:10px;padding:12px 16px;
    border:2px solid #E5E5E5;border-radius:11px;cursor:pointer;transition:all .2s;
    background:#FAFBFE;font-size:.84rem;font-weight:700;color:#374151;
}
.sle-status-lbl:hover { border-color:#111111;background:#F3F0E9; }
.sle-status-opt input:checked + .sle-status-lbl { border-color:#111111;background:#F3F0E9;box-shadow:0 0 0 3px rgba(17,17,17,.12); }
.sle-status-opt input:checked + .sle-status-lbl.inactive-lbl { border-color:#A3A3A3;background:#FAFAFA;box-shadow:0 0 0 3px rgba(100,116,139,.1); }

/* Actions */
.sle-actions { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px; }
.sle-btn-save {
    display:inline-flex;align-items:center;gap:8px;
    background:linear-gradient(135deg,#2A2A2A,#111111);color:#fff;border:none;
    border-radius:12px;padding:12px 28px;font-size:.88rem;font-weight:700;cursor:pointer;
    box-shadow:0 4px 14px rgba(17,17,17,.35);transition:all .2s;
}
.sle-btn-save:hover { transform:translateY(-1px); }
.sle-btn-cancel {
    display:inline-flex;align-items:center;gap:7px;
    background:#F3F4F6;color:#374151;border:1.5px solid #E5E5E5;
    border-radius:12px;padding:12px 22px;font-size:.88rem;font-weight:700;
    text-decoration:none !important;transition:all .2s;
}
.sle-btn-cancel:hover { background:#E9ECF0;color:#374151; }
</style>

<div class="content-wrapper">
<div class="sle-page">

    
    <div class="sle-hero">
        <div class="sle-hero-body">
            <div class="sle-hero-ico"><i class="fas fa-pen"></i></div>
            <div>
                <h1 class="sle-hero-title">Edit Slider</h1>
                <p class="sle-hero-sub">${slider?.title_en  ||  'Slide #'  +  (slider?.id ?? '')}</p>
            </div>
        </div>
        <a href="${route('admin.slider.index')}" class="sle-back-btn">
            <i class="fas fa-arrow-left"></i> Back
        </a>
    </div>

    ${(errors?.any()) ? html`    <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:13px 18px;margin-bottom:20px;font-size:.84rem;color:#991B1B;display:flex;align-items:center;gap:9px;">
        <i class="fas fa-triangle-exclamation"></i> Please fix the errors below.
    </div>
    ` : ''}
    <form action="${route('admin.slider.update', slider?.id)}" method="POST" enctype="multipart/form-data" id="sliderForm">
        ${csrf_field()}      

        
        <div class="sle-card">
            <div class="sle-card-hd">
                <div class="sle-card-hd-ico"><i class="fas fa-photo-film"></i></div>
                <div class="sle-card-hd-title">Slide Media</div>
            </div>
            <div class="sle-card-body">

                
                                <label class="sle-lbl">Media Type</label>
                <div class="sle-media-toggle">
                    <div class="sle-media-opt">
                        <input type="radio" name="media_type" id="mt_image" value="image"
                            ${currentType === 'image' ? 'checked' : ''}
                            onchange="switchMedia('image')">
                        <label for="mt_image" class="sle-media-lbl">
                            <i class="fas fa-image"></i> Image
                        </label>
                    </div>
                    <div class="sle-media-opt">
                        <input type="radio" name="media_type" id="mt_video" value="video"
                            ${currentType === 'video' ? 'checked' : ''}
                            onchange="switchMedia('video')">
                        <label for="mt_video" class="sle-media-lbl">
                            <i class="fas fa-video"></i> Video
                        </label>
                    </div>
                </div>

                
                <div id="imageSection">
                    ${(slider?.image) ? html`                        <img src="${asset('storage/'  +  (slider?.image ?? ''))}" class="sle-current-img" id="currentImg" alt="Current image">
                    ` : ''}                    <label class="sle-upload-trigger" for="newImgFile">
                        <i class="fas fa-upload"></i>
                        ${slider?.image ? 'Replace Image' : 'Upload Image'}
                        <span style="font-weight:400;color:#A3A3A3;font-size:.75rem;">optional</span>
                    </label>
                    <input type="file" name="image" id="newImgFile" class="sle-file" accept="image/*"
                        onchange="previewNew(this,'img')">
                    <img id="newImgPreview" src="" alt="New preview">
                    <div class="sle-hint" style="margin-top:8px;">JPG, PNG, WEBP — max 4 MB. Leave empty to keep current.</div>
                    ${(errors.has('image')) ? (() => { const message = errors.first('image');  return html`<div class="sle-err">${message}</div>`; })() : ''}                </div>

                
                <div id="videoSection" style="display:none;">
                    ${(slider?.video) ? html`                        <video src="${asset('storage/'  +  (slider?.video ?? ''))}" class="sle-current-vid" id="currentVid" controls></video>
                    ` : ''}                    <label class="sle-upload-trigger" for="newVidFile">
                        <i class="fas fa-upload"></i>
                        ${slider?.video ? 'Replace Video' : 'Upload Video'}
                        <span style="font-weight:400;color:#A3A3A3;font-size:.75rem;">optional</span>
                    </label>
                    <input type="file" name="video" id="newVidFile" class="sle-file" accept="video/mp4,video/webm,video/ogg"
                        onchange="previewNew(this,'vid')">
                    <video id="newVidPreview" controls></video>
                    <div class="sle-hint" style="margin-top:8px;">MP4, WebM, OGG — max 50 MB. Leave empty to keep current.</div>
                    ${(errors.has('video')) ? (() => { const message = errors.first('video');  return html`<div class="sle-err">${message}</div>`; })() : ''}                </div>

            </div>
        </div>

        
        <div class="sle-card">
            <div class="sle-card-hd">
                <div class="sle-card-hd-ico"><i class="fas fa-pen-nib"></i></div>
                <div class="sle-card-hd-title">Slide Content</div>
            </div>
            <div class="sle-card-body">
                <div class="sle-field">
                    <label class="sle-lbl">Heading <span class="opt">optional</span></label>
                    <input type="text" name="title_en" class="sle-inp ${(errors.has('title_en')) ? (() => { const message = errors.first('title_en');  return html` is-invalid `; })() : ''}"
                        value="${old('title_en', slider?.title_en)}" placeholder="e.g. New Collection 2025">
                    ${(errors.has('title_en')) ? (() => { const message = errors.first('title_en');  return html`<div class="sle-err">${message}</div>`; })() : ''}                </div>
                <div class="sle-field">
                    <label class="sle-lbl">Subtitle <span class="opt">optional</span></label>
                    <input type="text" name="subtitle" class="sle-inp ${(errors.has('subtitle')) ? (() => { const message = errors.first('subtitle');  return html` is-invalid `; })() : ''}"
                        value="${old('subtitle', slider?.subtitle)}" placeholder="e.g. Shop the latest arrivals">
                    ${(errors.has('subtitle')) ? (() => { const message = errors.first('subtitle');  return html`<div class="sle-err">${message}</div>`; })() : ''}                </div>
                <div class="sle-2col">
                    <div class="sle-field">
                        <label class="sle-lbl">Button Text <span class="opt">optional</span></label>
                        <input type="text" name="button_text" class="sle-inp ${(errors.has('button_text')) ? (() => { const message = errors.first('button_text');  return html` is-invalid `; })() : ''}"
                            value="${old('button_text', slider?.button_text)}" placeholder="e.g. Shop Now">
                        ${(errors.has('button_text')) ? (() => { const message = errors.first('button_text');  return html`<div class="sle-err">${message}</div>`; })() : ''}                    </div>
                    <div class="sle-field">
                        <label class="sle-lbl">Button Link <span class="opt">optional</span></label>
                        <input type="url" name="link" class="sle-inp ${(errors.has('link')) ? (() => { const message = errors.first('link');  return html` is-invalid `; })() : ''}"
                            value="${old('link', slider?.link)}" placeholder="https://...">
                        ${(errors.has('link')) ? (() => { const message = errors.first('link');  return html`<div class="sle-err">${message}</div>`; })() : ''}                    </div>
                </div>
            </div>
        </div>

        
        <div class="sle-card">
            <div class="sle-card-hd">
                <div class="sle-card-hd-ico"><i class="fas fa-sliders"></i></div>
                <div class="sle-card-hd-title">Display Settings</div>
            </div>
            <div class="sle-card-body">
                <div class="sle-2col">
                    <div class="sle-field">
                        <label class="sle-lbl">Display Order <span class="req">*</span></label>
                        <input type="number" name="position" class="sle-inp ${(errors.has('position')) ? (() => { const message = errors.first('position');  return html` is-invalid `; })() : ''}"
                            value="${old('position', slider?.position)}" min="1" required>
                        <div class="sle-hint">Lower number = shown first.</div>
                        ${(errors.has('position')) ? (() => { const message = errors.first('position');  return html`<div class="sle-err">${message}</div>`; })() : ''}                    </div>
                    <div class="sle-field">
                        <label class="sle-lbl">Status <span class="req">*</span></label>
                        <div class="sle-status-grid">
                            <div class="sle-status-opt">
                                <input type="radio" name="status" id="s_active" value="active"
                                    ${old('status', slider?.status) === 'active' ? 'checked' : ''}>
                                <label for="s_active" class="sle-status-lbl">
                                    <i class="fas fa-eye" style="color:#16A34A;"></i> Active
                                </label>
                            </div>
                            <div class="sle-status-opt">
                                <input type="radio" name="status" id="s_inactive" value="inactive"
                                    ${old('status', slider?.status) === 'inactive' ? 'checked' : ''}>
                                <label for="s_inactive" class="sle-status-lbl inactive-lbl">
                                    <i class="fas fa-eye-slash" style="color:#A3A3A3;"></i> Inactive
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="sle-actions">
            <a href="${route('admin.slider.index')}" class="sle-btn-cancel">
                <i class="fas fa-arrow-left"></i> Cancel
            </a>
            <button type="submit" class="sle-btn-save" id="saveBtn">
                <i class="fas fa-floppy-disk"></i> Update Slider
            </button>
        </div>

    </form>
</div>
</div>


`,
    scripts: html`<script>
function switchMedia(type) {
    const imgSec = document.getElementById('imageSection');
    const vidSec = document.getElementById('videoSection');
    if (type === 'video') {
        imgSec.style.display = 'none';
        vidSec.style.display = 'block';
    } else {
        imgSec.style.display = 'block';
        vidSec.style.display = 'none';
    }
}

function previewNew(input, type) {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'img') {
        const prev = document.getElementById('newImgPreview');
        const cur  = document.getElementById('currentImg');
        prev.src = url;
        prev.style.display = 'block';
        if (cur) cur.style.opacity = '.35';
    } else {
        const prev = document.getElementById('newVidPreview');
        const cur  = document.getElementById('currentVid');
        prev.src = url;
        prev.style.display = 'block';
        if (cur) cur.style.opacity = '.35';
    }
}

// Init on load
(function() {
    const checked = document.querySelector('input[name="media_type"]:checked');
    if (checked) switchMedia(checked.value);
})();

document.getElementById('sliderForm').addEventListener('submit', function() {
    const btn = document.getElementById('saveBtn');
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving…';
    btn.disabled = true;
});
</script>
`,
  };
}
