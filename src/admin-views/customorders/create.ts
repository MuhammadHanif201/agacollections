// Port of resources/views/adminside/customorders/create.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, old, csrf_field, number_format, empty, max, min, floatval, e, optional, foreach, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { customers, sellables, defaultShipping, shippingRateMap } = d;
  let pkCities = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
                                  'Peshawar','Quetta','Hyderabad','Sialkot','Gujranwala','Bahawalpur',
                                  'Sargodha','Abbottabad','Sukkur','Sheikhupura','Rahim Yar Khan','Gujrat',
                                  'Mardan','Kasur','Dera Ghazi Khan','Sahiwal','Larkana','Okara','Chiniot',
                                  'Jhang','Khanewal','Mianwali','Attock','Nowshera','Charsadda','Swat',
                                  'Muzaffarabad','Mirpur','Gilgit'];
  let oldCity = old('shipping_address.city');
  return {
    title: html`<title>New Custom Order — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Create a new manual order with bespoke products, pricing and customer details for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="create custom order, new order, manual order entry, bespoke clothing order, aga collections admin">
`,
    styles: html`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css">
<style>
:root {
    --c-bg:      #F0F2F5;
    --c-surface: #FFFFFF;
    --c-border:  #E5E7EB;
    --c-dark:    #111827;
    --c-muted:   #6B7280;
    --c-light:   #9CA3AF;
    --c-indigo:  #4F46E5;
    --c-indigo-d:#4338CA;
    --c-indigo-l:#EEF2FF;
    --c-green:   #059669;
    --c-green-l: #ECFDF5;
    --c-amber:   #D97706;
    --c-red:     #DC2626;
    --c-red-l:   #FEF2F2;
    --ih: 42px;
}

/* ── Shell ── */
.oc-wrap { background:var(--c-bg); min-height:100vh; padding-bottom:64px; }

/* ── Hero ── */
.oc-hero {
    background: linear-gradient(130deg,#0f0c29 0%,#1a1045 50%,#0f0c29 100%);
    padding:28px 32px 0; position:relative; overflow:hidden;
}
.oc-hero::after {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 55% 120% at 80% 60%,rgba(79,70,229,.25) 0%,transparent 60%);
    pointer-events:none;
}
.oc-hero-top {
    position:relative; z-index:1;
    display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;
    padding-bottom:24px;
}
.oc-hero-eyebrow { font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.35); margin-bottom:6px; }
.oc-hero-eyebrow a { color:rgba(255,255,255,.35); text-decoration:none; transition:color .15s; }
.oc-hero-eyebrow a:hover { color:rgba(255,255,255,.65); }
.oc-hero-title { font-size:26px; font-weight:900; color:#fff; letter-spacing:-.4px; margin:0 0 5px; line-height:1; }
.oc-hero-sub { font-size:12px; color:rgba(255,255,255,.38); margin:0; }
.oc-hero-actions { display:flex; gap:8px; padding-top:2px; }
.oc-btn-ghost { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); color:rgba(255,255,255,.8); padding:8px 16px; border-radius:9px; font-size:12px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px; transition:background .18s; white-space:nowrap; }
.oc-btn-ghost:hover { background:rgba(255,255,255,.16); color:#fff; text-decoration:none; }
.oc-btn-danger-ghost { background:rgba(220,38,38,.15); border:1px solid rgba(220,38,38,.3); color:#FCA5A5; padding:8px 16px; border-radius:9px; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px; cursor:pointer; transition:background .18s; white-space:nowrap; }
.oc-btn-danger-ghost:hover { background:rgba(220,38,38,.28); }

/* ── Progress tabs (flush to hero bottom) ── */
.oc-steps {
    position:relative; z-index:1;
    display:flex; border-top:1px solid rgba(255,255,255,.07);
}
.oc-step-tab {
    flex:1; padding:13px 16px; display:flex; align-items:center; gap:10px;
    border-right:1px solid rgba(255,255,255,.06);
    cursor:default; transition:background .15s;
}
.oc-step-tab:last-child { border-right:none; }
.oc-step-num {
    width:26px; height:26px; border-radius:8px; flex-shrink:0;
    background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15);
    color:rgba(255,255,255,.55); font-size:11px; font-weight:900;
    display:flex; align-items:center; justify-content:center; transition:all .2s;
}
.oc-step-tab.active .oc-step-num {
    background:linear-gradient(135deg,var(--c-indigo),#7C3AED);
    border-color:transparent; color:#fff;
    box-shadow:0 3px 10px rgba(79,70,229,.4);
}
.oc-step-text { display:flex; flex-direction:column; }
.oc-step-lbl  { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,.3); line-height:1; }
.oc-step-name { font-size:12px; font-weight:700; color:rgba(255,255,255,.55); margin-top:3px; }
.oc-step-tab.active .oc-step-lbl  { color:rgba(255,255,255,.5); }
.oc-step-tab.active .oc-step-name { color:#fff; }
@media(max-width:640px) { .oc-step-text { display:none; } }

/* ── Body ── */
.oc-body { padding:24px; }

/* ── Card ── */
.oc-card { background:var(--c-surface); border:1px solid var(--c-border); border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.05); margin-bottom:18px; }
.oc-card-hd { padding:13px 20px; border-bottom:1px solid var(--c-border); background:#FAFAFA; display:flex; align-items:center; justify-content:space-between; }
.oc-card-title { display:flex; align-items:center; gap:10px; }
.oc-card-icon { width:30px; height:30px; border-radius:9px; background:var(--c-indigo-l); color:var(--c-indigo); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
.oc-card-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--c-muted); }
.oc-card-hint { font-size:11px; color:var(--c-light); }
.oc-card-bd { padding:20px; }

/* ── Labels + inputs ── */
.oc-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--c-muted); display:block; margin-bottom:5px; }
.oc-inp { display:block; width:100%; height:var(--ih); border:1.5px solid var(--c-border); border-radius:9px; padding:0 12px; font-size:13px; color:var(--c-dark); background:#fff; outline:none; transition:border-color .15s; }
.oc-inp:focus { border-color:var(--c-indigo); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.oc-inp::placeholder { color:var(--c-light); }
.oc-inp[readonly] { background:#F9FAFB; color:var(--c-muted); cursor:not-allowed; }
select.oc-inp { cursor:pointer; }
textarea.oc-inp { height:auto; padding:10px 12px; resize:none; }
.oc-divider { height:1px; background:var(--c-border); margin:16px 0; }

/* ── Customer card: horizontal split ── */
.oc-cust-split {
    display:grid;
    grid-template-columns: 300px 1px 1fr;
    min-height:160px;
}
.oc-cust-left { padding:20px; }
.oc-cust-sep { background:var(--c-border); }
.oc-cust-right { padding:20px; }
.oc-cust-fields { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:14px; }
.oc-info-box { background:var(--c-indigo-l); border:1px solid rgba(79,70,229,.15); border-radius:9px; padding:10px 14px; font-size:12px; color:var(--c-indigo-d); display:flex; align-items:flex-start; gap:8px; }
@media(max-width:900px) {
    .oc-cust-split { grid-template-columns:1fr; }
    .oc-cust-sep { height:1px; width:auto; }
    .oc-cust-fields { grid-template-columns:1fr 1fr; }
}
@media(max-width:560px) { .oc-cust-fields { grid-template-columns:1fr; } }

/* ── Main grid ── */
.oc-main-grid { display:grid; grid-template-columns:1fr 360px; gap:18px; align-items:start; }
@media(max-width:1100px) { .oc-main-grid { grid-template-columns:1fr; } }
.oc-sticky { position:sticky; top:10px; }
@media(max-width:1100px) { .oc-sticky { position:static; } }

/* ── Product table ── */
.oc-table { width:100%; border-collapse:collapse; }
.oc-table thead th { background:#F9FAFB; padding:10px 16px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--c-muted); border-bottom:1px solid var(--c-border); white-space:nowrap; }
.oc-table tbody td { padding:12px 16px; border-top:1px solid #F3F4F6; vertical-align:middle; }
.oc-table tbody tr:hover td { background:#F8F9FF; }
.oc-table tbody tr:last-child td { border-bottom:none; }
.oc-thumb { width:44px; height:44px; border-radius:10px; object-fit:cover; border:1px solid var(--c-border); flex-shrink:0; }
.oc-item-name { font-size:13px; font-weight:700; color:var(--c-dark); line-height:1.2; }
.oc-item-sku  { font-size:11px; color:var(--c-light); margin-top:2px; }
.oc-qty-wrap { display:flex; align-items:center; justify-content:center; gap:6px; }
.oc-qty-inp { width:60px; height:34px; text-align:center; border:1.5px solid var(--c-border); border-radius:8px; font-size:13px; font-weight:700; color:var(--c-dark); outline:none; }
.oc-qty-inp:focus { border-color:var(--c-indigo); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.oc-btn-rm { width:30px; height:30px; border-radius:8px; border:1.5px solid rgba(220,38,38,.2); background:var(--c-red-l); color:var(--c-red); display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }
.oc-btn-rm:hover { background:var(--c-red); color:#fff; }
.oc-cart-foot { padding:12px 20px; border-top:1px solid var(--c-border); background:#FAFAFA; display:flex; align-items:center; justify-content:space-between; }
.oc-cart-badge { background:rgba(79,70,229,.12); color:var(--c-indigo-d); border:1px solid rgba(79,70,229,.18); border-radius:999px; padding:3px 10px; font-size:11px; font-weight:700; }
.oc-empty { text-align:center; padding:44px 20px; }
.oc-empty i { font-size:30px; color:var(--c-light); margin-bottom:10px; display:block; }
.oc-empty p { font-size:13px; color:var(--c-muted); margin:0; }

/* ── Totals panel ── */
.oc-totals-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.oc-totals-row .lbl { font-size:13px; color:var(--c-muted); }
.oc-totals-inp { width:126px; height:38px; border:1.5px solid var(--c-border); border-radius:9px; padding:0 10px; text-align:right; font-size:14px; font-weight:700; color:var(--c-dark); outline:none; background:#fff; }
.oc-totals-inp:focus { border-color:var(--c-indigo); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.oc-grand-strip { background:linear-gradient(135deg,var(--c-indigo),#7C3AED); border-radius:12px; padding:16px 18px; margin:10px 0 14px; display:flex; align-items:center; justify-content:space-between; }
.oc-grand-lbl { font-size:12px; font-weight:700; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:.07em; }
.oc-grand-val { font-size:24px; font-weight:900; color:#fff; letter-spacing:-.5px; }
.oc-cod-badge { display:flex; align-items:center; justify-content:center; gap:8px; background:#F9FAFB; border:1px solid var(--c-border); border-radius:9px; padding:10px; font-size:12px; font-weight:700; color:var(--c-muted); margin-bottom:14px; }
.oc-submit { width:100%; height:50px; background:linear-gradient(135deg,var(--c-indigo),#7C3AED); color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:opacity .15s,transform .15s; }
.oc-submit:hover { opacity:.9; transform:translateY(-1px); }
.oc-submit:active { transform:translateY(0); }

/* ── Alert ── */
.oc-alert-err { background:var(--c-red-l); border:1px solid rgba(220,38,38,.2); border-radius:10px; padding:12px 16px; margin-bottom:18px; }
.oc-alert-err strong { font-size:13px; font-weight:700; color:var(--c-red); display:flex; align-items:center; gap:6px; }
.oc-alert-err ul { margin:8px 0 0 16px; font-size:12px; color:var(--c-red); }

/* ── Select2 ── */
.select2-container .select2-selection--single { height:var(--ih) !important; border:1.5px solid var(--c-border) !important; border-radius:9px !important; }
.select2-container--default .select2-selection--single .select2-selection__rendered { line-height:calc(var(--ih) - 4px) !important; padding-left:12px !important; font-size:13px; font-weight:600; color:var(--c-dark); }
.select2-container--default .select2-selection--single .select2-selection__arrow { height:calc(var(--ih) - 4px) !important; }
.select2-dropdown { border:1.5px solid var(--c-border) !important; border-radius:12px !important; box-shadow:0 12px 40px rgba(0,0,0,.12) !important; overflow:hidden; }
.select2-search--dropdown .select2-search__field { border:1.5px solid var(--c-border) !important; border-radius:8px !important; padding:8px 10px !important; font-size:13px !important; }
.select2-results__option { padding:10px 12px !important; font-size:13px !important; }
.select2-container--default .select2-results__option--highlighted[aria-selected] { background:var(--c-indigo-l) !important; color:var(--c-indigo) !important; }
.s2-item { display:flex; align-items:center; gap:10px; }
.s2-item img { width:36px; height:36px; border-radius:8px; object-fit:cover; border:1px solid var(--c-border); flex-shrink:0; }
.s2-item-name { font-size:13px; font-weight:700; color:var(--c-dark); }

@media(max-width:768px) { .oc-hero { padding:18px 16px 0; } .oc-body { padding:12px; } }
</style>
`,
    content: html`<div class="content-wrapper oc-wrap">


<div class="oc-hero">
    <div class="oc-hero-top">
        <div>
            <div class="oc-hero-eyebrow">
                <a href="${route('admin.customorders.index')}">Custom Orders</a>
                &nbsp;/&nbsp; New Order
            </div>
            <h1 class="oc-hero-title">Create Custom Order</h1>
            <p class="oc-hero-sub">Phone, WhatsApp or walk-in — fill in the steps below.</p>
        </div>
        <div class="oc-hero-actions">
            <a href="${route('admin.customorders.index')}" class="oc-btn-ghost">
                <i class="fas fa-arrow-left"></i> Back
            </a>
            <button type="button" id="btnClearCart" class="oc-btn-danger-ghost">
                <i class="fas fa-trash-alt"></i> Clear Cart
            </button>
        </div>
    </div>

    
    <div class="oc-steps">
        <div class="oc-step-tab active">
            <div class="oc-step-num">1</div>
            <div class="oc-step-text">
                <span class="oc-step-lbl">Step 1</span>
                <span class="oc-step-name">Customer</span>
            </div>
        </div>
        <div class="oc-step-tab active">
            <div class="oc-step-num">2</div>
            <div class="oc-step-text">
                <span class="oc-step-lbl">Step 2</span>
                <span class="oc-step-name">Products</span>
            </div>
        </div>
        <div class="oc-step-tab active">
            <div class="oc-step-num">3</div>
            <div class="oc-step-text">
                <span class="oc-step-lbl">Step 3</span>
                <span class="oc-step-name">Delivery</span>
            </div>
        </div>
        <div class="oc-step-tab active">
            <div class="oc-step-num">4</div>
            <div class="oc-step-text">
                <span class="oc-step-lbl">Step 4</span>
                <span class="oc-step-name">Summary</span>
            </div>
        </div>
    </div>
</div>


<div class="oc-body">

    ${(errors?.any()) ? html`    <div class="oc-alert-err">
        <strong><i class="fas fa-exclamation-circle"></i> Please fix the following:</strong>
        <ul>${foreach(errors?.all(), (e, loop) => html`<li>${e}</li>`)}</ul>
    </div>
    ` : ''}
    <form method="POST" action="${route('admin.customorders.store')}" id="posForm">
    ${csrf_field()}
    
    <div class="oc-card">
        <div class="oc-card-hd">
            <div class="oc-card-title">
                <div class="oc-card-icon"><i class="fas fa-user-circle"></i></div>
                <span class="oc-card-label">Step 1 &mdash; Customer</span>
            </div>
            <span class="oc-card-hint">Select existing or enter new customer details</span>
        </div>
        <div class="oc-cust-split">

            
            <div class="oc-cust-left">
                <label class="oc-lbl">Existing Customer <span style="color:var(--c-light)">(optional)</span></label>
                <select id="customerSelect" name="customer_id" style="width:100%;">
                    <option value="">— New Customer —</option>
                    ${foreach(customers, (c, loop) => html`                    <option
                        value="${c?.id}"
                        ${old('customer_id') == c?.id ? 'selected' : ''}
                        data-name="${e(c?.full_name)}"
                        data-phone="${e(c?.phone ?? '')}"
                        data-email="${e(c?.email ?? '')}"
                        data-address="${e(c?.address ?? '')}"
                        data-city="${e(c?.city ?? '')}"
                        data-villa="${e(c?.villa_apartment ?? '')}"
                    >${c?.full_name} — ${c?.phone}</option>
                    `)}                </select>
                <div class="oc-info-box" style="margin-top:14px;">
                    <i class="fas fa-info-circle" style="margin-top:1px;flex-shrink:0;"></i>
                    Selecting an existing customer locks the fields and pre-fills the delivery address below.
                </div>
            </div>

            <div class="oc-cust-sep"></div>

            
            <div class="oc-cust-right">
                <div class="oc-cust-fields">
                    <div>
                        <label class="oc-lbl">Full Name <span style="color:var(--c-red)">*</span></label>
                        <input class="oc-inp" id="custName" name="customer[full_name]"
                            value="${old('customer.full_name')}" placeholder="Customer full name">
                    </div>
                    <div>
                        <label class="oc-lbl">Phone <span style="color:var(--c-red)">*</span></label>
                        <input class="oc-inp" id="custPhone" name="customer[phone]"
                            value="${old('customer.phone')}" placeholder="03XX XXXXXXX">
                    </div>
                    <div>
                        <label class="oc-lbl">Email <span style="color:var(--c-light)">(optional)</span></label>
                        <input class="oc-inp" id="custEmail" name="customer[email]"
                            value="${old('customer.email')}" placeholder="email@example.com">
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;padding-top:2px;">
                    <input type="checkbox" id="sameAsCustomer" checked
                        style="width:16px;height:16px;accent-color:var(--c-indigo);cursor:pointer;flex-shrink:0;">
                    <label for="sameAsCustomer" style="margin:0;font-size:13px;font-weight:600;color:var(--c-muted);cursor:pointer;">
                        Use customer name &amp; phone for delivery contact
                    </label>
                </div>
            </div>

        </div>
    </div>

    
    <div class="oc-main-grid">

        
        <div>

            
            <div class="oc-card">
                <div class="oc-card-hd">
                    <div class="oc-card-title">
                        <div class="oc-card-icon"><i class="fas fa-barcode"></i></div>
                        <span class="oc-card-label">Step 2 &mdash; Add Products</span>
                    </div>
                    <span class="oc-card-hint">Same item again = qty +1</span>
                </div>
                <div class="oc-card-bd">
                    <label class="oc-lbl">Search by name or SKU</label>
                    <select id="productSearch" style="width:100%;">
                        <option value="">Type to search products…</option>
                        ${foreach(sellables, (s, loop) => html`                        <option
                            value="${s?.type}:${s?.id}"
                            data-type="${e(s?.type)}"
                            data-id="${e(s?.id)}"
                            data-name="${e(s?.name)}"
                            data-sku="${e(s?.sku)}"
                            data-unit="${e(s?.price)}"
                            data-img="${e(s?.image_url)}"
                            data-label="${e(s?.label)}"
                        >${s?.label}</option>
                        `)}                    </select>
                </div>
            </div>

            
            <div class="oc-card">
                <div class="oc-card-hd">
                    <div class="oc-card-title">
                        <div class="oc-card-icon"><i class="fas fa-shopping-cart"></i></div>
                        <span class="oc-card-label">Cart</span>
                    </div>
                    <span class="oc-cart-badge" id="cartCount">0 items</span>
                </div>
                <div class="table-responsive">
                    <table class="oc-table" id="cartTable">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style="width:110px;text-align:right;">Unit Price</th>
                                <th style="width:110px;text-align:center;">Qty</th>
                                <th style="width:120px;text-align:right;">Line Total</th>
                                <th style="width:44px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr id="emptyCartRow">
                                <td colspan="5">
                                    <div class="oc-empty">
                                        <i class="fas fa-cart-plus"></i>
                                        <p>Cart is empty — search a product above to add.</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="oc-cart-foot">
                    <span style="font-size:12px;color:var(--c-muted);">
                        <i class="fas fa-info-circle" style="color:var(--c-indigo);margin-right:4px;"></i>Totals update instantly
                    </span>
                    <span style="font-size:13px;color:var(--c-muted);">Subtotal: <strong id="subTotalLeft" style="color:var(--c-dark);">PKR 0</strong></span>
                </div>
            </div>

        </div>

        
        <div class="oc-sticky">

            
            <div class="oc-card">
                <div class="oc-card-hd">
                    <div class="oc-card-title">
                        <div class="oc-card-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <span class="oc-card-label">Step 3 &mdash; Delivery</span>
                    </div>
                </div>
                <div class="oc-card-bd">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="oc-lbl">Receiver Name <span style="color:var(--c-red)">*</span></label>
                            <input class="oc-inp" id="shipName" name="shipping_address[full_name]"
                                value="${old('shipping_address.full_name')}" placeholder="Receiver name">
                        </div>
                        <div class="col-12">
                            <label class="oc-lbl">Receiver Phone <span style="color:var(--c-red)">*</span></label>
                            <input class="oc-inp" id="shipPhone" name="shipping_address[phone]"
                                value="${old('shipping_address.phone')}" placeholder="03XX XXXXXXX">
                        </div>
                        <div class="col-12">
                            <label class="oc-lbl">Street Address <span style="color:var(--c-red)">*</span></label>
                            <input class="oc-inp" id="shipAddress" name="shipping_address[address]"
                                value="${old('shipping_address.address')}" placeholder="Street, block, area, landmark…">
                        </div>
                        <div class="col-7">
                            <label class="oc-lbl">City</label>
                                                        <select class="oc-inp" id="shipCity" name="shipping_address[city]">
                                <option value="">— Select City —</option>
                                ${foreach(pkCities, (city, loop) => html`                                <option value="${city}" ${oldCity === city ? 'selected' : ''}>${city}</option>
                                `)}                            </select>
                        </div>
                        <div class="col-5">
                            <label class="oc-lbl">Flat / Area</label>
                            <input class="oc-inp" id="shipVilla" name="shipping_address[villa_apartment]"
                                value="${old('shipping_address.villa_apartment')}" placeholder="Flat / area">
                        </div>
                    </div>
                </div>
            </div>

            
            <div class="oc-card">
                <div class="oc-card-hd">
                    <div class="oc-card-title">
                        <div class="oc-card-icon"><i class="fas fa-receipt"></i></div>
                        <span class="oc-card-label">Step 4 &mdash; Summary</span>
                    </div>
                </div>
                <div class="oc-card-bd">

                    <div class="oc-totals-row">
                        <span class="lbl">Subtotal</span>
                        <span id="subTotal" style="font-size:14px;font-weight:700;color:var(--c-dark);">PKR 0.00</span>
                    </div>
                    <div class="oc-totals-row">
                        <label class="lbl" for="shipping">Shipping (PKR)</label>
                        <input name="shipping" id="shipping" class="oc-totals-inp"
                            value="${old('shipping', number_format(defaultShipping, 2, '.', ''))}"
                            inputmode="decimal" placeholder="0.00">
                    </div>
                    <div class="oc-totals-row">
                        <label class="lbl" for="discount">Discount (PKR)</label>
                        <input name="discount" id="discount" class="oc-totals-inp"
                            value="${old('discount', '0.00')}"
                            inputmode="decimal" placeholder="0.00">
                    </div>

                    <div class="oc-grand-strip">
                        <span class="oc-grand-lbl">Grand Total</span>
                        <span class="oc-grand-val" id="grandTotal">PKR 0.00</span>
                    </div>

                    <div class="oc-cod-badge">
                        <i class="fas fa-money-bill-wave" style="color:var(--c-green);"></i>
                        Cash on Delivery
                    </div>
                    <input type="hidden" name="payment_method" value="cod">

                    <div style="margin-bottom:14px;">
                        <label class="oc-lbl">Order Notes <span style="color:var(--c-light);">(optional)</span></label>
                        <textarea name="order_notes" class="oc-inp" rows="2"
                            placeholder="Any special instructions…">${old('order_notes')}</textarea>
                    </div>

                    <button type="submit" class="oc-submit" id="btnSubmit">
                        <i class="fas fa-check-circle"></i> Create Order
                    </button>

                </div>
            </div>

        </div>
    </div>

    </form>
</div>
</div>
`,
    scripts: html`<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<script>
(function () {
    'use strict';

    const shippingRateMap = ${bladeJson(shippingRateMap ?? [])};
    const defaultShipping = parseFloat(${bladeJson(floatval(defaultShipping))}) || 0;

    const fmt = n => parseFloat(n || 0).toFixed(2);
    const r2  = n => Math.round((n + Number.EPSILON) * 100) / 100;
    const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };

    const cart = new Map();
    let idx = 0;

    function recalc() {
        let sub = 0;
        cart.forEach(it => {
            const line = (parseFloat(it.unit)||0) * (parseInt(it.qty)||1);
            sub += line;
            if (it.row) $(it.row).find('.line-total').text('PKR ' + fmt(line));
        });
        sub = r2(sub);
        $('#subTotal, #subTotalLeft').text('PKR ' + fmt(sub));
        const ship = parseFloat($('#shipping').val()) || 0;
        let  disc  = Math.min(parseFloat($('#discount').val()) || 0, sub + ship);
        if ((parseFloat($('#discount').val())||0) !== disc) $('#discount').val(fmt(disc));
        $('#grandTotal').text('PKR ' + fmt(Math.max(0, sub + ship - disc)));
    }

    function badge() {
        $('#cartCount').text(cart.size + ' item' + (cart.size !== 1 ? 's' : ''));
        $('#emptyCartRow').toggle(cart.size === 0);
    }

    function fmtProd(state) {
        if (!state.id) return state.text;
        const el = state.element;
        return \`<div class="s2-item">
            <img src="\${esc($(el).data('img')||'')}" alt="" onerror="this.style.display='none'">
            <div><div class="s2-item-name">\${esc($(el).data('label')||state.text)}</div></div>
        </div>\`;
    }

    $('#productSearch').select2({
        width:'100%', allowClear:true, placeholder:'Type to search products / variants…',
        templateResult: fmtProd,
        templateSelection: s => s.id ? ($(s.element).data('label')||s.text) : s.text,
        escapeMarkup: m => m,
    });
    $('#customerSelect').select2({ width:'100%', allowClear:true, placeholder:'Search existing customer…' });

    $('#shipCity').on('change', function () {
        const city = $(this).val() || '';
        $('#shipping').val(fmt(city && shippingRateMap[city] !== undefined ? parseFloat(shippingRateMap[city]) : defaultShipping));
        recalc();
    });
    $('#shipping, #discount').on('input change', recalc);

    function syncContact() {
        if (!$('#sameAsCustomer').is(':checked')) return;
        $('#shipName').val($('#custName').val()||'');
        $('#shipPhone').val($('#custPhone').val()||'');
    }
    $('#sameAsCustomer').on('change', syncContact);
    $('#custName, #custPhone').on('input', syncContact);

    $('#customerSelect').on('change', function () {
        const sel = $(this).find(':selected');
        if (!this.value) {
            $('#custName, #custPhone, #custEmail').val('').prop('readonly', false);
            syncContact(); return;
        }
        $('#custName').val(sel.data('name')||'');
        $('#custPhone').val(sel.data('phone')||'');
        $('#custEmail').val(sel.data('email')||'');
        $('#custName, #custPhone, #custEmail').prop('readonly', true);
        $('#shipAddress').val(sel.data('address')||'');
        $('#shipVilla').val(sel.data('villa')||'');
        const city = sel.data('city')||'';
        if (city) { $('#shipCity').val(city).trigger('change'); }
        syncContact();
    });

    function addRow(item) {
        const html = \`
        <tr class="cart-row" data-key="\${esc(item.key)}">
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="\${esc(item.img)}" class="oc-thumb" alt="" onerror="this.style.display='none'">
                    <div>
                        <div class="oc-item-name">\${esc(item.name)}</div>
                        \${item.sku ? \`<div class="oc-item-sku">SKU: \${esc(item.sku)}</div>\` : ''}
                    </div>
                </div>
                <input type="hidden" name="items[\${item.idx}][type]" value="\${esc(item.type)}">
                <input type="hidden" name="items[\${item.idx}][id]"   value="\${esc(item.id)}">
            </td>
            <td style="text-align:right;font-size:13px;font-weight:700;color:var(--c-dark);">PKR \${fmt(item.unit)}</td>
            <td>
                <div class="oc-qty-wrap">
                    <input type="number" min="1" value="\${item.qty}" class="oc-qty-inp"
                        name="items[\${item.idx}][qty]" data-key="\${esc(item.key)}">
                </div>
            </td>
            <td style="text-align:right;font-size:13px;font-weight:700;color:var(--c-dark);" class="line-total">PKR \${fmt(item.unit * item.qty)}</td>
            <td style="text-align:center;">
                <button type="button" class="oc-btn-rm btnRemove" data-key="\${esc(item.key)}">
                    <i class="fas fa-times" style="font-size:10px;"></i>
                </button>
            </td>
        </tr>\`;
        $('#emptyCartRow').before(html);
        item.row = $(\`#cartTable tr[data-key="\${CSS.escape(item.key)}"]\`)[0];
        cart.set(item.key, item);
    }

    $('#productSearch').on('change', function () {
        const sel  = $(this).find(':selected');
        const type = sel.data('type');
        const id   = sel.data('id');
        if (!type || !id) { $(this).val('').trigger('change'); return; }
        const key  = \`\${type}:\${id}\`;
        if (cart.has(key)) {
            const it = cart.get(key); it.qty++;
            if (it.row) $(it.row).find('.oc-qty-inp').val(it.qty);
            cart.set(key, it);
        } else {
            const it = { key, type, id, qty:1, idx:idx++,
                unit:  parseFloat(sel.data('unit')) || 0,
                name:  sel.data('name') || 'Item',
                sku:   sel.data('sku')  || '',
                img:   sel.data('img')  || '' };
            cart.set(key, it);
            addRow(it);
        }
        badge(); recalc();
        $(this).val('').trigger('change');
    });

    $(document).on('input change', '.oc-qty-inp', function () {
        const key = $(this).data('key');
        const qty = Math.max(1, parseInt($(this).val()) || 1);
        $(this).val(qty);
        if (cart.has(key)) { cart.get(key).qty = qty; recalc(); }
    });

    $(document).on('click', '.btnRemove', function () {
        const key = $(this).data('key');
        cart.delete(key);
        $(\`#cartTable tr[data-key="\${CSS.escape(key)}"]\`).remove();
        badge(); recalc();
    });

    $('#btnClearCart').on('click', function () {
        if (!cart.size) return;
        if (confirm('Clear all items from cart?')) {
            cart.clear(); $('.cart-row').remove(); badge(); recalc();
        }
    });

    $('#posForm').on('submit', function (e) {
        if (!cart.size) {
            e.preventDefault();
            alert('Please add at least one product to the cart.');
            return false;
        }
        if (!$('#custName').val().trim() || !$('#custPhone').val().trim()) {
            e.preventDefault();
            alert('Customer name and phone are required.');
            return false;
        }
        const btn = document.getElementById('btnSubmit');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span> Creating…';
    });

    badge(); recalc();
    setTimeout(() => $('#productSearch').select2('focus'), 120);
})();
</script>
`,
  };
}
