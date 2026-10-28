// Port of resources/views/adminside/customers/show.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, csrf_token, number_format, ucfirst, optional, foreach, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { customer, orders } = d;

  return {
    title: html`    <title>Customer Details — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Customer profile, order history, addresses and account activity for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="customer profile, customer detail, order history, customer account, aga collections admin">
`,
    styles: html``,
    content: html`
<div class="content-wrapper">
    <!-- Page Header -->
    <section class="content-header">
        <div class="container-fluid d-flex justify-content-between align-items-center">
            <h1><i class="fas fa-user"></i> Customer Profile</h1>
            <a href="${route('admin.customers.index')}" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Back to Customers
            </a>
        </div>
    </section>

    <!-- Content Body -->
    <section class="content">
        <div class="container-fluid">
            <!-- Customer Info -->
            <div class="card shadow mb-4">
                <div class="card-header bg-info text-white">
                    <h3 class="card-title mb-0"><i class="fas fa-id-card"></i> Customer Information</h3>
                </div>
                <div class="card-body">
                    <table class="table table-striped table-bordered">
                        <tr>
                            <th style="width: 200px;">Customer ID</th>
                            <td>${customer?.id}</td>
                        </tr>
                        <tr>
                            <th>Full Name</th>
                            <td>${customer?.full_name}</td>
                        </tr>

                        <tr>
                            <th>Email</th>
                            <td>${customer?.email}</td>
                        </tr>
                        <tr>
                            <th>Phone</th>
                            <td>${customer?.phone}</td>
                        </tr>
                        <tr>
                            <th>City</th>
                            <td>${customer?.city}</td>
                        </tr>
                        <tr>
                            <th>Full Address</th>
                            <td>${customer?.address}</td>
                        </tr>
                        <tr>
                            <th>Registered At</th>
                            <td>${customer?.created_at?.timeZone('Asia/Karachi')?.format('d-m-Y h:i A')}</td>
                        </tr>
                        <tr>
                            <th>Last Updated</th>
                            <td>${customer?.updated_at?.timeZone('Asia/Karachi')?.format('d-m-Y h:i A')}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Orders -->
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h3 class="card-title"><i class="fas fa-shopping-bag"></i> Orders History</h3>
                </div>
                <div class="card-body table-responsive">
                    ${(orders?.count() > 0) ? html`                        <table class="table table-bordered text-center table-hover">
                            <thead class="thead-light">
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Total (PKR)</th>
                                    <th>Payment Method</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${foreach(orders, (order, loop) => html`                                    <tr>
                                        <td>${order?.id}</td>
                                        <td>${order?.created_at?.timeZone('Asia/Karachi')?.format('d-m-Y')}</td>
                                        <td>${number_format(order?.total, 2)}</td>
                                        <td>
Cash on Delivery
</td>

                                        <td>
                                            
                                            ${ucfirst(order?.status)}
                                        </td>
                                        <td>
                                            <a href="${route('admin.orders.show', order?.id)}" class="btn btn-sm btn-outline-info">
                                                <i class="fas fa-eye"></i> View
                                            </a>
                                        </td>
                                    </tr>
                                `)}                            </tbody>
                        </table>
                    ` : html`                        <div class="alert alert-warning mb-0">
                            <i class="fas fa-info-circle"></i> No orders found for this customer.
                        </div>
                    `}                </div>
            </div>
        </div>
    </section>
</div>

<!-- Status Update Script -->
<script>
    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll(".status-dropdown").forEach(function (dropdown) {
            dropdown.addEventListener("change", function () {
                const orderId = this.dataset.orderId;
                const newStatus = this.value;

                fetch(\`/admin/orders/\${orderId}/update-status\`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": '${csrf_token()}'
                    },
                    body: JSON.stringify({ status: newStatus })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Updated!', 'Order status has been updated.', 'success');
                    } else {
                        Swal.fire('Error', 'Failed to update order status.', 'error');
                    }
                })
                .catch(() => Swal.fire('Error', 'Something went wrong.', 'error'));
            });
        });
    });
</script>
`,
    scripts: html``,
  };
}
