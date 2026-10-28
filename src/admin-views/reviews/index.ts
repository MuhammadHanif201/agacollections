// Port of resources/views/adminside/reviews/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, session, csrf_field, method_field, count, max, optional, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { pendingCount, approvedCount, totalCount, status, reviews } = d;

  return {
    title: html`    <title>Product Reviews — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Moderate customer reviews, approve feedback and respond to ratings for ${optional(companySetting)?.name ?? 'AGA Collections'} products.">
    <meta name="keywords" content="product reviews, customer reviews, ratings, review moderation, feedback, aga collections admin">
`,
    styles: html``,
    content: html`<div class="content-wrapper">

    <section class="content-header">
        <div class="container-fluid">
            <div class="row mb-2 align-items-center">
                <div class="col-sm-6">
                    <h1><i class="fas fa-star me-2 text-warning"></i>Product Reviews</h1>
                </div>
                <div class="col-sm-6">
                    <ol class="breadcrumb float-sm-right">
                        <li class="breadcrumb-item"><a href="${route('admin.home')}">Home</a></li>
                        <li class="breadcrumb-item active">Reviews</li>
                    </ol>
                </div>
            </div>
        </div>
    </section>

    <section class="content">
        <div class="container-fluid">

            
            ${(session('success')) ? html`            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>${session('success')}
                <button type="button" class="close" data-dismiss="alert"><span>&times;</span></button>
            </div>
            ` : ''}
            
            <div class="row mb-4">
                <div class="col-sm-4">
                    <div class="info-box">
                        <span class="info-box-icon bg-warning"><i class="fas fa-clock"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-text">Pending Approval</span>
                            <span class="info-box-number">${pendingCount}</span>
                        </div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="info-box">
                        <span class="info-box-icon bg-success"><i class="fas fa-check"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-text">Approved</span>
                            <span class="info-box-number">${approvedCount}</span>
                        </div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="info-box">
                        <span class="info-box-icon bg-primary"><i class="fas fa-comments"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-text">Total Reviews</span>
                            <span class="info-box-number">${totalCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            
            <div class="card">
                <div class="card-header p-0">
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="nav-item">
                            <a class="nav-link ${status === 'all' ? 'active' : ''}"
                               href="${route('admin.reviews.index')}">
                                All <span class="badge badge-secondary ml-1">${totalCount}</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${status === 'pending' ? 'active' : ''}"
                               href="${route('admin.reviews.index', {'status' : 'pending'})}">
                                Pending <span class="badge badge-warning ml-1">${pendingCount}</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${status === 'approved' ? 'active' : ''}"
                               href="${route('admin.reviews.index', {'status' : 'approved'})}">
                                Approved <span class="badge badge-success ml-1">${approvedCount}</span>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${status === 'rejected' ? 'active' : ''}"
                               href="${route('admin.reviews.index', {'status' : 'rejected'})}">
                                Rejected
                            </a>
                        </li>
                    </ul>
                </div>

                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="thead-light">
                                <tr>
                                    <th style="width:40px">#</th>
                                    <th>Product</th>
                                    <th>Reviewer</th>
                                    <th style="width:100px">Rating</th>
                                    <th>Comment</th>
                                    <th style="width:90px">Status</th>
                                    <th style="width:110px">Date</th>
                                    <th style="width:160px">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${count(reviews) ? foreach(reviews, (review, loop) => html`                                <tr>
                                    <td class="text-muted small">${review?.id}</td>
                                    <td>
                                        <a href="${route('client.productDetail', review?.product?.slug)}" target="_blank"
                                           class="font-weight-bold text-dark" style="text-decoration:none;">
                                            ${review?.product?.name}
                                        </a>
                                    </td>
                                    <td>
                                        <div class="font-weight-bold" style="font-size:.85rem;">${review?.name}</div>
                                        <div class="text-muted small">${review?.email}</div>
                                    </td>
                                    <td>
                                        ${(() => { const __o: any[] = []; for (let i = 1; i <= 5; i++) {  __o.push(html`                                            <i class="fas fa-star ${i <= review?.rating ? 'text-warning' : 'text-muted'}"
                                               style="font-size:.75rem;"></i>
                                        `); } return __o; })()}                                        <span class="text-muted small ml-1">(${review?.rating}/5)</span>
                                    </td>
                                    <td style="max-width:300px;">
                                        <div style="white-space:normal;font-size:.85rem;line-height:1.4;">
                                            ${review?.comment  ||  '—'}
                                        </div>
                                    </td>
                                    <td>
                                        ${(review?.status === 'approved') ? html`                                            <span class="badge badge-success">Approved</span>
                                        ` : (review?.status === 'rejected') ? html`                                            <span class="badge badge-danger">Rejected</span>
                                        ` : html`                                            <span class="badge badge-warning">Pending</span>
                                        `}                                    </td>
                                    <td class="text-muted small">
                                        ${review?.created_at?.format('d M Y')}<br>
                                        ${review?.created_at?.format('H:i')}
                                    </td>
                                    <td>
                                        <div class="d-flex flex-wrap gap-1" style="gap:4px;">
                                            ${(review?.status !== 'approved') ? html`                                            <form action="${route('admin.reviews.approve', review)}" method="POST" style="display:inline;">
                                                ${csrf_field()}                                                <button type="submit" class="btn btn-success btn-xs" title="Approve">
                                                    <i class="fas fa-check"></i> Approve
                                                </button>
                                            </form>
                                            ` : ''}
                                            ${(review?.status !== 'rejected') ? html`                                            <form action="${route('admin.reviews.reject', review)}" method="POST" style="display:inline;">
                                                ${csrf_field()}                                                <button type="submit" class="btn btn-secondary btn-xs" title="Reject">
                                                    <i class="fas fa-ban"></i>
                                                </button>
                                            </form>
                                            ` : ''}
                                            <form action="${route('admin.reviews.destroy', review)}" method="POST"
                                                  style="display:inline;"
                                                  onsubmit="return confirm('Delete this review permanently?')">
                                                ${csrf_field()}                                                ${method_field('DELETE')}                                                <button type="submit" class="btn btn-danger btn-xs" title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                `) : html`                                <tr>
                                    <td colspan="8" class="text-center py-5 text-muted">
                                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                                        No reviews found.
                                    </td>
                                </tr>
                                `}                            </tbody>
                        </table>
                    </div>
                </div>

                ${(reviews?.hasPages()) ? html`                <div class="card-footer">
                    ${reviews?.links()}
                </div>
                ` : ''}            </div>

        </div>
    </section>
</div>
`,
    scripts: html``,
  };
}
