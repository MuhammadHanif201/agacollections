// Port of resources/views/adminside/orders/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, request, date, number_format, count, empty, ucfirst, array_merge, max, min, method_exists, optional, foreach, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { summary, categories, campaign, orders } = d;
  let pendingCount = summary?.['pending']    ?? 0;
  let processingCount = summary?.['processing'] ?? 0;
  let shippedCount = summary?.['shipped']    ?? 0;
  let completedCount = summary?.['completed']  ?? 0;
  let cancelledCount = summary?.['cancelled']  ?? 0;
  let totalOrders = pendingCount + processingCount + shippedCount + completedCount + cancelledCount;
  let activeStatus = request('status', 'all');
  let chips = [
          ['all',        totalOrders,     'total',      'fas fa-layer-group', 'All Orders'],
          ['pending',    pendingCount,    'pending',    'far fa-clock',         'Pending'],
          ['processing', processingCount, 'processing', 'fas fa-cog',           'Processing'],
          ['completed',  completedCount,  'completed',  'far fa-check-circle',  'Completed'],
          ['cancelled',  cancelledCount,  'cancelled',  'far fa-times-circle',  'Cancelled'],
      ];
  return {
    title: html`<title>Orders — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Manage all customer orders, view order status, track shipments and update fulfilment for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="manage orders, customer orders, order fulfilment, order status, ecommerce orders, aga collections orders, pakistan clothing store">
`,
    styles: html`<style>
/* ── Tokens (match show page) ───────────────────── */
:root {
    --c-bg:      #F0F2F5;
    --c-surface: #FFFFFF;
    --c-border:  #E5E7EB;
    --c-dark:    #111827;
    --c-muted:   #6B7280;
    --c-light:   #9CA3AF;
    --c-indigo:  #4F46E5;
    --c-indigo-l:#EEF2FF;
    --c-green:   #059669;
    --c-green-l: #ECFDF5;
    --c-amber:   #D97706;
    --c-amber-l: #FFFBEB;
    --c-red:     #DC2626;
    --c-red-l:   #FEF2F2;
    --c-blue:    #111111;
    --c-blue-l:  #F3F0E9;
}

/* ── Page shell ─────────────────────────────────── */
.oi-wrap { background: var(--c-bg); min-height: 100vh; padding-bottom: 48px; }

/* ── Hero ───────────────────────────────────────── */
.oi-hero {
    background: linear-gradient(130deg, #0f0c29 0%, #1e1356 50%, #0f0c29 100%);
    padding: 28px 32px 24px;
    position: relative;
    overflow: hidden;
}
.oi-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 100% at 80% 50%, rgba(79,70,229,.2) 0%, transparent 65%);
    pointer-events: none;
}
.oi-hero-inner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
}
.oi-hero-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
    margin-bottom: 6px;
}
.oi-hero-title {
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -.4px;
    margin: 0 0 6px;
    line-height: 1;
}
.oi-hero-sub { font-size: 13px; color: rgba(255,255,255,.4); margin: 0; }

.oi-hero-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 4px;
}
.oi-hero-stat {
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 10px;
    padding: 9px 16px;
    text-align: center;
    min-width: 90px;
}
.oi-hero-stat-val { font-size: 18px; font-weight: 800; color: #fff; line-height: 1; }
.oi-hero-stat-lbl { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.35); margin-top: 3px; }

/* ── Status summary chips ───────────────────────── */
.oi-stats-row {
    display: flex;
    gap: 12px;
    padding: 16px 32px;
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    overflow-x: auto;
    scrollbar-width: none;
    flex-wrap: nowrap;
}
.oi-stats-row::-webkit-scrollbar { display: none; }
.oi-stat-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--c-bg);
    border: 1px solid var(--c-border);
    border-radius: 12px;
    padding: 10px 16px;
    flex-shrink: 0;
    min-width: 130px;
    cursor: pointer;
    text-decoration: none;
    transition: box-shadow .15s, border-color .15s;
}
.oi-stat-chip:hover { box-shadow: 0 4px 12px rgba(0,0,0,.07); border-color: var(--c-indigo); text-decoration: none; }
.oi-stat-chip.active { border-color: var(--c-indigo); background: var(--c-indigo-l); }
.oi-stat-icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    color: #fff;
}
.oi-stat-icon--pending    { background: linear-gradient(135deg,#D97706,#F59E0B); }
.oi-stat-icon--processing { background: linear-gradient(135deg,#4F46E5,#7C3AED); }
.oi-stat-icon--completed  { background: linear-gradient(135deg,#059669,#10B981); }
.oi-stat-icon--cancelled  { background: linear-gradient(135deg,#DC2626,#EF4444); }
.oi-stat-icon--total      { background: linear-gradient(135deg,#111827,#374151); }
.oi-stat-info {}
.oi-stat-num  { font-size: 20px; font-weight: 800; color: var(--c-dark); line-height: 1; }
.oi-stat-name { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--c-muted); margin-top: 2px; }

/* ── Body ───────────────────────────────────────── */
.oi-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }

/* ── Card ───────────────────────────────────────── */
.oi-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.05);
}
.oi-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid var(--c-border);
    background: #FAFAFA;
}
.oi-card-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--c-muted);
    display: flex;
    align-items: center;
    gap: 7px;
}
.oi-card-title i { color: var(--c-indigo); }

/* ── Filter form ────────────────────────────────── */
.oi-filter-body { padding: 16px 20px; }
.oi-filter-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--c-muted);
    display: block;
    margin-bottom: 5px;
}
.oi-form-control {
    border: 1.5px solid var(--c-border);
    border-radius: 8px;
    padding: 7px 11px;
    font-size: 13px;
    color: var(--c-dark);
    background: #fff;
    outline: none;
    width: 100%;
    transition: border-color .15s;
}
.oi-form-control:focus { border-color: var(--c-indigo); box-shadow: 0 0 0 3px rgba(79,70,229,.1); }
.oi-btn-apply {
    background: var(--c-indigo);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity .15s;
    white-space: nowrap;
}
.oi-btn-apply:hover { opacity: .87; }
.oi-btn-clear {
    border: 1.5px solid var(--c-border);
    background: #fff;
    color: var(--c-muted);
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    transition: border-color .15s;
}
.oi-btn-clear:hover { border-color: var(--c-red); color: var(--c-red); text-decoration: none; }

/* ── Table header bar ───────────────────────────── */
.oi-table-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid var(--c-border);
    background: linear-gradient(90deg, #0f0c29, #1e1356);
    gap: 12px;
    flex-wrap: wrap;
}
.oi-table-bar-title {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
}
.oi-count-pill {
    background: rgba(255,255,255,.12);
    color: rgba(255,255,255,.8);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 700;
}

/* ── Table ──────────────────────────────────────── */
.oi-table { width: 100%; border-collapse: collapse; }
.oi-table thead th {
    background: #F9FAFB;
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .09em;
    color: var(--c-muted);
    border-bottom: 1px solid var(--c-border);
    white-space: nowrap;
}
.oi-table tbody tr {
    border-bottom: 1px solid #F3F4F6;
    transition: background .1s;
}
.oi-table tbody tr:last-child { border-bottom: none; }
.oi-table tbody tr:hover { background: #F8F9FF; }
.oi-table td { padding: 12px 14px; vertical-align: middle; }

/* ── Order ID badge ─────────────────────────────── */
.oi-id-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--c-indigo-l);
    border: 1px solid rgba(79,70,229,.18);
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 13px;
    font-weight: 800;
    color: var(--c-indigo);
    white-space: nowrap;
}

/* ── Customer cell ──────────────────────────────── */
.oi-cust-name  { font-size: 13px; font-weight: 700; color: var(--c-dark); margin-bottom: 3px; }
.oi-cust-phone { font-size: 12px; color: var(--c-muted); display: flex; align-items: center; gap: 4px; }
.oi-cust-city  { font-size: 11px; color: var(--c-light); margin-top: 2px; }

/* ── Item preview ───────────────────────────────── */
.oi-items-preview { display: flex; flex-direction: column; gap: 2px; }
.oi-item-name { font-size: 12px; font-weight: 600; color: var(--c-dark); line-height: 1.3; }
.oi-item-meta { font-size: 11px; color: var(--c-light); }
.oi-more-tag {
    font-size: 10px;
    font-weight: 700;
    color: var(--c-muted);
    background: #F3F4F6;
    border-radius: 5px;
    padding: 1px 6px;
    display: inline-block;
    margin-top: 2px;
}

/* ── Status badge ───────────────────────────────── */
.oi-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
}
.oi-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.oi-status--pending    { background: rgba(217,119,6,.12);  color: var(--c-amber); }
.oi-status--pending    .oi-status-dot { background: var(--c-amber); }
.oi-status--processing { background: rgba(79,70,229,.1);   color: #4338CA; }
.oi-status--processing .oi-status-dot { background: var(--c-indigo); }
.oi-status--completed  { background: rgba(5,150,105,.1);   color: var(--c-green); }
.oi-status--completed  .oi-status-dot { background: var(--c-green); }
.oi-status--cancelled  { background: rgba(220,38,38,.08);  color: var(--c-red); }
.oi-status--cancelled  .oi-status-dot { background: var(--c-red); }
.oi-status--shipped    { background: rgba(37,99,235,.1);   color: var(--c-blue); }
.oi-status--shipped    .oi-status-dot { background: var(--c-blue); }

/* ── Campaign chips ─────────────────────────────── */
.oi-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 700;
}
.oi-chip--indigo { background: var(--c-indigo-l); color: #3730A3; }
.oi-chip--green  { background: var(--c-green-l);  color: #065F46; }
.oi-chip--amber  { background: var(--c-amber-l);  color: #92400E; }

/* ── Total ──────────────────────────────────────── */
.oi-total { font-size: 14px; font-weight: 800; color: var(--c-dark); }

/* ── View button ────────────────────────────────── */
.oi-btn-view {
    background: var(--c-indigo);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: opacity .15s, transform .15s;
    white-space: nowrap;
}
.oi-btn-view:hover { opacity: .86; transform: translateY(-1px); color: #fff; text-decoration: none; }

/* ── Date cell ──────────────────────────────────── */
.oi-date-main { font-size: 12px; font-weight: 600; color: var(--c-dark); white-space: nowrap; }
.oi-date-time { font-size: 11px; color: var(--c-light); margin-top: 1px; }

/* ── Empty state ────────────────────────────────── */
.oi-empty {
    text-align: center;
    padding: 56px 24px;
}
.oi-empty-icon {
    width: 56px; height: 56px;
    background: var(--c-indigo-l);
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: var(--c-indigo);
    margin-bottom: 14px;
}
.oi-empty-title { font-size: 15px; font-weight: 700; color: var(--c-dark); margin-bottom: 4px; }
.oi-empty-sub   { font-size: 13px; color: var(--c-muted); }

/* ── Pagination ─────────────────────────────────── */
.oi-pagination-wrap {
    padding: 14px 20px;
    border-top: 1px solid var(--c-border);
    background: #FAFAFA;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
}
.oi-pagination-info { font-size: 12px; color: var(--c-muted); }
.pagination .page-item.active .page-link { background: var(--c-indigo) !important; border-color: var(--c-indigo) !important; color: #fff !important; }
.pagination .page-link { color: var(--c-dark) !important; font-size: 13px; border-color: var(--c-border) !important; }
.pagination .page-link:hover { background: var(--c-indigo-l) !important; color: var(--c-indigo) !important; }
.pagination .page-item.disabled .page-link { color: var(--c-light) !important; }

/* ── Responsive ─────────────────────────────────── */
@media (max-width: 768px) {
    .oi-hero { padding: 20px 16px 16px; }
    .oi-body { padding: 12px; }
    .oi-stats-row { padding: 12px 16px; }
    .oi-hero-sub { display: none; }
    .col-hide-sm { display: none; }
}
</style>
`,
    content: html`

<div class="content-wrapper oi-wrap">


<div class="oi-hero">
    <div class="oi-hero-inner">
        <div>
            <div class="oi-hero-eyebrow">${companySetting?.name ?? 'AGA Collections'} &mdash; Admin</div>
            <h1 class="oi-hero-title">Order Management</h1>
            <p class="oi-hero-sub">Track, filter and manage all customer orders in one place.</p>
        </div>
        <div class="oi-hero-stats">
            <div class="oi-hero-stat">
                <div class="oi-hero-stat-val">${totalOrders}</div>
                <div class="oi-hero-stat-lbl">Total</div>
            </div>
            <div class="oi-hero-stat">
                <div class="oi-hero-stat-val" style="color:#FBBF24;">${pendingCount}</div>
                <div class="oi-hero-stat-lbl">Pending</div>
            </div>
            <div class="oi-hero-stat">
                <div class="oi-hero-stat-val" style="color:#818CF8;">${processingCount}</div>
                <div class="oi-hero-stat-lbl">Processing</div>
            </div>
            <div class="oi-hero-stat">
                <div class="oi-hero-stat-val" style="color:#34D399;">${completedCount}</div>
                <div class="oi-hero-stat-lbl">Completed</div>
            </div>
        </div>
    </div>
</div>


<div class="oi-stats-row">
        ${foreach(chips, ([val, count, cls, icon, label]: any[], loop) => html`    <a href="${route('admin.orders.index', array_merge(request()?.except('page'), {'status' : val}))}"
       class="oi-stat-chip ${activeStatus === val ? 'active' : ''}">
        <div class="oi-stat-icon oi-stat-icon--${cls}">
            <i class="${icon}"></i>
        </div>
        <div class="oi-stat-info">
            <div class="oi-stat-num">${count}</div>
            <div class="oi-stat-name">${label}</div>
        </div>
    </a>
    `)}</div>


<div class="oi-body">

    
    <div class="oi-card">
        <div class="oi-card-head">
            <div class="oi-card-title"><i class="fas fa-sliders-h"></i> Filter Orders</div>
            ${(request()?.hasAny(['search','status','category','campaign','from','to'])) ? html`            <a href="${route('admin.orders.index')}" class="oi-btn-clear" style="font-size:11px;padding:4px 10px;">
                <i class="fas fa-times"></i> Clear filters
            </a>
            ` : ''}        </div>
        <form method="GET" action="${route('admin.orders.index')}" class="oi-filter-body">
            <div class="row g-3 align-items-end">
                <div class="col-md-3">
                    <label class="oi-filter-label">Search</label>
                    <input type="text" name="search" class="oi-form-control"
                           placeholder="Name, email, order #…"
                           value="${request('search')}">
                </div>
                <div class="col-md-2">
                    <label class="oi-filter-label">Status</label>
                    <select name="status" class="oi-form-control">
                        <option value="all" ${request('status','all')==='all'?'selected':''}>All Statuses</option>
                        <option value="pending"    ${request('status')==='pending'    ?'selected':''}>Pending</option>
                        <option value="processing" ${request('status')==='processing' ?'selected':''}>Processing</option>
                        <option value="completed"  ${request('status')==='completed'  ?'selected':''}>Completed</option>
                        <option value="cancelled"  ${request('status')==='cancelled'  ?'selected':''}>Cancelled</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="oi-filter-label">Category</label>
                    <select name="category" class="oi-form-control">
                        <option value="all">All Categories</option>
                        ${foreach(categories, (cat, loop) => html`                        <option value="${cat?.id}" ${request('category')==cat?.id?'selected':''}>
                            ${cat?.title}
                        </option>
                        `)}                    </select>
                </div>
                <div class="col-md-2">
                    <label class="oi-filter-label">Campaign</label>
                    <input type="text" name="campaign" class="oi-form-control"
                           placeholder="Campaign name…"
                           value="${request('campaign') ?? campaign ?? ''}">
                </div>
                <div class="col-md-1 col-6">
                    <label class="oi-filter-label">From</label>
                    <input type="date" name="from" class="oi-form-control" value="${request('from')}">
                </div>
                <div class="col-md-1 col-6">
                    <label class="oi-filter-label">To</label>
                    <input type="date" name="to" class="oi-form-control" value="${request('to')}">
                </div>
                <div class="col-md-1">
                    <button type="submit" class="oi-btn-apply w-100">
                        <i class="fas fa-search"></i> Apply
                    </button>
                </div>
            </div>
        </form>
    </div>

    
    <div class="oi-card">
        <div class="oi-table-bar">
            <div class="oi-table-bar-title">
                <i class="fas fa-shopping-bag" style="color:#818CF8;"></i>
                Orders
                <span class="oi-count-pill">${orders?.total() ?? orders?.count()}</span>
            </div>
            ${(request()?.hasAny(['search','status','campaign','from','to'])) ? html`            <div style="font-size:11px;color:rgba(255,255,255,.45);">
                Filtered results
            </div>
            ` : ''}        </div>

        <div class="table-responsive">
            <table class="oi-table">
                <thead>
                    <tr>
                        <th style="width:80px;">#Order</th>
                        <th style="min-width:180px;">Customer</th>
                        <th style="min-width:160px;" class="col-hide-sm">Items</th>
                        <th style="width:110px;">Total</th>
                        <th style="width:110px;" class="col-hide-sm">Status</th>
                        <th style="width:100px;" class="col-hide-sm">Date</th>
                        <th style="width:80px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${count(orders) ? foreach(orders, (order, loop) => { let c = order?.customer;
let city = order?.contact_city;
let itemsList = order?.items?.take(2);
let moreCount = order?.items?.count() - 2;
 return html`                                        <tr>

                        
                        <td>
                            <span class="oi-id-badge">
                                <i class="fas fa-hashtag" style="font-size:9px;opacity:.6;"></i>${order?.id}
                            </span>
                        </td>

                        
                        <td>
                            
                            <div class="oi-cust-name">${order?.contact_name  ||  '—'}</div>
                            ${(order?.contact_phone) ? html`                            <div class="oi-cust-phone">
                                <i class="fas fa-phone-alt" style="font-size:9px;opacity:.6;"></i>
                                ${order?.contact_phone}
                            </div>
                            ` : ''}                            ${(city) ? html`                            <div class="oi-cust-city">
                                <i class="fas fa-map-marker-alt" style="font-size:9px;margin-right:2px;opacity:.5;"></i>${city}
                            </div>
                            ` : ''}                        </td>

                        
                        <td class="col-hide-sm">
                            <div class="oi-items-preview">
                                ${foreach(itemsList, (item, loop) => html`                                <div>
                                    <div class="oi-item-name">${item?.product?.name ?? '—'}</div>
                                    <div class="oi-item-meta">
                                        Qty: ${item?.quantity}
                                        &nbsp;&middot;&nbsp;
                                        PKR ${number_format(item?.price, 0)}
                                    </div>
                                </div>
                                `)}                                ${(moreCount > 0) ? html`                                <span class="oi-more-tag">+${moreCount} more</span>
                                ` : ''}                            </div>
                        </td>

                        
                        <td>
                            <div class="oi-total">PKR ${number_format(order?.total, 0)}</div>
                            <div style="font-size:10px;color:var(--c-light);margin-top:2px;">
                                ${order?.items?.sum('quantity')} unit(s)
                            </div>
                        </td>

                        
                        <td class="col-hide-sm">
                            <span class="oi-status oi-status--${order?.status}">
                                <span class="oi-status-dot"></span>
                                ${ucfirst(order?.status)}
                            </span>
                        </td>

                        
                        <td class="col-hide-sm">
                            <div class="oi-date-main">
                                ${order?.created_at?.timezone('Asia/Karachi')?.format('d M Y')}
                            </div>
                            <div class="oi-date-time">
                                ${order?.created_at?.timezone('Asia/Karachi')?.format('h:i A')}
                            </div>
                        </td>

                        
                        <td>
                            <a href="${route('admin.orders.show', order?.id)}" class="oi-btn-view">
                                <i class="fas fa-eye" style="font-size:11px;"></i> View
                            </a>
                        </td>

                    </tr>
                    `; }) : html`                    <tr>
                        <td colspan="7">
                            <div class="oi-empty">
                                <div class="oi-empty-icon"><i class="fas fa-inbox"></i></div>
                                <div class="oi-empty-title">No orders found</div>
                                <div class="oi-empty-sub">Try adjusting your filters or search query.</div>
                            </div>
                        </td>
                    </tr>
                    `}                </tbody>
            </table>
        </div>

        ${(method_exists(orders, 'links') && orders?.lastPage() > 1) ? html`        <div class="oi-pagination-wrap">
            <div class="oi-pagination-info">
                Showing ${orders?.firstItem()}–${orders?.lastItem()} of ${orders?.total()} orders
            </div>
            ${orders?.links('pagination::bootstrap-5')}
        </div>
        ` : ''}
    </div>
</div>

</div>
`,
    scripts: html``,
  };
}
