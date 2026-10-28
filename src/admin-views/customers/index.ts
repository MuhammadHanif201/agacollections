// Port of resources/views/adminside/customers/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, count, optional, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { customers } = d;

  return {
    title: html`    <title>Customers — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="View and manage registered customers, order history and contact details for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="customer list, manage customers, customer database, ecommerce customers, aga collections customers, crm">
`,
    styles: html``,
    content: html`
<div class="content-wrapper">
    <!-- Page Header -->
    <section class="content-header">
        <div class="container-fluid">
            <div class="row mb-3">
                <div class="col-md-6">
                    <h1><i class="fas fa-users"></i> View Customers</h1>
                </div>
                <div class="col-md-6 text-md-end text-start">
                    <ol class="breadcrumb float-md-end">
                        <li class="breadcrumb-item"><a href="${route('admin.home')}">Home</a></li>
                        <li class="breadcrumb-item active">Customers</li>
                    </ol>
                </div>
            </div>
        </div>
    </section>

    <!-- Main Table -->
    <section class="content">
        <div class="container-fluid">
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h3 class="card-title"><i class="fas fa-table me-1"></i> Customers List</h3>
                </div>

                <div class="card-body table-responsive p-0">
                    <table class="table table-striped table-hover align-middle text-nowrap">
                        <thead class="table-primary text-center">
                            <tr>
                                <th>ID</th>
                                <th>Full Name</th>

                                <th>Email</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>Address</th>
                                <th style="width: 100px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${count(customers) ? foreach(customers, (customer, loop) => html`                                <tr>
                                    <td class="text-center">${customer?.id}</td>
                                    <td>${customer?.full_name}</td>

                                    <td>${customer?.email}</td>
                                    <td>${customer?.phone}</td>
                                    <td>${customer?.city}</td>
                                    <td>${customer?.address}</td>
                                    <td class="text-center">
                                        <a href="${route('admin.customers.show', customer?.id)}" class="btn btn-sm btn-info">
                                            <i class="fas fa-eye"></i> View
                                        </a>
                                    </td>
                                </tr>
                            `) : html`                                <tr>
                                    <td colspan="8" class="text-center text-muted py-4">
                                        No customers found.
                                    </td>
                                </tr>
                            `}                        </tbody>
                    </table>
                </div>

                <div class="card-footer d-flex justify-content-center">
                    ${customers?.links('pagination::bootstrap-4')}
                </div>
            </div>
        </div>
    </section>
</div>
`,
    scripts: html``,
  };
}
