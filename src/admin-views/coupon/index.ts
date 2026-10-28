// Port of resources/views/adminside/coupon/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, session, csrf_field, method_field, number_format, ucfirst, optional, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { coupons } = d;

  return {
    title: html`        <title>Coupons — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
        <meta name="description" content="Create and manage discount coupons, promo codes and offers for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
        <meta name="keywords" content="coupons, discount codes, promo codes, offers, marketing, aga collections admin, ecommerce discounts">
    `,
    styles: html``,
    content: html`        <script>
    ${(session('success')) ? html`        Swal.fire({ icon: 'success', title: '${session('success')}', showConfirmButton: false, timer: 3000 });
        ` : ''} ${(session('error')) ? html`            Swal.fire({ icon: 'error', title: '${session('error')}', showConfirmButton: false, timer: 3000 });
        ` : ''}        </script>
        <div class="content-wrapper">
            <section class="content-header">
                <div class="container-fluid">
                    <div class="row mb-2">
                        <div class="col-sm-6">
                            <h1><i class="fas fa-ticket-alt"></i>&nbsp;View Coupons</h1>
                        </div>
                        <div class="col-sm-6">
                            <div class="d-flex justify-content-between align-items-center">
                                <ol class="breadcrumb">
                                    <li class="breadcrumb-item"><a href="${route('admin.home')}">Home</a></li>
                                    <li class="breadcrumb-item active">Coupons</li>
                                </ol>
                                <a href="${route('admin.coupon.create')}" class="btn btn-info">Add Coupon</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="content">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header" style="background-color: #007bff; color: #fff;">
                                    <h3 class="card-title"
                                        style="font-size: 1.5em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);">
                                        Coupons Table
                                    </h3>
                                </div>
                                <div class="card-body table-responsive p-2" style="background-color: #f8f9fa;">
                                    <table id="example2" class="table table-hover table-striped text-nowrap">
                                        <thead style="background-color: #007bff9a; color: #fff;">
                                            <tr>
                                                <th>Code</th>
                                                <th>Discount</th>
                                                <th>Type</th>
                                                <th>Max Uses</th>
                                                <th>Already Used Count</th>
                                                <th>Valid Until</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${foreach(coupons, (coupon, loop) => html`                                                <tr>
                                                    <td>${coupon?.code}</td>
                                                    <td>
                                                        ${(coupon?.type === 'percentage') ? html`                                                            ${coupon?.discount}%
                                                        ` : html`                                                            PKR ${number_format(coupon?.discount, 2)}
                                                        `}                                                    </td>
                                                    <td>${ucfirst(coupon?.type)}</td>
                                                    <td>${coupon?.max_uses}</td>
                                                     <td>${coupon?.used_count}</td>
                                                    <td>
                                                        ${(coupon?.valid_until) ? html`                                                            ${coupon?.valid_until?.format('d-m-Y H:i')}
                                                        ` : html`                                                            <span class="text-muted">No Expiry</span>
                                                        `}                                                    </td>


                                                    <td>
                                                        <a href="${route('admin.coupon.edit', coupon?.id)}"
                                                            class="btn btn-info">Edit</a>
                                                        <form action="${route('admin.coupon.destroy', coupon?.id)}"
                                                            method="POST" style="display:inline;">
                                                            ${csrf_field()}                                                            ${method_field('DELETE')}                                                            <button type="submit" class="btn btn-danger"
                                                                onclick="return confirm('Are you sure you want to delete this coupon?');">Delete</button>
                                                        </form>
                                                    </td>
                                                </tr>
                                            `)}                                        </tbody>
                                    </table>
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
