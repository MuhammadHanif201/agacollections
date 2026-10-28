// Port of resources/views/adminside/customorders/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, session, date, collect, number_format, count, empty, strtoupper, strtolower, ucfirst, explode, max, min, floatval, optional, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { orders, q, c, st, initials, w } = d;
  let totalOrders = orders?.total();
  let pendingCount = d.pendingCount;
  let todayCount = d.todayCount;
  let completedCount = d.completedCount;
  return {
    title: html`<title>Custom Orders — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Create and manage manual custom orders on behalf of clients for ${optional(companySetting)?.name ?? 'AGA Collections'} — bespoke Pakistani clothing orders.">
<meta name="keywords" content="custom orders, manual orders, bespoke clothing, tailored orders, aga collections custom, ecommerce admin">
`,
    styles: html`<style>
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

/* ── Shell ── */
.co-wrap { background: var(--c-bg); min-height: 100vh; padding-bottom: 60px; }

/* ── Hero ── */
.co-hero {
    background: linear-gradient(130deg, #0f0c29 0%, #1a1045 50%, #0f0c29 100%);
    padding: 32px 36px 0;
    position: relative; overflow: hidden;
}
.co-hero::after {
    content:''; position:absolute; inset:0;
    background: radial-gradient(ellipse 55% 120% at 80% 60%, rgba(79,70,229,.25) 0%, transparent 60%);
    pointer-events:none;
}
.co-hero-top { position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; flex-wrap:wrap; padding-bottom:28px; }
.co-hero-eyebrow { font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.35); margin-bottom:7px; }
.co-hero-title { font-size:28px; font-weight:900; color:#fff; letter-spacing:-.5px; margin:0 0 6px; line-height:1; }
.co-hero-sub { font-size:13px; color:rgba(255,255,255,.38); margin:0; }
.co-btn-primary {
    background: linear-gradient(135deg, var(--c-indigo), #7C3AED);
    color: #fff; border:none; border-radius:10px; padding:10px 20px;
    font-size:13px; font-weight:700; text-decoration:none;
    display:inline-flex; align-items:center; gap:7px;
    box-shadow: 0 4px 14px rgba(79,70,229,.35);
    transition: opacity .15s, transform .15s; white-space:nowrap;
}
.co-btn-primary:hover { opacity:.88; transform:translateY(-1px); color:#fff; text-decoration:none; }

/* ── Stat bar (bottom of hero) ── */
.co-stat-bar {
    position:relative; z-index:1;
    display:grid; grid-template-columns: repeat(4, 1fr);
    gap:0; border-top:1px solid rgba(255,255,255,.08);
}
.co-stat-cell {
    padding: 18px 24px; text-align:left;
    border-right:1px solid rgba(255,255,255,.06);
    transition: background .15s;
}
.co-stat-cell:last-child { border-right:none; }
.co-stat-cell:hover { background:rgba(255,255,255,.04); }
.co-stat-num { font-size:26px; font-weight:900; color:#fff; line-height:1; letter-spacing:-.5px; }
.co-stat-lbl { font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.35); margin-top:4px; }
.co-stat-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; vertical-align:middle; }

/* ── Body ── */
.co-body { padding:28px 28px 0; }

/* ── Search bar ── */
.co-search-wrap { background:var(--c-surface); border:1px solid var(--c-border); border-radius:14px; padding:16px 20px; margin-bottom:22px; display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; box-shadow:0 1px 3px rgba(0,0,0,.04); }
.co-search-group { flex:1; min-width:200px; }
.co-search-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--c-muted); display:block; margin-bottom:5px; }
.co-search-input { width:100%; height:40px; border:1.5px solid var(--c-border); border-radius:9px; padding:0 14px 0 38px; font-size:13px; color:var(--c-dark); background:#fff; outline:none; transition:border-color .15s; }
.co-search-input:focus { border-color:var(--c-indigo); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.co-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--c-light); font-size:12px; pointer-events:none; }
.co-search-rel { position:relative; }
.co-btn-search { height:40px; padding:0 20px; background:var(--c-indigo); color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:opacity .15s; white-space:nowrap; }
.co-btn-search:hover { opacity:.86; }
.co-btn-reset { height:40px; padding:0 14px; border:1.5px solid var(--c-border); background:#fff; border-radius:9px; font-size:13px; color:var(--c-muted); font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; text-decoration:none; transition:border-color .15s; }
.co-btn-reset:hover { border-color:var(--c-red); color:var(--c-red); text-decoration:none; }

/* ── Results header ── */
.co-results-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
.co-results-title { font-size:13px; font-weight:700; color:var(--c-dark); }
.co-results-count { font-size:12px; color:var(--c-muted); }
.co-query-tag { background:var(--c-indigo-l); color:var(--c-indigo); border:1px solid rgba(79,70,229,.18); border-radius:999px; padding:3px 10px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:6px; }

/* ── Card grid ── */
.co-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; }
@media(max-width:1200px) { .co-grid { grid-template-columns: repeat(2, 1fr); } }
@media(max-width:700px)  { .co-grid { grid-template-columns: 1fr; } }

/* ── Order card ── */
.co-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    display: flex;
    flex-direction: column;
    transition: box-shadow .18s, transform .18s;
}
.co-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.10); transform: translateY(-2px); }

/* card top accent based on status */
.co-card-accent { height:3px; width:100%; }
.co-card-accent--pending    { background: linear-gradient(90deg, #F59E0B, #FCD34D); }
.co-card-accent--processing { background: linear-gradient(90deg, var(--c-indigo), #818CF8); }
.co-card-accent--shipped    { background: linear-gradient(90deg, var(--c-blue), #FF4F1F); }
.co-card-accent--completed  { background: linear-gradient(90deg, var(--c-green), #34D399); }
.co-card-accent--cancelled  { background: linear-gradient(90deg, var(--c-red), #F87171); }
.co-card-accent--default    { background: linear-gradient(90deg, var(--c-light), #D1D5DB); }

.co-card-head {
    display:flex; align-items:center; justify-content:space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #F3F4F6;
}
.co-id { display:inline-flex; align-items:center; gap:5px; background:var(--c-indigo-l); border:1px solid rgba(79,70,229,.15); border-radius:8px; padding:4px 10px; font-size:13px; font-weight:800; color:var(--c-indigo); }
.co-id i { font-size:9px; opacity:.55; }

.co-status { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
.co-status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.co-status--pending    { background:rgba(217,119,6,.12);   color:var(--c-amber); }
.co-status--pending    .co-status-dot { background:var(--c-amber); }
.co-status--processing { background:rgba(79,70,229,.10);   color:#4338CA; }
.co-status--processing .co-status-dot { background:var(--c-indigo); }
.co-status--shipped    { background:rgba(37,99,235,.10);   color:var(--c-blue); }
.co-status--shipped    .co-status-dot { background:var(--c-blue); }
.co-status--completed  { background:rgba(5,150,105,.10);   color:var(--c-green); }
.co-status--completed  .co-status-dot { background:var(--c-green); }
.co-status--cancelled  { background:rgba(220,38,38,.08);   color:var(--c-red); }
.co-status--cancelled  .co-status-dot { background:var(--c-red); }

.co-card-body { padding:14px 16px; flex:1; display:flex; flex-direction:column; gap:10px; }

/* customer row */
.co-cust-row { display:flex; align-items:center; gap:10px; }
.co-avatar {
    width:40px; height:40px; border-radius:12px; flex-shrink:0;
    background: linear-gradient(135deg, #4F46E5, #7C3AED);
    display:flex; align-items:center; justify-content:center;
    font-size:14px; font-weight:800; color:#fff; letter-spacing:-.3px;
}
.co-cust-name  { font-size:14px; font-weight:800; color:var(--c-dark); line-height:1.2; }
.co-cust-phone { font-size:12px; color:var(--c-muted); margin-top:2px; display:flex; align-items:center; gap:4px; }

/* info pills row */
.co-pills { display:flex; gap:6px; flex-wrap:wrap; }
.co-pill { display:inline-flex; align-items:center; gap:4px; background:#F9FAFB; border:1px solid var(--c-border); border-radius:7px; padding:4px 9px; font-size:11px; font-weight:600; color:var(--c-muted); white-space:nowrap; }
.co-pill i { font-size:9px; color:var(--c-indigo); }

/* total row */
.co-total-row { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px dashed #E5E7EB; margin-top:auto; }
.co-total-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--c-light); }
.co-total-val { font-size:20px; font-weight:900; color:var(--c-dark); letter-spacing:-.5px; }
.co-total-discount { font-size:10px; color:var(--c-green); font-weight:700; margin-top:1px; text-align:right; }

/* date chip */
.co-date-chip { font-size:11px; color:var(--c-light); font-weight:600; display:flex; align-items:center; gap:4px; }

/* card footer */
.co-card-foot {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 16px; border-top:1px solid #F3F4F6; background:#FAFAFA;
    gap:8px;
}
.co-btn-view { flex:1; height:34px; background:var(--c-indigo); color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:5px; transition:opacity .15s; }
.co-btn-view:hover { opacity:.85; color:#fff; text-decoration:none; }
.co-btn-edit { flex:1; height:34px; background:var(--c-green-l); color:var(--c-green); border:1px solid rgba(5,150,105,.2); border-radius:8px; font-size:12px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:5px; transition:all .15s; }
.co-btn-edit:hover { background:var(--c-green); color:#fff; text-decoration:none; }

/* ── Empty ── */
.co-empty-wrap { background:var(--c-surface); border:1px solid var(--c-border); border-radius:16px; text-align:center; padding:64px 24px; }
.co-empty-icon { width:64px; height:64px; background:var(--c-indigo-l); border-radius:18px; display:inline-flex; align-items:center; justify-content:center; font-size:24px; color:var(--c-indigo); margin-bottom:16px; }
.co-empty-title { font-size:16px; font-weight:800; color:var(--c-dark); margin-bottom:6px; }
.co-empty-sub   { font-size:13px; color:var(--c-muted); margin-bottom:20px; }

/* ── Pagination ── */
.co-pag-wrap { margin-top:24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding-bottom:8px; }
.co-pag-info { font-size:12px; color:var(--c-muted); }
.pagination .page-item.active .page-link { background:var(--c-indigo)!important; border-color:var(--c-indigo)!important; color:#fff!important; }
.pagination .page-link { color:var(--c-dark)!important; font-size:13px; border-color:var(--c-border)!important; border-radius:8px!important; }
.pagination .page-link:hover { background:var(--c-indigo-l)!important; color:var(--c-indigo)!important; }

/* ── Alert ── */
.co-alert-success { background:var(--c-green-l); border:1px solid rgba(5,150,105,.2); border-radius:10px; padding:12px 18px; font-size:13px; font-weight:600; color:var(--c-green); display:flex; align-items:center; gap:8px; margin-bottom:18px; }

@media(max-width:768px) { .co-hero { padding:20px 16px 0; } .co-body { padding:14px; } .co-stat-bar { grid-template-columns: repeat(2,1fr); } }
</style>
`,
    content: html`
<div class="content-wrapper co-wrap">


<div class="co-hero">

    <div class="co-hero-top">
        <div>
            <div class="co-hero-eyebrow">${companySetting?.name ?? 'AGA Collections'} &mdash; Admin Panel</div>
            <h1 class="co-hero-title">Custom Orders</h1>
            <p class="co-hero-sub">Phone, WhatsApp &amp; walk-in orders created manually.</p>
        </div>
        <div style="padding-top:4px;">
            <a href="${route('admin.customorders.create')}" class="co-btn-primary">
                <i class="fas fa-plus"></i> New Order
            </a>
        </div>
    </div>

    
    <div class="co-stat-bar">
        <div class="co-stat-cell">
            <div class="co-stat-num">${totalOrders}</div>
            <div class="co-stat-lbl"><span class="co-stat-dot" style="background:#818CF8;"></span>Total Orders</div>
        </div>
        <div class="co-stat-cell">
            <div class="co-stat-num" style="color:#FBBF24;">${pendingCount}</div>
            <div class="co-stat-lbl"><span class="co-stat-dot" style="background:#FBBF24;"></span>Pending</div>
        </div>
        <div class="co-stat-cell">
            <div class="co-stat-num" style="color:#34D399;">${todayCount}</div>
            <div class="co-stat-lbl"><span class="co-stat-dot" style="background:#34D399;"></span>Today</div>
        </div>
        <div class="co-stat-cell">
            <div class="co-stat-num" style="color:#FF4F1F;">${completedCount}</div>
            <div class="co-stat-lbl"><span class="co-stat-dot" style="background:#FF4F1F;"></span>Completed</div>
        </div>
    </div>

</div>


<div class="co-body">

    ${(session('success')) ? html`    <div class="co-alert-success">
        <i class="fas fa-check-circle"></i> ${session('success')}
    </div>
    ` : ''}
    
    <form method="GET" action="${route('admin.customorders.index')}">
    <div class="co-search-wrap">
        <div class="co-search-group">
            <label class="co-search-label">Search orders</label>
            <div class="co-search-rel">
                <i class="fas fa-search co-search-icon"></i>
                <input type="text" name="q" class="co-search-input"
                    placeholder="Order ID, customer name or phone…"
                    value="${q ?? ''}">
            </div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-end;padding-bottom:1px;">
            <button type="submit" class="co-btn-search">
                <i class="fas fa-search"></i> Search
            </button>
            <a href="${route('admin.customorders.index')}" class="co-btn-reset">
                <i class="fas fa-redo"></i> Reset
            </a>
        </div>
    </div>
    </form>

    
    <div class="co-results-head">
        <div>
            <span class="co-results-title">
                ${q ? 'Search Results' : 'All Orders'}
            </span>
            ${(q) ? html`            <span class="co-query-tag" style="margin-left:8px;">
                <i class="fas fa-search" style="font-size:9px;"></i>
                &ldquo;${q}&rdquo;
                <a href="${route('admin.customorders.index')}" style="color:inherit;text-decoration:none;margin-left:2px;opacity:.6;">&times;</a>
            </span>
            ` : ''}        </div>
        <span class="co-results-count">${orders?.total()} order${orders?.total() !== 1 ? 's' : ''} found</span>
    </div>

    
    ${(orders?.count()) ? html`    <div class="co-grid">
        ${foreach(orders, (o, loop) => { let c = o?.customer;
let st = strtolower(o?.status ?? 'pending');
let initials = collect(explode(' ', o?.contact_name  ||  'U'))
                        ?.map((w) => strtoupper(w?.[0] ?? ''))
                        ?.take(2)?.implode('');
 return html`                <div class="co-card">

            
            <div class="co-card-accent co-card-accent--${st}"></div>

            
            <div class="co-card-head">
                <span class="co-id">
                    <i class="fas fa-hashtag"></i>${o?.id}
                </span>
                <span class="co-status co-status--${st}">
                    <span class="co-status-dot"></span>
                    ${ucfirst(st)}
                </span>
            </div>

            
            <div class="co-card-body">

                
                <div class="co-cust-row">
                    <div class="co-avatar">${initials  ||  'U'}</div>
                    <div>
                        <div class="co-cust-name">${o?.contact_name  ||  'Unknown'}</div>
                        ${(o?.contact_phone) ? html`                        <div class="co-cust-phone">
                            <i class="fas fa-phone-alt" style="font-size:9px;opacity:.5;"></i>
                            ${o?.contact_phone}
                        </div>
                        ` : ''}                    </div>
                </div>

                
                <div class="co-pills">
                    ${(o?.shipping_city) ? html`                    <span class="co-pill">
                        <i class="fas fa-map-marker-alt"></i>
                        ${o?.shipping_city}
                    </span>
                    ` : ''}                    ${(o?.items_count ?? o?.orderItems?.count()) ? html`                    <span class="co-pill">
                        <i class="fas fa-box"></i>
                        ${o?.items_count ?? o?.orderItems?.count()} item${(o?.items_count ?? o?.orderItems?.count()) != 1 ? 's' : ''}
                    </span>
                    ` : ''}                    <span class="co-pill">
                        <i class="fas fa-calendar-alt"></i>
                        ${o?.created_at?.format('d M Y')}
                    </span>
                </div>

                
                <div class="co-total-row">
                    <div>
                        <div class="co-total-lbl">Grand Total</div>
                        ${(o?.discount > 0) ? html`                        <div style="font-size:10px;color:var(--c-green);font-weight:700;margin-top:1px;">
                            <i class="fas fa-tag" style="font-size:9px;"></i> &minus;PKR ${number_format(o?.discount, 0)}
                        </div>
                        ` : ''}                    </div>
                    <div style="text-align:right;">
                        <div class="co-total-val">PKR ${number_format(floatval(o?.total), 0)}</div>
                        ${(o?.shipping > 0) ? html`                        <div style="font-size:10px;color:var(--c-muted);margin-top:1px;">
                            incl. PKR ${number_format(o?.shipping, 0)} shipping
                        </div>
                        ` : ''}                    </div>
                </div>

            </div>

            
            <div class="co-card-foot">
                <a href="${route('admin.orders.show', o?.id)}" class="co-btn-view">
                    <i class="fas fa-eye" style="font-size:10px;"></i> View
                </a>
                ${(o?.status === 'pending') ? html`                <a href="${route('admin.customorders.edit', o?.id)}" class="co-btn-edit">
                    <i class="fas fa-edit" style="font-size:10px;"></i> Edit
                </a>
                ` : ''}            </div>

        </div>
        `; })}    </div>

    
    ${(orders?.hasPages()) ? html`    <div class="co-pag-wrap">
        <div class="co-pag-info">
            Showing ${orders?.firstItem()}–${orders?.lastItem()} of ${orders?.total()} orders
        </div>
        ${orders?.appends({'q' : q})?.links('pagination::bootstrap-5')}
    </div>
    ` : ''}
    ` : html`    
    <div class="co-empty-wrap">
        <div class="co-empty-icon"><i class="fas fa-receipt"></i></div>
        <div class="co-empty-title">
            ${q ? 'No results found' : 'No custom orders yet'}
        </div>
        <div class="co-empty-sub">
            ${q
                ? `No orders match \"${q}\". Try a different name, phone or ID.`
                : 'Create your first custom order for a phone or WhatsApp customer.'}
        </div>
        ${(!q) ? html`        <a href="${route('admin.customorders.create')}" class="co-btn-primary" style="margin:0 auto;width:fit-content;">
            <i class="fas fa-plus"></i> Create Order
        </a>
        ` : ''}    </div>
    `}
</div>
</div>
`,
    scripts: html``,
  };
}
