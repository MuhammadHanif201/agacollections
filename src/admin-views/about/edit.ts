// Port of resources/views/adminside/about/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, old, session, csrf_field, Collection, e, optional, foreach, quillEditor, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { about } = d;

  return {
    title: html`    <title>About Page — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Edit About page sections — hero, story, values and brand content for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="about page, brand story, company info, about us, content management, aga collections admin">
`,
    styles: html``,
    content: html`<div class="content-wrapper">

    <section class="content-header border-bottom mb-3">
        <div class="container-fluid d-flex justify-content-between align-items-center py-2">
            <h1 class="h4 fw-bold">
                <i class="fas fa-file-alt me-2 text-primary"></i> About Page
            </h1>
            <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item"><a href="${route('admin.home')}">Home</a></li>
                <li class="breadcrumb-item active">About Page</li>
            </ol>
        </div>
    </section>

    <section class="content">
        <div class="container-fluid">

            ${(session('success')) ? html`                <div class="alert alert-success alert-dismissible fade show">
                    <i class="fas fa-check-circle me-2"></i>${session('success')}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            ` : ''}
            ${(errors?.any()) ? html`                <div class="alert alert-danger">
                    <ul class="mb-0">
                        ${foreach(errors?.all(), (err, loop) => html`                            <li>${err}</li>
                        `)}                    </ul>
                </div>
            ` : ''}
            <form action="${route('admin.pages.about.update')}" method="POST" enctype="multipart/form-data">
                ${csrf_field()}
                
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-dark text-white d-flex align-items-center gap-2">
                        <i class="fas fa-heading"></i>
                        <strong>Hero Section</strong>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Page Title <span class="text-danger">*</span></label>
                            <input type="text" name="title"
                                   class="form-control ${(errors.has('title')) ? (() => { const message = errors.first('title');  return html` is-invalid `; })() : ''}"
                                   value="${old('title', about?.title ?? '')}"
                                   placeholder="e.g. Made for Your Style">
                            ${(errors.has('title')) ? (() => { const message = errors.first('title');  return html`<div class="invalid-feedback">${message}</div>`; })() : ''}                        </div>
                    </div>
                </div>

                
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-dark text-white d-flex align-items-center gap-2">
                        <i class="fas fa-images"></i>
                        <strong>Our Story — Images</strong>
                        <small class="ms-auto opacity-75">Portrait orientation recommended (3:4 ratio)</small>
                    </div>
                    <div class="card-body">
                        <div class="row g-4">

                            
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Main Story Image</label>
                                <small class="text-muted d-block mb-2">Large image shown on the left side of the story section.</small>
                                ${(about?.image) ? html`                                    <div class="mb-2">
                                        <img src="${asset('storage/'  +  (about?.image ?? ''))}" alt="Main image"
                                             style="height:120px; width:100px; object-fit:cover; border:1px solid #dee2e6; border-radius:4px;">
                                        <p class="text-muted small mt-1 mb-0">Current image</p>
                                    </div>
                                ` : ''}                                <input type="file" name="image" class="form-control ${(errors.has('image')) ? (() => { const message = errors.first('image');  return html` is-invalid `; })() : ''}"
                                       accept="image/jpeg,image/png,image/webp"
                                       onchange="previewImg(this,'prev_image')">
                                <img id="prev_image" src="#" alt="Preview" class="mt-2 d-none"
                                     style="height:100px; width:85px; object-fit:cover; border-radius:4px; border:1px solid #dee2e6;">
                                ${(errors.has('image')) ? (() => { const message = errors.first('image');  return html`<div class="invalid-feedback">${message}</div>`; })() : ''}                            </div>

                            
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Secondary Story Image</label>
                                <small class="text-muted d-block mb-2">Smaller overlapping image shown bottom-right of the story mosaic.</small>
                                ${(about?.image2) ? html`                                    <div class="mb-2">
                                        <img src="${asset('storage/'  +  (about?.image2 ?? ''))}" alt="Image 2"
                                             style="height:120px; width:100px; object-fit:cover; border:1px solid #dee2e6; border-radius:4px;">
                                        <p class="text-muted small mt-1 mb-0">Current image</p>
                                    </div>
                                ` : ''}                                <input type="file" name="image2" class="form-control ${(errors.has('image2')) ? (() => { const message = errors.first('image2');  return html` is-invalid `; })() : ''}"
                                       accept="image/jpeg,image/png,image/webp"
                                       onchange="previewImg(this,'prev_image2')">
                                <img id="prev_image2" src="#" alt="Preview" class="mt-2 d-none"
                                     style="height:100px; width:85px; object-fit:cover; border-radius:4px; border:1px solid #dee2e6;">
                                ${(errors.has('image2')) ? (() => { const message = errors.first('image2');  return html`<div class="invalid-feedback">${message}</div>`; })() : ''}                            </div>

                        </div>
                    </div>
                </div>

                
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-dark text-white d-flex align-items-center gap-2">
                        <i class="fas fa-th"></i>
                        <strong>Gallery Section — 4 Images</strong>
                        <small class="ms-auto opacity-75">Any ratio works, landscape preferred</small>
                    </div>
                    <div class="card-body">
                        <div class="row g-4">
                            ${foreach([
                                ['gallery_image1', 'Gallery Image 1', 'Large tall image (left side of gallery)'],
                                ['gallery_image2', 'Gallery Image 2', 'Top-right image'],
                                ['gallery_image3', 'Gallery Image 3', 'Middle-right image'],
                                ['gallery_image4', 'Gallery Image 4', 'Bottom-right wide image'],
                            ], ([field, label, hint]: any[], loop) => html`                            <div class="col-md-6 col-lg-3">
                                <label class="form-label fw-semibold">${label}</label>
                                <small class="text-muted d-block mb-2">${hint}</small>
                                ${(about?.[field]) ? html`                                    <div class="mb-2">
                                        <img src="${asset('storage/'  +  (about?.[field] ?? ''))}" alt="${label}"
                                             style="height:110px; width:100%; object-fit:cover; border:1px solid #dee2e6; border-radius:4px;">
                                        <p class="text-muted small mt-1 mb-0">Current image</p>
                                    </div>
                                ` : ''}                                <input type="file" name="${field}"
                                       class="form-control ${(errors.has(field)) ? (() => { const message = errors.first(field);  return html` is-invalid `; })() : ''}"
                                       accept="image/jpeg,image/png,image/webp"
                                       onchange="previewImg(this,'prev_${field}')">
                                <img id="prev_${field}" src="#" alt="Preview" class="mt-2 d-none"
                                     style="height:80px; width:100%; object-fit:cover; border-radius:4px; border:1px solid #dee2e6;">
                                ${(errors.has(field)) ? (() => { const message = errors.first(field);  return html`<div class="invalid-feedback">${message}</div>`; })() : ''}                            </div>
                            `)}                        </div>
                    </div>
                </div>

                
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-dark text-white d-flex align-items-center gap-2">
                        <i class="fas fa-align-left"></i>
                        <strong>Our Story — Text</strong>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Section Subtitle</label>
                                <input type="text" name="brand_subtitle" class="form-control"
                                       value="${old('brand_subtitle', about?.brand_subtitle ?? '')}"
                                       placeholder="Our Story">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">Section Heading</label>
                                <input type="text" name="brand_title" class="form-control"
                                       value="${old('brand_title', about?.brand_title ?? '')}"
                                       placeholder="Crafted With Passion, Worn With Pride">
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold">Paragraph 1</label>
                                <textarea name="brand_body1" class="form-control" rows="3">${old('brand_body1', about?.brand_body1 ?? '')}</textarea>
                            </div>
                            <div class="col-12">
                                <label class="form-label fw-semibold">Paragraph 2</label>
                                <textarea name="brand_body2" class="form-control" rows="3">${old('brand_body2', about?.brand_body2 ?? '')}</textarea>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-semibold">CTA Button Text</label>
                                <input type="text" name="brand_cta" class="form-control"
                                       value="${old('brand_cta', about?.brand_cta ?? '')}"
                                       placeholder="Shop the Collection">
                            </div>
                        </div>
                    </div>
                </div>

                
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-dark text-white d-flex align-items-center gap-2">
                        <i class="fas fa-chart-bar"></i>
                        <strong>Stats Bar — 4 Numbers</strong>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            ${foreach([
                                ['1', '10K+',  'Happy Customers'],
                                ['2', 'PAK',   'Nationwide Delivery'],
                                ['3', '24/7',  'Customer Support'],
                                ['4', '★★★★★', 'Trusted Reviews'],
                            ], ([n, defVal, defLabel]: any[], loop) => html`                            <div class="col-md-6 col-lg-3">
                                <div class="border rounded p-3">
                                    <label class="form-label fw-semibold mb-1">Stat ${n}</label>
                                    <input type="text" name="brand_stat${n}_value" class="form-control mb-2"
                                           value="${old(`brand_stat${n}_value`, about?.[`brand_stat${n}_value`] ?? defVal)}"
                                           placeholder="${defVal}">
                                    <input type="text" name="brand_stat${n}_label" class="form-control"
                                           value="${old(`brand_stat${n}_label`, about?.[`brand_stat${n}_label`] ?? defLabel)}"
                                           placeholder="${defLabel}">
                                </div>
                            </div>
                            `)}                        </div>
                    </div>
                </div>

                
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-dark text-white d-flex align-items-center gap-2">
                        <i class="fas fa-file-alt"></i>
                        <strong>Detailed Content Section</strong>
                        <small class="ms-auto opacity-75">Optional — full rich text shown below stats</small>
                    </div>
                    <div class="card-body">
                        ${quillEditor({ id: 'content', label: 'About Page Content', lang: 'en', value: about?.content ?? '', placeholder: 'Write detailed about page content with headings, paragraphs...' })}
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary px-4">
                        <i class="fas fa-save me-2"></i> Save All Changes
                    </button>
                    <a href="${route('client.about')}" target="_blank" class="btn btn-outline-secondary">
                        <i class="fas fa-external-link-alt me-2"></i> Preview Page
                    </a>
                </div>

            </form>
        </div>
    </section>
</div>


`,
    scripts: html``,
    // <script> function previewImg(input, previewId) {     const preview = document.getElementById(previewId);     if (input.files && input.files[0]) {         const reader = new FileReader();         reader.onload = e => {             preview.src = e.target.result;             preview.classList.remove('d-none');         };         reader.readAsDataURL(input.files[0]);     } } </script> 
  };
}
