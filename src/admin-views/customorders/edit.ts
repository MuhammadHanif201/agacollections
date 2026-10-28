// Port of resources/views/adminside/customorders/edit.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, old, session, csrf_field, collect, number_format, empty, strtoupper, explode, max, min, floatval, e, optional, foreach, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { order, w, sellables, existingItems, fallbackImg, shippingRateMap, defaultShipping } = d;
  let customer = order?.customer;
  let initials = collect(explode(' ', customer?.full_name ?? 'U'))
                  ?.map((w) => strtoupper(w?.[0] ?? ''))?.take(2)?.implode('');
  let pkCities = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan',
                                  'Peshawar','Quetta','Hyderabad','Sialkot','Gujranwala','Bahawalpur',
                                  'Sargodha','Abbottabad','Sukkur','Sheikhupura','Rahim Yar Khan','Gujrat',
                                  'Mardan','Kasur','Dera Ghazi Khan','Sahiwal','Larkana','Okara','Chiniot',
                                  'Jhang','Khanewal','Mianwali','Attock','Nowshera','Charsadda','Swat',
                                  'Muzaffarabad','Mirpur','Gilgit'];
  let currentCity = old('shipping_address.city', order?.shipping_city ?? '');
  return {
    title: html`<title>Edit Order #${order?.id} — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Edit items, pricing, customer details and status for custom order #${order?.id} at ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="edit order, update order, modify custom order, order management, aga collections admin">
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
.oe-wrap { background:var(--c-bg); min-height:100vh; padding-bottom:64px; }

/* ── Hero ── */
.oe-hero {
    background:linear-gradient(130deg,#0f0c29 0%,#1a1045 50%,#0f0c29 100%);
    padding:28px 32px 0; position:relative; overflow:hidden;
}
.oe-hero::after {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 55% 120% at 80% 60%,rgba(79,70,229,.25) 0%,transparent 60%);
    pointer-events:none;
}
.oe-hero-top {
    position:relative; z-index:1;
    display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap;
    padding-bottom:24px;
}
.oe-hero-eyebrow { font-size:10px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.35); margin-bottom:6px; }
.oe-hero-eyebrow a { color:rgba(255,255,255,.35); text-decoration:none; transition:color .15s; }
.oe-hero-eyebrow a:hover { color:rgba(255,255,255,.65); }
.oe-hero-title { font-size:26px; font-weight:900; color:#fff; letter-spacing:-.4px; margin:0 0 5px; line-height:1; }
.oe-hero-title span { color:rgba(167,139,250,1); }
.oe-hero-sub { font-size:12px; color:rgba(255,255,255,.38); margin:0; }
.oe-hero-actions { display:flex; gap:8px; padding-top:2px; }
.oe-btn-ghost { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15); color:rgba(255,255,255,.8); padding:8px 16px; border-radius:9px; font-size:12px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:6px; transition:background .18s; white-space:nowrap; }
.oe-btn-ghost:hover { background:rgba(255,255,255,.16); color:#fff; text-decoration:none; }
.oe-btn-danger-ghost { background:rgba(220,38,38,.15); border:1px solid rgba(220,38,38,.3); color:#FCA5A5; padding:8px 16px; border-radius:9px; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:6px; cursor:pointer; transition:background .18s; white-space:nowrap; }
.oe-btn-danger-ghost:hover { background:rgba(220,38,38,.28); }

/* ── Customer info strip (bottom of hero) ── */
.oe-cust-strip {
    position:relative; z-index:1;
    display:flex; align-items:center; gap:0;
    border-top:1px solid rgba(255,255,255,.07);
    flex-wrap:wrap;
}
.oe-cust-cell {
    padding:16px 24px; border-right:1px solid rgba(255,255,255,.06);
    display:flex; align-items:center; gap:14px; flex:1; min-width:0;
}
.oe-cust-cell:last-child { border-right:none; }
.oe-cust-avatar {
    width:44px; height:44px; border-radius:12px; flex-shrink:0;
    background:linear-gradient(135deg,rgba(79,70,229,.6),rgba(124,58,237,.6));
    border:1px solid rgba(255,255,255,.15);
    display:flex; align-items:center; justify-content:center;
    font-size:15px; font-weight:900; color:#fff; letter-spacing:-.5px;
}
.oe-cust-name { font-size:14px; font-weight:800; color:#fff; line-height:1.2; }
.oe-cust-phone { font-size:12px; color:rgba(255,255,255,.45); margin-top:2px; display:flex; align-items:center; gap:5px; }
.oe-info-kv { display:flex; flex-direction:column; }
.oe-info-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,255,255,.3); margin-bottom:3px; }
.oe-info-val { font-size:13px; font-weight:700; color:rgba(255,255,255,.8); }
@media(max-width:768px) {
    .oe-cust-strip { flex-direction:column; }
    .oe-cust-cell { border-right:none; border-bottom:1px solid rgba(255,255,255,.06); width:100%; }
}

/* ── Body ── */
.oe-body { padding:24px; }

/* ── Card ── */
.oe-card { background:var(--c-surface); border:1px solid var(--c-border); border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.05); margin-bottom:18px; }
.oe-card-hd { padding:13px 20px; border-bottom:1px solid var(--c-border); background:#FAFAFA; display:flex; align-items:center; justify-content:space-between; }
.oe-card-title { display:flex; align-items:center; gap:10px; }
.oe-card-icon { width:30px; height:30px; border-radius:9px; background:var(--c-indigo-l); color:var(--c-indigo); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
.oe-card-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--c-muted); }
.oe-card-hint { font-size:11px; color:var(--c-light); }
.oe-card-bd { padding:20px; }

/* ── Labels + inputs ── */
.oe-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--c-muted); display:block; margin-bottom:5px; }
.oe-inp { display:block; width:100%; height:var(--ih); border:1.5px solid var(--c-border); border-radius:9px; padding:0 12px; font-size:13px; color:var(--c-dark); background:#fff; outline:none; transition:border-color .15s; }
.oe-inp:focus { border-color:var(--c-indigo); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.oe-inp::placeholder { color:var(--c-light); }
select.oe-inp { cursor:pointer; }
textarea.oe-inp { height:auto; padding:10px 12px; resize:none; }

/* ── Main grid ── */
.oe-main-grid { display:grid; grid-template-columns:1fr 360px; gap:18px; align-items:start; }
@media(max-width:1100px) { .oe-main-grid { grid-template-columns:1fr; } }
.oe-sticky { position:sticky; top:10px; }
@media(max-width:1100px) { .oe-sticky { position:static; } }

/* ── Table ── */
.oe-table { width:100%; border-collapse:collapse; }
.oe-table thead th { background:#F9FAFB; padding:10px 16px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--c-muted); border-bottom:1px solid var(--c-border); white-space:nowrap; }
.oe-table tbody td { padding:12px 16px; border-top:1px solid #F3F4F6; vertical-align:middle; }
.oe-table tbody tr:hover td { background:#F8F9FF; }
.oe-table tbody tr:last-child td { border-bottom:none; }
.oe-thumb { width:44px; height:44px; border-radius:10px; object-fit:cover; border:1px solid var(--c-border); flex-shrink:0; }
.oe-item-name { font-size:13px; font-weight:700; color:var(--c-dark); line-height:1.2; }
.oe-item-sku  { font-size:11px; color:var(--c-light); margin-top:2px; }
.oe-qty-wrap { display:flex; align-items:center; justify-content:center; }
.oe-qty-inp { width:60px; height:34px; text-align:center; border:1.5px solid var(--c-border); border-radius:8px; font-size:13px; font-weight:700; color:var(--c-dark); outline:none; }
.oe-qty-inp:focus { border-color:var(--c-indigo); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.oe-btn-rm { width:30px; height:30px; border-radius:8px; border:1.5px solid rgba(220,38,38,.2); background:var(--c-red-l); color:var(--c-red); display:inline-flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }
.oe-btn-rm:hover { background:var(--c-red); color:#fff; }
.oe-cart-foot { padding:12px 20px; border-top:1px solid var(--c-border); background:#FAFAFA; display:flex; align-items:center; justify-content:space-between; }
.oe-cart-badge { background:rgba(79,70,229,.12); color:var(--c-indigo-d); border:1px solid rgba(79,70,229,.18); border-radius:999px; padding:3px 10px; font-size:11px; font-weight:700; }
.oe-empty { text-align:center; padding:44px 20px; }
.oe-empty i { font-size:30px; color:var(--c-light); margin-bottom:10px; display:block; }
.oe-empty p { font-size:13px; color:var(--c-muted); margin:0; }

/* ── Totals ── */
.oe-totals-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.oe-totals-row .lbl { font-size:13px; color:var(--c-muted); }
.oe-totals-inp { width:126px; height:38px; border:1.5px solid var(--c-border); border-radius:9px; padding:0 10px; text-align:right; font-size:14px; font-weight:700; color:var(--c-dark); outline:none; background:#fff; }
.oe-totals-inp:focus { border-color:var(--c-indigo); box-shadow:0 0 0 3px rgba(79,70,229,.1); }
.oe-grand-strip { background:linear-gradient(135deg,#059669,#10B981); border-radius:12px; padding:16px 18px; margin:10px 0 14px; display:flex; align-items:center; justify-content:space-between; }
.oe-grand-lbl { font-size:12px; font-weight:700; color:rgba(255,255,255,.7); text-transform:uppercase; letter-spacing:.07em; }
.oe-grand-val { font-size:24px; font-weight:900; color:#fff; letter-spacing:-.5px; }
.oe-save-btn { width:100%; height:50px; background:linear-gradient(135deg,#059669,#10B981); color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:opacity .15s,transform .15s; }
.oe-save-btn:hover { opacity:.9; transform:translateY(-1px); }
.oe-save-btn:active { transform:translateY(0); }

/* ── Alerts ── */
.oe-alert-err { background:var(--c-red-l); border:1px solid rgba(220,38,38,.2); border-radius:10px; padding:12px 16px; margin-bottom:18px; }
.oe-alert-err strong { font-size:13px; font-weight:700; color:var(--c-red); display:flex; align-items:center; gap:6px; }
.oe-alert-err ul { margin:8px 0 0 16px; font-size:12px; color:var(--c-red); }
.oe-alert-ok { background:var(--c-green-l); border:1px solid rgba(5,150,105,.2); border-radius:10px; padding:12px 16px; margin-bottom:18px; font-size:13px; font-weight:600; color:var(--c-green); display:flex; align-items:center; gap:8px; }

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

@media(max-width:768px) { .oe-hero { padding:18px 16px 0; } .oe-body { padding:12px; } }
</style>
`,
    content: html`
<div class="content-wrapper oe-wrap">


<div class="oe-hero">
    <div class="oe-hero-top">
        <div>
            <div class="oe-hero-eyebrow">
                <a href="${route('admin.customorders.index')}">Custom Orders</a>
                &nbsp;/&nbsp; Edit Order
            </div>
            <h1 class="oe-hero-title">Edit Order <span>#${order?.id}</span></h1>
            <p class="oe-hero-sub">Modify items, delivery details or discount &mdash; changes apply immediately on save.</p>
        </div>
        <div class="oe-hero-actions">
            <a href="${route('admin.customorders.index')}" class="oe-btn-ghost">
                <i class="fas fa-arrow-left"></i> Back
            </a>
            <button type="button" id="btnClearCart" class="oe-btn-danger-ghost">
                <i class="fas fa-trash-alt"></i> Clear Cart
            </button>
        </div>
    </div>

    
    <div class="oe-cust-strip">
        
        <div class="oe-cust-cell">
            <div class="oe-cust-avatar">${initials  ||  'U'}</div>
            <div>
                <div class="oe-cust-name">${customer?.full_name ?? 'Unknown Customer'}</div>
                <div class="oe-cust-phone">
                    <i class="fas fa-phone-alt" style="font-size:9px;"></i>
                    ${customer?.phone ?? '—'}
                </div>
            </div>
        </div>
        
        <div class="oe-cust-cell" style="flex:0 0 auto;min-width:160px;">
            <div class="oe-info-kv">
                <span class="oe-info-lbl"><i class="fas fa-map-marker-alt" style="margin-right:3px;"></i>City</span>
                <span class="oe-info-val">${order?.shipping_city ?? customer?.city ?? '—'}</span>
            </div>
        </div>
        
        <div class="oe-cust-cell" style="flex:0 0 auto;min-width:180px;">
            <div class="oe-info-kv">
                <span class="oe-info-lbl"><i class="fas fa-receipt" style="margin-right:3px;"></i>Order Total</span>
                <span class="oe-info-val">PKR ${number_format(floatval(order?.total), 0)}</span>
            </div>
        </div>
        
        <div class="oe-cust-cell" style="flex:0 0 auto;min-width:160px;">
            <div class="oe-info-kv">
                <span class="oe-info-lbl"><i class="fas fa-calendar-alt" style="margin-right:3px;"></i>Created</span>
                <span class="oe-info-val">${order?.created_at?.format('d M Y')}</span>
            </div>
        </div>
    </div>
</div>


<div class="oe-body">

    ${(session('success')) ? html`    <div class="oe-alert-ok">
        <i class="fas fa-check-circle"></i> ${session('success')}
    </div>
    ` : ''}
    ${(errors?.any()) ? html`    <div class="oe-alert-err">
        <strong><i class="fas fa-exclamation-circle"></i> Please fix the following:</strong>
        <ul>${foreach(errors?.all(), (e, loop) => html`<li>${e}</li>`)}</ul>
    </div>
    ` : ''}
    <form method="POST" action="${route('admin.customorders.update', order?.id)}" id="posEditForm">
    ${csrf_field()}
    <div class="oe-main-grid">

        
        <div>

            
            <div class="oe-card">
                <div class="oe-card-hd">
                    <div class="oe-card-title">
                        <div class="oe-card-icon"><i class="fas fa-barcode"></i></div>
                        <span class="oe-card-label">Add / Change Products</span>
                    </div>
                    <span class="oe-card-hint">Same item again = qty +1</span>
                </div>
                <div class="oe-card-bd">
                    <label class="oe-lbl">Search by name or SKU</label>
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

            
            <div class="oe-card">
                <div class="oe-card-hd">
                    <div class="oe-card-title">
                        <div class="oe-card-icon"><i class="fas fa-shopping-cart"></i></div>
                        <span class="oe-card-label">Cart</span>
                    </div>
                    <span class="oe-cart-badge" id="cartCount">0 items</span>
                </div>
                <div class="table-responsive">
                    <table class="oe-table" id="cartTable">
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
                                    <div class="oe-empty">
                                        <i class="fas fa-cart-plus"></i>
                                        <p>Cart is empty — search a product above to add.</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="oe-cart-foot">
                    <span style="font-size:12px;color:var(--c-muted);">
                        <i class="fas fa-info-circle" style="color:var(--c-indigo);margin-right:4px;"></i>Totals update instantly
                    </span>
                    <span style="font-size:13px;color:var(--c-muted);">Subtotal: <strong id="subTotalLeft" style="color:var(--c-dark);">PKR 0</strong></span>
                </div>
            </div>

        </div>

        
        <div class="oe-sticky">

            
            <div class="oe-card">
                <div class="oe-card-hd">
                    <div class="oe-card-title">
                        <div class="oe-card-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <span class="oe-card-label">Delivery Address</span>
                    </div>
                </div>
                <div class="oe-card-bd">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="oe-lbl">Receiver Name <span style="color:var(--c-red)">*</span></label>
                            <input class="oe-inp" name="shipping_address[full_name]"
                                value="${old('shipping_address.full_name', order?.shipping_name ?? customer?.full_name ?? '')}"
                                placeholder="Receiver name">
                        </div>
                        <div class="col-12">
                            <label class="oe-lbl">Receiver Phone <span style="color:var(--c-red)">*</span></label>
                            <input class="oe-inp" name="shipping_address[phone]"
                                value="${old('shipping_address.phone', order?.shipping_phone ?? customer?.phone ?? '')}"
                                placeholder="03XX XXXXXXX">
                        </div>
                        <div class="col-12">
                            <label class="oe-lbl">Street Address <span style="color:var(--c-red)">*</span></label>
                            <input class="oe-inp" name="shipping_address[address]"
                                value="${old('shipping_address.address', order?.shipping_address ?? customer?.address ?? '')}"
                                placeholder="Street, block, area, landmark…">
                        </div>
                        <div class="col-7">
                            <label class="oe-lbl">City</label>
                                                        <select class="oe-inp" id="shipCity" name="shipping_address[city]">
                                <option value="">— Select City —</option>
                                ${foreach(pkCities, (city, loop) => html`                                <option value="${city}" ${currentCity === city ? 'selected' : ''}>${city}</option>
                                `)}                            </select>
                        </div>
                        <div class="col-5">
                            <label class="oe-lbl">Flat / Area</label>
                            <input class="oe-inp" name="shipping_address[villa_apartment]"
                                value="${old('shipping_address.villa_apartment', order?.shipping_villa ?? '')}"
                                placeholder="Flat / area">
                        </div>
                    </div>
                </div>
            </div>

            
            <div class="oe-card">
                <div class="oe-card-hd">
                    <div class="oe-card-title">
                        <div class="oe-card-icon"><i class="fas fa-receipt"></i></div>
                        <span class="oe-card-label">Order Summary</span>
                    </div>
                </div>
                <div class="oe-card-bd">

                    <div class="oe-totals-row">
                        <span class="lbl">Subtotal</span>
                        <span id="subTotal" style="font-size:14px;font-weight:700;color:var(--c-dark);">PKR 0.00</span>
                    </div>
                    <div class="oe-totals-row">
                        <label class="lbl" for="shipping">Shipping (PKR)</label>
                        <input name="shipping" id="shipping" class="oe-totals-inp"
                            value="${old('shipping', number_format(floatval(order?.shipping), 2, '.', ''))}"
                            inputmode="decimal" placeholder="0.00">
                    </div>
                    <div class="oe-totals-row">
                        <label class="lbl" for="discount">Discount (PKR)</label>
                        <input name="discount" id="discount" class="oe-totals-inp"
                            value="${old('discount', number_format(floatval(order?.discount), 2, '.', ''))}"
                            inputmode="decimal" placeholder="0.00">
                    </div>

                    <div class="oe-grand-strip">
                        <span class="oe-grand-lbl">Grand Total</span>
                        <span class="oe-grand-val" id="grandTotal">PKR 0.00</span>
                    </div>

                    <div style="margin-bottom:14px;">
                        <label class="oe-lbl">Order Notes <span style="color:var(--c-light);">(optional)</span></label>
                        <textarea name="order_notes" class="oe-inp" rows="2"
                            placeholder="Any special instructions…">${old('order_notes', order?.order_notes)}</textarea>
                    </div>

                    <button type="submit" class="oe-save-btn" id="btnSubmit">
                        <i class="fas fa-save"></i> Save Changes
                    </button>

                </div>
            </div>

        </div>
    </div>

    </form>
</div>
</div>

<script>
    window.__EXISTING_ITEMS__    = ${bladeJson(existingItems ?? [])};
    window.__FALLBACK_IMG__      = ${bladeJson(fallbackImg ?? '')};
    window.__SHIPPING_RATE_MAP__ = ${bladeJson(shippingRateMap ?? [])};
    window.__DEFAULT_SHIPPING__  = ${bladeJson(floatval(defaultShipping ?? 0))};
</script>
`,
    scripts: html`<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<script>
(function () {
    'use strict';

    const shippingRateMap = window.__SHIPPING_RATE_MAP__ || {};
    const defaultShipping = window.__DEFAULT_SHIPPING__  || 0;
    const fallbackImg     = window.__FALLBACK_IMG__      || '';

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
            <img src="\${esc($(el).data('img')||fallbackImg)}" alt="" onerror="this.style.display='none'">
            <div><div class="s2-item-name">\${esc($(el).data('label')||state.text)}</div></div>
        </div>\`;
    }

    $('#productSearch').select2({
        width:'100%', allowClear:true, placeholder:'Type to search products / variants…',
        templateResult: fmtProd,
        templateSelection: s => s.id ? ($(s.element).data('label')||s.text) : s.text,
        escapeMarkup: m => m,
    });

    $('#shipCity').on('change', function () {
        const city = $(this).val() || '';
        const rate = city && shippingRateMap[city] !== undefined
            ? parseFloat(shippingRateMap[city]) : defaultShipping;
        $('#shipping').val(fmt(rate));
        recalc();
    });
    $('#shipping, #discount').on('input change', recalc);

    function addRow(item) {
        const html = \`
        <tr class="cart-row" data-key="\${esc(item.key)}">
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="\${esc(item.img || fallbackImg)}" class="oe-thumb" alt="" onerror="this.style.display='none'">
                    <div>
                        <div class="oe-item-name">\${esc(item.name)}</div>
                        \${item.sku ? \`<div class="oe-item-sku">SKU: \${esc(item.sku)}</div>\` : ''}
                    </div>
                </div>
                <input type="hidden" name="items[\${item.idx}][type]" value="\${esc(item.type)}">
                <input type="hidden" name="items[\${item.idx}][id]"   value="\${esc(item.id)}">
            </td>
            <td style="text-align:right;font-size:13px;font-weight:700;color:var(--c-dark);">PKR \${fmt(item.unit)}</td>
            <td>
                <div class="oe-qty-wrap">
                    <input type="number" min="1" value="\${item.qty}" class="oe-qty-inp"
                        name="items[\${item.idx}][qty]" data-key="\${esc(item.key)}">
                </div>
            </td>
            <td style="text-align:right;font-size:13px;font-weight:700;color:var(--c-dark);" class="line-total">PKR \${fmt(item.unit * item.qty)}</td>
            <td style="text-align:center;">
                <button type="button" class="oe-btn-rm btnRemove" data-key="\${esc(item.key)}">
                    <i class="fas fa-times" style="font-size:10px;"></i>
                </button>
            </td>
        </tr>\`;
        $('#emptyCartRow').before(html);
        item.row = $(\`#cartTable tr[data-key="\${CSS.escape(item.key)}"]\`)[0];
        cart.set(item.key, item);
    }

    function addToCart(type, id, name, sku, unit, img, qty) {
        const key = \`\${type}:\${id}\`;
        if (cart.has(key)) {
            const it = cart.get(key); it.qty += qty;
            if (it.row) $(it.row).find('.oe-qty-inp').val(it.qty);
            cart.set(key, it);
        } else {
            const it = { key, type, id, name, sku, unit, qty, img, idx: idx++ };
            cart.set(key, it);
            addRow(it);
        }
    }

    $('#productSearch').on('change', function () {
        const sel  = $(this).find(':selected');
        const type = sel.data('type');
        const id   = sel.data('id');
        if (!type || !id) { $(this).val('').trigger('change'); return; }
        addToCart(type, id,
            sel.data('name') || 'Item',
            sel.data('sku')  || '',
            parseFloat(sel.data('unit')) || 0,
            sel.data('img')  || fallbackImg,
            1
        );
        badge(); recalc();
        $(this).val('').trigger('change');
    });

    $(document).on('input change', '.oe-qty-inp', function () {
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
        if (confirm('Clear all items from the cart?')) {
            cart.clear(); $('.cart-row').remove(); badge(); recalc();
        }
    });

    $('#posEditForm').on('submit', function (e) {
        if (!cart.size) {
            e.preventDefault();
            alert('Please add at least one product to the cart.');
            return false;
        }
        const btn = document.getElementById('btnSubmit');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span> Saving…';
    });

    (window.__EXISTING_ITEMS__ || []).forEach(function (item) {
        addToCart(item.type, item.id, item.name, item.sku || '', item.unit, item.img || fallbackImg, item.qty);
    });

    badge(); recalc();
    setTimeout(() => $('#productSearch').select2('focus'), 120);
})();
</script>
`,
  };
}
