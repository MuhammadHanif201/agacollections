// Port of resources/views/adminside/slider/create.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, old, csrf_field, Collection, max, min, e, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { nextPosition } = d;

  return {
    title: html`<title>Add Slider — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Upload a new homepage slider with image, heading, subtitle and call-to-action for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="add slider, new hero banner, upload slider, homepage carousel, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
.slc-page { padding: 32px 32px 80px; max-width: 780px; margin: 0 auto; }

.slc-hero {
    background: linear-gradient(135deg, #111111 0%, #1E3A5F 60%, #2A2A2A 100%);
    border-radius: 22px; padding: 26px 30px;
    position: relative; overflow: hidden; margin-bottom: 26px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.slc-hero::before {
    content:'';position:absolute;inset:0;opacity:.07;
    background-image:radial-gradient(circle at 1px 1px,#fff 1px,transparent 0);
    background-size:28px 28px;
}
.slc-hero-body { position:relative;z-index:1;display:flex;align-items:center;gap:16px; }
.slc-hero-ico {
    width:48px;height:48px;border-radius:14px;flex-shrink:0;
    background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);
    backdrop-filter:blur(8px);display:flex;align-items:center;
    justify-content:center;font-size:1.2rem;color:#fff;
}
.slc-hero-title { font-size:1.3rem;font-weight:800;color:#fff;margin:0; }
.slc-hero-sub   { font-size:.78rem;color:rgba(255,255,255,.55);margin:2px 0 0; }
.slc-back-btn {
    position:relative;z-index:1;
    display:inline-flex;align-items:center;gap:7px;
    background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.22);
    color:#fff !important;border-radius:11px;padding:9px 18px;
    font-size:.82rem;font-weight:700;text-decoration:none !important;transition:all .2s;
}
.slc-back-btn:hover { background:rgba(255,255,255,.22); }

.slc-card {
    background:#fff;border:1px solid #E8EDF5;border-radius:18px;
    overflow:hidden;box-shadow:0 2px 14px rgba(15,23,42,.06);margin-bottom:18px;
}
.slc-card-hd {
    padding:15px 22px;border-bottom:1px solid #F4F4F4;
    display:flex;align-items:center;gap:10px;background:#FAFBFE;
}
.slc-card-hd-ico {
    width:32px;height:32px;border-radius:9px;
    background:rgba(17,17,17,.1);color:#111111;
    display:flex;align-items:center;justify-content:center;font-size:.8rem;
}
.slc-card-hd-title { font-size:.76rem;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.1em; }
.slc-card-body { padding:22px; }

.slc-field { margin-bottom:18px; }
.slc-lbl { display:block;font-size:.74rem;font-weight:700;color:#374151;margin-bottom:7px;letter-spacing:.02em; }
.slc-lbl .req { color:#EF4444;margin-left:2px; }
.slc-lbl .opt { color:#9CA3AF;font-weight:400;font-size:.7rem; }
.slc-inp {
    width:100%;padding:10px 14px;border:1.5px solid #E5E5E5;border-radius:11px;
    font-size:.88rem;color:#1C1C1C;background:#fff;
    transition:border-color .2s,box-shadow .2s;
}
.slc-inp:focus { outline:none;border-color:#111111;box-shadow:0 0 0 3px rgba(17,17,17,.13); }
.slc-inp.is-invalid { border-color:#EF4444; }
.slc-err  { font-size:.72rem;color:#EF4444;margin-top:5px;font-weight:500; }
.slc-hint { font-size:.71rem;color:#A3A3A3;margin-top:5px; }

.slc-2col { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
@media(max-width:560px){ .slc-2col { grid-template-columns:1fr; } }

/* ── Media type toggle ── */
.slc-media-toggle {
    display:flex;gap:10px;margin-bottom:20px;
}
.slc-media-opt input { position:absolute;opacity:0;width:0;height:0; }
.slc-media-opt { position:relative; }
.slc-media-lbl {
    display:flex;align-items:center;gap:9px;padding:11px 20px;
    border:2px solid #E5E5E5;border-radius:11px;cursor:pointer;
    transition:all .2s;background:#FAFBFE;font-size:.84rem;font-weight:700;color:#374151;
}
.slc-media-lbl:hover { border-color:#111111;background:#F3F0E9; }
.slc-media-opt input:checked + .slc-media-lbl {
    border-color:#111111;background:#F3F0E9;color:#2A2A2A;
    box-shadow:0 0 0 3px rgba(17,17,17,.12);
}

/* ── Upload areas ── */
.slc-upload-area {
    border:2px dashed #D4D4D4;border-radius:14px;padding:28px;
    text-align:center;cursor:pointer;transition:all .2s;background:#FAFAFA;
    position:relative;overflow:hidden;
}
.slc-upload-area:hover { border-color:#111111;background:#F3F0E9; }
.slc-upload-area.has-preview { padding:0;border-style:solid;border-color:#DDD7CB; }
.slc-upload-area img#imgPreview {
    width:100%;max-height:220px;object-fit:cover;border-radius:12px;display:none;
}
.slc-upload-area video#vidPreview {
    width:100%;max-height:220px;border-radius:12px;display:none;
}
.slc-upload-placeholder { pointer-events:none; }
.slc-upload-placeholder i { font-size:2rem;color:#D4D4D4;margin-bottom:10px; }
.slc-upload-placeholder p { font-size:.82rem;color:#A3A3A3;margin:0; }
.slc-upload-placeholder span { font-size:.75rem;color:#111111;font-weight:700; }
.slc-file-input { position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%; }

/* Status toggle */
.slc-status-grid { display:flex;gap:10px; }
.slc-status-opt input { position:absolute;opacity:0;width:0;height:0; }
.slc-status-opt { position:relative; }
.slc-status-lbl {
    display:flex;align-items:center;gap:10px;padding:12px 16px;
    border:2px solid #E5E5E5;border-radius:11px;cursor:pointer;transition:all .2s;
    background:#FAFBFE;font-size:.84rem;font-weight:700;color:#374151;
}
.slc-status-lbl:hover { border-color:#111111;background:#F3F0E9; }
.slc-status-opt input:checked + .slc-status-lbl { border-color:#111111;background:#F3F0E9;box-shadow:0 0 0 3px rgba(17,17,17,.12); }
.slc-status-opt input:checked + .slc-status-lbl.inactive-lbl { border-color:#A3A3A3;background:#FAFAFA;box-shadow:0 0 0 3px rgba(100,116,139,.1); }

/* Save bar */
.slc-actions { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-top:4px; }
.slc-btn-save {
    display:inline-flex;align-items:center;gap:8px;
    background:linear-gradient(135deg,#2A2A2A,#111111);color:#fff;border:none;
    border-radius:12px;padding:12px 28px;font-size:.88rem;font-weight:700;cursor:pointer;
    box-shadow:0 4px 14px rgba(17,17,17,.35);transition:all .2s;
}
.slc-btn-save:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(17,17,17,.45); }
.slc-btn-cancel {
    display:inline-flex;align-items:center;gap:7px;
    background:#F3F4F6;color:#374151;border:1.5px solid #E5E5E5;
    border-radius:12px;padding:12px 22px;font-size:.88rem;font-weight:700;
    text-decoration:none !important;transition:all .2s;
}
.slc-btn-cancel:hover { background:#E9ECF0;color:#374151; }
</style>

<div class="content-wrapper">
<div class="slc-page">

    
    <div class="slc-hero">
        <div class="slc-hero-body">
            <div class="slc-hero-ico"><i class="fas fa-plus"></i></div>
            <div>
                <h1 class="slc-hero-title">Add Slider</h1>
                <p class="slc-hero-sub">Upload a new homepage banner slide.</p>
            </div>
        </div>
        <a href="${route('admin.slider.index')}" class="slc-back-btn">
            <i class="fas fa-arrow-left"></i> Back
        </a>
    </div>

    ${(errors?.any()) ? html`    <div style="background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:13px 18px;margin-bottom:20px;font-size:.84rem;color:#991B1B;display:flex;align-items:center;gap:9px;">
        <i class="fas fa-triangle-exclamation"></i> Please fix the errors below.
    </div>
    ` : ''}
    <form action="${route('admin.slider.store')}" method="POST" enctype="multipart/form-data" id="sliderForm">
        ${csrf_field()}
        
        <div class="slc-card">
            <div class="slc-card-hd">
                <div class="slc-card-hd-ico"><i class="fas fa-photo-film"></i></div>
                <div class="slc-card-hd-title">Slide Media <span style="color:#EF4444;">*</span></div>
            </div>
            <div class="slc-card-body">

                
                <label class="slc-lbl">Media Type</label>
                <div class="slc-media-toggle">
                    <div class="slc-media-opt">
                        <input type="radio" name="media_type" id="mt_image" value="image"
                            ${old('media_type', 'image') === 'image' ? 'checked' : ''}
                            onchange="switchMedia('image')">
                        <label for="mt_image" class="slc-media-lbl">
                            <i class="fas fa-image"></i> Image
                        </label>
                    </div>
                    <div class="slc-media-opt">
                        <input type="radio" name="media_type" id="mt_video" value="video"
                            ${old('media_type') === 'video' ? 'checked' : ''}
                            onchange="switchMedia('video')">
                        <label for="mt_video" class="slc-media-lbl">
                            <i class="fas fa-video"></i> Video
                        </label>
                    </div>
                </div>

                
                <div id="imageUploadWrap">
                    <div class="slc-upload-area" id="uploadArea" onclick="document.getElementById('imgFile').click()">
                        <input type="file" name="image" id="imgFile" class="slc-file-input" accept="image/*"
                            onchange="previewMedia(this,'img')">
                        <img id="imgPreview" src="" alt="">
                        <div class="slc-upload-placeholder" id="imgPlaceholder">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Click to upload or drag & drop</p>
                            <span>JPG, PNG, WEBP — max 4 MB. Recommended: 2560×1440px (16:9) — keep subject centered</span>
                        </div>
                    </div>
                    ${(errors.has('image')) ? (() => { const message = errors.first('image');  return html`<div class="slc-err" style="margin-top:8px;">${message}</div>`; })() : ''}                </div>

                
                <div id="videoUploadWrap" style="display:none;">
                    <div class="slc-upload-area" id="vidArea" onclick="document.getElementById('vidFile').click()">
                        <input type="file" name="video" id="vidFile" class="slc-file-input" accept="video/mp4,video/webm,video/ogg"
                            onchange="previewMedia(this,'vid')">
                        <video id="vidPreview" controls></video>
                        <div class="slc-upload-placeholder" id="vidPlaceholder">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Click to upload video</p>
                            <span>MP4, WebM, OGG — max 50 MB. Recommended: 2560×1440px (16:9) — keep subject centered</span>
                        </div>
                    </div>
                    ${(errors.has('video')) ? (() => { const message = errors.first('video');  return html`<div class="slc-err" style="margin-top:8px;">${message}</div>`; })() : ''}                </div>

            </div>
        </div>

        
        <div class="slc-card">
            <div class="slc-card-hd">
                <div class="slc-card-hd-ico"><i class="fas fa-pen-nib"></i></div>
                <div class="slc-card-hd-title">Slide Content</div>
            </div>
            <div class="slc-card-body">
                <div class="slc-field">
                    <label class="slc-lbl">Heading <span class="opt">optional</span></label>
                    <input type="text" name="title_en" class="slc-inp ${(errors.has('title_en')) ? (() => { const message = errors.first('title_en');  return html` is-invalid `; })() : ''}"
                        value="${old('title_en')}" placeholder="e.g. New Collection 2025">
                    ${(errors.has('title_en')) ? (() => { const message = errors.first('title_en');  return html`<div class="slc-err">${message}</div>`; })() : ''}                </div>
                <div class="slc-field">
                    <label class="slc-lbl">Subtitle <span class="opt">optional</span></label>
                    <input type="text" name="subtitle" class="slc-inp ${(errors.has('subtitle')) ? (() => { const message = errors.first('subtitle');  return html` is-invalid `; })() : ''}"
                        value="${old('subtitle')}" placeholder="e.g. Shop the latest arrivals">
                    ${(errors.has('subtitle')) ? (() => { const message = errors.first('subtitle');  return html`<div class="slc-err">${message}</div>`; })() : ''}                </div>
                <div class="slc-2col">
                    <div class="slc-field">
                        <label class="slc-lbl">Button Text <span class="opt">optional</span></label>
                        <input type="text" name="button_text" class="slc-inp ${(errors.has('button_text')) ? (() => { const message = errors.first('button_text');  return html` is-invalid `; })() : ''}"
                            value="${old('button_text')}" placeholder="e.g. Shop Now">
                        ${(errors.has('button_text')) ? (() => { const message = errors.first('button_text');  return html`<div class="slc-err">${message}</div>`; })() : ''}                    </div>
                    <div class="slc-field">
                        <label class="slc-lbl">Button Link <span class="opt">optional</span></label>
                        <input type="url" name="link" class="slc-inp ${(errors.has('link')) ? (() => { const message = errors.first('link');  return html` is-invalid `; })() : ''}"
                            value="${old('link')}" placeholder="https://...">
                        ${(errors.has('link')) ? (() => { const message = errors.first('link');  return html`<div class="slc-err">${message}</div>`; })() : ''}                    </div>
                </div>
            </div>
        </div>

        
        <div class="slc-card">
            <div class="slc-card-hd">
                <div class="slc-card-hd-ico"><i class="fas fa-sliders"></i></div>
                <div class="slc-card-hd-title">Display Settings</div>
            </div>
            <div class="slc-card-body">
                <div class="slc-2col">
                    <div class="slc-field">
                        <label class="slc-lbl">Display Order <span class="req">*</span></label>
                        <input type="number" name="position" class="slc-inp ${(errors.has('position')) ? (() => { const message = errors.first('position');  return html` is-invalid `; })() : ''}"
                            value="${old('position', nextPosition)}" min="1" required>
                        <div class="slc-hint">Lower number = shown first.</div>
                        ${(errors.has('position')) ? (() => { const message = errors.first('position');  return html`<div class="slc-err">${message}</div>`; })() : ''}                    </div>
                    <div class="slc-field">
                        <label class="slc-lbl">Status <span class="req">*</span></label>
                        <div class="slc-status-grid">
                            <div class="slc-status-opt">
                                <input type="radio" name="status" id="s_active" value="active"
                                    ${old('status','active') === 'active' ? 'checked' : ''}>
                                <label for="s_active" class="slc-status-lbl">
                                    <i class="fas fa-eye" style="color:#16A34A;"></i> Active
                                </label>
                            </div>
                            <div class="slc-status-opt">
                                <input type="radio" name="status" id="s_inactive" value="inactive"
                                    ${old('status') === 'inactive' ? 'checked' : ''}>
                                <label for="s_inactive" class="slc-status-lbl inactive-lbl">
                                    <i class="fas fa-eye-slash" style="color:#A3A3A3;"></i> Inactive
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="slc-actions">
            <a href="${route('admin.slider.index')}" class="slc-btn-cancel">
                <i class="fas fa-arrow-left"></i> Cancel
            </a>
            <button type="submit" class="slc-btn-save" id="saveBtn">
                <i class="fas fa-floppy-disk"></i> Save Slider
            </button>
        </div>

    </form>
</div>
</div>


`,
    scripts: html`<script>
function switchMedia(type) {
    const imgWrap = document.getElementById('imageUploadWrap');
    const vidWrap = document.getElementById('videoUploadWrap');
    if (type === 'video') {
        imgWrap.style.display = 'none';
        vidWrap.style.display = 'block';
    } else {
        imgWrap.style.display = 'block';
        vidWrap.style.display = 'none';
    }
}

function previewMedia(input, type) {
    const file = input.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'img') {
        const preview = document.getElementById('imgPreview');
        const placeholder = document.getElementById('imgPlaceholder');
        const area = document.getElementById('uploadArea');
        preview.src = url;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        area.classList.add('has-preview');
    } else {
        const preview = document.getElementById('vidPreview');
        const placeholder = document.getElementById('vidPlaceholder');
        const area = document.getElementById('vidArea');
        preview.src = url;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        area.classList.add('has-preview');
    }
}

// Init state on page load (e.g. after validation error)
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
