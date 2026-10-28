// Port of resources/views/adminside/coupon/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, old, session, csrf_field, min, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { coupon } = d;

  return {
    title: html`        <title>Edit Coupon — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
        <meta name="description" content="Update coupon code, discount value, validity and usage limits for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
        <meta name="keywords" content="edit coupon, update promo, discount code, marketing, aga collections admin">
    `,
    styles: html``,
    content: html`        ${(session('success')) ? html`    Swal.fire({
        icon: 'success',
        title: '${session('success')}',
        showConfirmButton: false,
        timer: 3000
    });
` : ''}
${(session('error')) ? html`    Swal.fire({
        icon: 'error',
        title: '${session('error')}',
        showConfirmButton: false,
        timer: 3000
    });
` : ''}    <div class="content-wrapper">
        <section class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1>Edit Coupon</h1>
                    </div>
                    <div class="col-sm-6">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="${route('admin.home')}">Home</a></li>
                            <li class="breadcrumb-item"><a href="${route('admin.coupon.index')}">Coupons</a></li>
                            <li class="breadcrumb-item active">Edit Coupon</li>
                        </ol>
                    </div>
                </div>
            </div>
        </section>

        <section class="content">
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="card-header" style="background-color: #007bff; color: white;">
                                <h3 class="card-title">Edit Coupon</h3>
                            </div>
                            <div class="card-body">
                                <form action="${route('admin.coupon.update', coupon?.id)}" method="POST">
                                    ${csrf_field()}
                                    <!-- Coupon Code Input -->
                                    <div class="form-group">
                                        <label for="code" class="font-weight-bold">Coupon Code</label>
                                        <input type="text" name="code" value="${old('code', coupon?.code)}"
                                               class="form-control ${(errors.has('code')) ? (() => { const message = errors.first('code');  return html` is-invalid `; })() : ''}">
                                        ${(errors.has('code')) ? (() => { const message = errors.first('code');  return html`                                            <div class="invalid-feedback">${message}</div>
                                        `; })() : ''}                                    </div>

                                    <!-- Discount Amount Input -->
                                    <div class="form-group">
                                        <label for="discount" class="font-weight-bold">Discount Amount</label>
                                        <input type="number" name="discount" value="${old('discount', coupon?.discount)}"
                                               class="form-control ${(errors.has('discount')) ? (() => { const message = errors.first('discount');  return html` is-invalid `; })() : ''}"
                                               step="0.01" min="0">
                                        ${(errors.has('discount')) ? (() => { const message = errors.first('discount');  return html`                                            <div class="invalid-feedback">${message}</div>
                                        `; })() : ''}                                        <small class="text-muted">Enter discount as a number. For percentage type, this will represent a percentage value.</small>
                                    </div>

                                    <!-- Discount Type (Fixed or Percentage) -->
                                    <div class="form-group">
                                        <label for="type" class="font-weight-bold">Discount Type</label>
                                        <select name="type" class="form-control ${(errors.has('type')) ? (() => { const message = errors.first('type');  return html` is-invalid `; })() : ''}">
                                            <option value="fixed" ${old('type', coupon?.type) == 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                                            <option value="percentage" ${old('type', coupon?.type) == 'percentage' ? 'selected' : ''}>Percentage</option>
                                        </select>
                                        ${(errors.has('type')) ? (() => { const message = errors.first('type');  return html`                                            <div class="invalid-feedback">${message}</div>
                                        `; })() : ''}                                    </div>

                                    <!-- Valid Until Input -->
                                    <div class="form-group">
                                        <label for="valid_until" class="font-weight-bold">Valid Until</label>
                                        <input type="datetime-local" name="valid_until"
                                        value="${old('valid_until', coupon?.valid_until ? coupon?.valid_until?.format('Y-m-d\\TH:i') : '')}"
                                        class="form-control ${(errors.has('valid_until')) ? (() => { const message = errors.first('valid_until');  return html` is-invalid `; })() : ''}">



                                        ${(errors.has('valid_until')) ? (() => { const message = errors.first('valid_until');  return html`                                            <div class="invalid-feedback">${message}</div>
                                        `; })() : ''}                                    </div>

                                    <!-- Max Uses Input -->
                                    <div class="form-group">
                                        <label for="max_uses" class="font-weight-bold">Max Uses</label>
                                        <input type="number" name="max_uses" value="${old('max_uses', coupon?.max_uses)}"
                                               class="form-control ${(errors.has('max_uses')) ? (() => { const message = errors.first('max_uses');  return html` is-invalid `; })() : ''}" min="1">
                                        ${(errors.has('max_uses')) ? (() => { const message = errors.first('max_uses');  return html`                                            <div class="invalid-feedback">${message}</div>
                                        `; })() : ''}                                        <small class="text-muted">Specify how many times this coupon can be used.</small>
                                    </div>

                                    <!-- Submit Button -->
                                    <button type="submit" class="btn btn-primary">Update Coupon</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
`,
    scripts: html``,
  };
}
