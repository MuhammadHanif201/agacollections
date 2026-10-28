// Port of resources/views/adminside/products/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, request, csrf_token, number_format, count, empty, ucfirst, max, min, e, optional, entries, foreach, LengthAwarePaginator } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { products, totalStockSum, categories, totalQty, stockClass, stockLabel, v, k } = d;

  return {
    title: html`<title>Products — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Manage the full product catalog — clothing, sizes, colors, stock and pricing for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="product catalog, manage products, clothing inventory, stock management, sku, variants, aga collections admin">
`,
    styles: html`<style>
    .prod-page { background: var(--page-bg, #FAFAFA); min-height: 100vh; padding: 0 0 48px; }

    /* ── Hero ── */
    .prod-hero {
        background: linear-gradient(135deg, #111111 0%, #1C1C1C 60%, #111111 100%);
        padding: 32px 0 28px; margin-bottom: 28px;
        position: relative; overflow: hidden;
        border-bottom: 1px solid rgba(17,17,17,.18);
    }
    .prod-hero::before {
        content: ''; position: absolute; inset: 0;
        background: radial-gradient(ellipse at 70% 50%, rgba(17,17,17,.10) 0%, transparent 65%);
        pointer-events: none;
    }
    .prod-hero-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; position: relative; z-index:1; }
    .prod-hero-left  { display: flex; align-items: center; gap: 16px; }
    .prod-hero-icon  {
        width: 52px; height: 52px; border-radius: 14px;
        background: rgba(17,17,17,.18); border: 1px solid rgba(17,17,17,.3);
        display: flex; align-items: center; justify-content: center; font-size: 1.35rem; color: #FF4F1F;
    }
    .prod-hero-title { font-size: 1.55rem; font-weight: 700; color: #F4F4F4; margin: 0 0 4px; }
    .prod-hero-sub   { font-size: 0.78rem; color: #A3A3A3; margin: 0; }
    .prod-hero-sub a { color: #FFE6DC; text-decoration: none; }
    .prod-hero-sub a:hover { text-decoration: underline; }
    .prod-hero-stats { display: flex; gap: 12px; }
    .hero-stat {
        background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
        border-radius: 12px; padding: 10px 18px; text-align: center; min-width: 80px;
    }
    .hero-stat-val { font-size: 1.4rem; font-weight: 800; color: #fff; line-height: 1; }
    .hero-stat-lbl { font-size: .68rem; color: #A3A3A3; text-transform: uppercase; letter-spacing: .08em; margin-top: 3px; }

    /* ── Add button ── */
    .btn-add {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 22px; background: #111111; color: #fff;
        border-radius: 10px; font-size: 0.85rem; font-weight: 600;
        text-decoration: none; transition: all .2s; border: none;
    }
    .btn-add:hover { background: #2A2A2A; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(17,17,17,.35); }

    /* ── Filter card ── */
    .filter-card {
        background: #fff; border-radius: 14px; padding: 16px 20px;
        box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04);
        border: 1px solid #F4F4F4; margin-bottom: 20px;
        display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;
    }
    .filter-card .fg { margin: 0; display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 140px; }
    .filter-card label { font-size: .71rem; font-weight: 700; color: #737373; text-transform: uppercase; letter-spacing: .05em; }
    .filter-card .form-control,
    .filter-card .form-select {
        height: 38px; border: 1.5px solid #E5E5E5; border-radius: 8px;
        font-size: .84rem; padding: 0 10px; background: #FAFAFA; color: #111111;
        transition: border-color .18s, box-shadow .18s;
    }
    .filter-card .form-control:focus,
    .filter-card .form-select:focus { border-color: #111111; outline: none; box-shadow: 0 0 0 3px rgba(17,17,17,.1); background: #fff; }
    .btn-filter { height: 38px; padding: 0 18px; background: #111111; color: #fff; border: none; border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; transition: background .18s; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .btn-filter:hover { background: #2A2A2A; }
    .btn-reset-f { height: 38px; padding: 0 14px; background: #F4F4F4; color: #737373; border: 1.5px solid #E5E5E5; border-radius: 8px; font-size: .82rem; cursor: pointer; transition: all .18s; display: flex; align-items: center; gap: 6px; text-decoration: none; white-space: nowrap; }
    .btn-reset-f:hover { background: #E5E5E5; color: #111111; }

    /* ── Table card ── */
    .table-card {
        background: #fff; border-radius: 14px;
        box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04);
        border: 1px solid #F4F4F4; overflow: hidden;
    }
    .table-card-header {
        padding: 14px 22px; border-bottom: 1px solid #F4F4F4;
        display: flex; align-items: center; justify-content: space-between;
    }
    .table-card-header h3 { font-size: .88rem; font-weight: 700; color: #111111; margin: 0; }
    .drag-tip { font-size: .73rem; color: #A3A3A3; display: flex; align-items: center; gap: 5px; background: #FAFAFA; padding: 4px 12px; border-radius: 20px; border: 1px solid #E5E5E5; }

    /* ── Product table ── */
    .prod-table { width: 100%; border-collapse: collapse; }
    .prod-table thead th {
        background: #FAFAFA; color: #737373; font-size: .69rem;
        font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
        padding: 11px 14px; border-bottom: 1.5px solid #F4F4F4; white-space: nowrap;
    }
    .prod-table tbody td { padding: 13px 14px; border-bottom: 1px solid #FAFAFA; vertical-align: middle; font-size: .87rem; color: #374151; }
    .prod-table tbody tr.prod-row:last-child td { border-bottom: none; }
    .prod-table tbody tr.prod-row:hover { background: #FAFAFA; }
    .prod-table tbody tr.prod-row.dragging { opacity: .45; background: #F3F0E9 !important; }

    .drag-handle { color: #D4D4D4; cursor: grab; font-size: .9rem; padding: 4px 6px; transition: color .15s; }
    .drag-handle:hover { color: #111111; }

    .prod-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 10px; border: 1.5px solid #E5E5E5; transition: transform .2s; }
    .prod-row:hover .prod-thumb { transform: scale(1.06); }
    .prod-name { font-size: .9rem; font-weight: 700; color: #111111; line-height: 1.3; }
    .cat-chip { display: inline-flex; font-size: .67rem; padding: 2px 8px; border-radius: 20px; background: #F3F0E9; color: #111111; font-weight: 600; border: 1px solid rgba(17,17,17,.15); }

    .price-main { font-size: .95rem; font-weight: 800; color: #111111; }
    .price-cur  { font-size: .72rem; font-weight: 600; color: #A3A3A3; margin-right: 2px; }
    .price-compare { font-size: .75rem; color: #A3A3A3; text-decoration: line-through; margin-top: 3px; display: block; }

    .stock-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: .75rem; font-weight: 700; }
    .stock-dot   { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .stock-high   { background: #F0FDF4; color: #15803D; } .stock-high .stock-dot   { background: #16A34A; }
    .stock-low    { background: #FFFBEB; color: #92400E; } .stock-low .stock-dot    { background: #D97706; }
    .stock-danger { background: #FEF2F2; color: #991B1B; } .stock-danger .stock-dot { background: #DC2626; }
    .stock-zero   { background: #FAFAFA; color: #737373; } .stock-zero .stock-dot   { background: #A3A3A3; }

    .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: .75rem; font-weight: 700; }
    .status-dot  { width: 6px; height: 6px; border-radius: 50%; }
    .s-active { background: #DCFCE7; color: #15803D; } .s-active .status-dot { background: #16A34A; }
    .s-draft  { background: #F4F4F4; color: #737373; } .s-draft  .status-dot  { background: #A3A3A3; }

    .btn-variants { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 8px; font-size: .75rem; font-weight: 600; color: #7C3AED; background: rgba(124,58,237,.08); border: 1px solid rgba(124,58,237,.2); cursor: pointer; transition: all .15s; }
    .btn-variants:hover { background: rgba(124,58,237,.15); }

    /* Variants expand row */
    tr.variant-row td { padding: 0; background: #FAFAFA; }
    .variants-grid { padding: 14px 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .variant-card { background: #fff; border: 1px solid #E5E5E5; border-radius: 10px; padding: 12px 14px; }
    .variant-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.07); }
    .variant-opts-label { font-size: .7rem; font-weight: 700; color: #111111; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
    .variant-sku  { font-size: .72rem; color: #A3A3A3; font-weight: 600; letter-spacing: .05em; }
    .variant-price-val { font-size: .9rem; font-weight: 700; color: #111111; }
    .variant-qty-val   { font-size: .75rem; color: #737373; margin-top: 2px; }

    .act-btn { width: 34px; height: 34px; border-radius: 8px; border: none; display: inline-flex; align-items: center; justify-content: center; font-size: .85rem; cursor: pointer; transition: all .18s; text-decoration: none; }
    .act-btn.edit { background: #F3F0E9; color: #111111; }
    .act-btn.edit:hover { background: #111111; color: #fff; transform: translateY(-1px); }

    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 22px; border-top: 1px solid #F4F4F4; background: #FAFAFA; flex-wrap: wrap; gap: 10px; }
    .stock-total { font-size: .82rem; color: #737373; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .stock-total strong { color: #111111; font-size: .9rem; }

    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-icon  { width: 68px; height: 68px; border-radius: 16px; background: #F4F4F4; display: flex; align-items: center; justify-content: center; font-size: 1.7rem; color: #D4D4D4; margin: 0 auto 14px; border: 1px solid #E5E5E5; }
    .empty-state h5 { font-size: .95rem; font-weight: 700; color: #525252; margin: 0 0 6px; }
    .empty-state p  { font-size: .84rem; color: #A3A3A3; margin: 0; }
    .empty-state a  { color: #111111; font-weight: 600; text-decoration: none; }

    @media (max-width: 768px) {
        .filter-card { flex-direction: column; }
        .filter-card .fg { min-width: 100%; }
        .prod-hero-inner { flex-direction: column; align-items: flex-start; }
        .prod-hero-stats { flex-wrap: wrap; }
    }
</style>
`,
    content: html`<div class="content-wrapper" style="background: var(--page-bg, #FAFAFA);">
<div class="prod-page">

    
    <div class="prod-hero">
        <div class="container-fluid" style="max-width:1400px;">
            <div class="prod-hero-inner">
                <div class="prod-hero-left">
                    <div class="prod-hero-icon"><i class="fas fa-box-open"></i></div>
                    <div>
                        <h1 class="prod-hero-title">Products</h1>
                        <p class="prod-hero-sub">
                            <a href="${route('admin.home')}">Dashboard</a>
                            <span style="margin:0 6px;color:#525252;">/</span> Products
                        </p>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-3 flex-wrap">
                    <div class="prod-hero-stats">
                        <div class="hero-stat">
                            <div class="hero-stat-val">${products instanceof LengthAwarePaginator ? products?.total() : count(products)}</div>
                            <div class="hero-stat-lbl">Products</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-val">${totalStockSum}</div>
                            <div class="hero-stat-lbl">Total Stock</div>
                        </div>
                    </div>
                    <a href="${route('admin.products.create')}" class="btn-add">
                        <i class="fas fa-plus"></i> Add Product
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="container-fluid" style="max-width:1400px;">

        
        <form method="GET" action="${url()?.current()}" class="filter-card">
            <div class="fg">
                <label>Name</label>
                <input type="text" name="name" class="form-control" placeholder="Search by name…" value="${request('name')}">
            </div>
            <div class="fg" style="max-width:140px;">
                <label>Price</label>
                <input type="number" name="price" class="form-control" placeholder="Exact price…" step="0.01" value="${request('price')}">
            </div>
            <div class="fg" style="max-width:150px;">
                <label>Status</label>
                <select name="status" class="form-select">
                    <option value="">All statuses</option>
                    <option value="active" ${request('status') === 'active' ? 'selected' : ''}>Active</option>
                    <option value="draft"  ${request('status') === 'draft'  ? 'selected' : ''}>Draft</option>
                </select>
            </div>
            <div class="fg" style="max-width:180px;">
                <label>Category</label>
                <select name="category_id" class="form-select">
                    <option value="">All categories</option>
                    ${foreach(categories, (cat, loop) => html`                        <option value="${cat?.id}" ${request('category_id') == cat?.id ? 'selected' : ''}>${cat?.title}</option>
                    `)}                </select>
            </div>
            <div class="fg" style="max-width:150px;">
                <label>View</label>
                <select name="show" class="form-select">
                    <option value="">Paginated (10)</option>
                    <option value="all" ${request('show') === 'all' ? 'selected' : ''}>All products</option>
                </select>
            </div>
            <button type="submit" class="btn-filter"><i class="fas fa-search"></i> Filter</button>
            <a href="${url()?.current()}" class="btn-reset-f"><i class="fas fa-rotate-right"></i> Reset</a>
        </form>

        
        <div class="table-card">
            <div class="table-card-header">
                <h3>All Products <span style="font-size:.76rem;color:#A3A3A3;font-weight:400;margin-left:6px;">${products instanceof LengthAwarePaginator ? products?.total() : count(products)} total</span></h3>
                <div class="drag-tip"><i class="fas fa-grip-vertical"></i> Drag to reorder</div>
            </div>

            <div style="overflow-x:auto;">
                <table class="prod-table">
                    <thead>
                        <tr>
                            <th style="width:36px;"></th>
                            <th style="width:40px; text-align:center">#</th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Variants</th>
                            <th class="text-center" style="width:80px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="sortable-products">
                        ${count(products) ? foreach(products, (product, loop) => { let totalQty = product?.variants?.count() ? product?.variants?.sum('quantity') : (product?.quantity ?? 0);
let stockClass = totalQty <= 0 ? 'stock-zero' : (totalQty <= 3 ? 'stock-danger' : (totalQty <= 10 ? 'stock-low' : 'stock-high'));
let stockLabel = totalQty <= 0 ? 'Out of stock' : (totalQty ?? '')  +  ' in stock';
 return html`                        
                        <tr class="prod-row sortable-row" draggable="true" data-id="${product?.id}">
                            <td><span class="drag-handle"><i class="fas fa-grip-vertical"></i></span></td>
                            <td style="text-align:center; color:#A3A3A3; font-size:.78rem; font-weight:600;">${loop?.iteration}</td>
                            <td>
                                <div class="d-flex align-items-center gap-3">
                                    <img src="${product?.primaryImage ? asset('storage/' + (product?.primaryImage?.image_path ?? '')) : asset('images/placeholder.png')}"
                                         class="prod-thumb" alt="${product?.name}">
                                    <div>
                                        <div class="prod-name">${product?.name}</div>
                                        ${(product?.category?.count()) ? html`                                        <div class="d-flex flex-wrap gap-1 mt-1">
                                            ${foreach(product?.category, (cat, loop) => html`                                                <span class="cat-chip">${cat?.title}</span>
                                            `)}                                        </div>
                                        ` : ''}                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="price-main"><span class="price-cur">PKR</span>${number_format(product?.price, 2)}</div>
                                ${(product?.sale_price) ? html`                                    <span class="price-compare">PKR ${number_format(product?.sale_price, 2)}</span>
                                ` : ''}                            </td>
                            <td>
                                <span class="stock-badge ${stockClass}">
                                    <span class="stock-dot"></span>${stockLabel}
                                </span>
                            </td>
                            <td>
                                <span class="status-pill ${product?.status === 'active' ? 's-active' : 's-draft'}">
                                    <span class="status-dot"></span>${ucfirst(product?.status)}
                                </span>
                            </td>
                            <td>
                                ${(product?.variants?.count()) ? html`                                    <button class="btn-variants"
                                        data-bs-toggle="collapse"
                                        data-bs-target="#variants-${product?.id}"
                                        aria-expanded="false">
                                        <i class="fas fa-layer-group" style="font-size:.65rem;"></i>
                                        ${product?.variants?.count()} variants
                                    </button>
                                ` : html`                                    <span style="color:#D4D4D4; font-size:.8rem;">— None</span>
                                `}                            </td>
                            <td class="text-center">
                                <a href="${route('admin.products.edit', product?.id)}" class="act-btn edit" title="Edit">
                                    <i class="fas fa-pen"></i>
                                </a>
                            </td>
                        </tr>

                        
                        ${(product?.variants?.count()) ? html`                        <tr class="variant-row collapse" id="variants-${product?.id}">
                            <td colspan="8">
                                <div class="variants-grid">
                                    ${foreach(product?.variants, (variant, loop) => html`                                    <div class="variant-card">
                                        ${(variant?.primary_image) ? html`                                            <img src="${asset('storage/'  +  (variant?.primary_image ?? ''))}" alt=""
                                                style="width:52px;height:52px;object-fit:cover;border-radius:7px;border:1.5px solid #E5E5E5;margin-bottom:6px;display:block;">
                                        ` : html`                                            <div style="width:52px;height:52px;border:1.5px dashed #D4D4D4;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#D4D4D4;font-size:.9rem;margin-bottom:6px;">
                                                <i class="fas fa-image"></i>
                                            </div>
                                        `}                                        <div class="variant-opts-label">
                                            ${entries(variant?.option_values).map(([k, v]: any[]) => `${k}: ${v}`).join(' · ')}
                                        </div>
                                        <div class="variant-sku">${variant?.sku  ||  '—'}</div>
                                        <div class="variant-price-val">PKR ${number_format(variant?.price ?? 0, 2)}</div>
                                        <div class="variant-qty-val"><i class="fas fa-box" style="font-size:.62rem; opacity:.6;"></i> ${variant?.quantity} in stock</div>
                                    </div>
                                    `)}                                </div>
                            </td>
                        </tr>
                        ` : ''}
                        `; }) : html`                        <tr>
                            <td colspan="8">
                                <div class="empty-state">
                                    <div class="empty-icon"><i class="fas fa-box-open"></i></div>
                                    <h5>No products found</h5>
                                    <p>Try adjusting your filters or <a href="${route('admin.products.create')}">add your first product</a>.</p>
                                </div>
                            </td>
                        </tr>
                        `}                    </tbody>
                </table>
            </div>

            <div class="table-footer">
                <div class="stock-total">
                    <i class="fas fa-boxes" style="color:#111111;"></i>
                    Total inventory: <strong>${totalStockSum}</strong> units
                </div>
                ${(products instanceof LengthAwarePaginator && products?.hasPages()) ? html`                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <small style="color:#A3A3A3;">Showing ${products?.firstItem()}–${products?.lastItem()} of ${products?.total()}</small>
                    ${products?.onEachSide(1)?.links('pagination::bootstrap-5')}
                </div>
                ` : ''}            </div>
        </div>

    </div>
</div>
</div>
`,
    scripts: html`<script>
document.addEventListener('DOMContentLoaded', function () {
    const tbody = document.getElementById('sortable-products');
    if (!tbody) return;
    let dragging = null;

    tbody.querySelectorAll('.sortable-row').forEach(row => {
        row.addEventListener('dragstart', e => {
            dragging = row;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            dragging = null;
            const order = Array.from(tbody.querySelectorAll('.sortable-row')).map(r => r.dataset.id);
            fetch('${route(`admin.products.sort`)}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': '${csrf_token()}' },
                body: JSON.stringify({ order })
            }).catch(() => {});
        });
        row.addEventListener('dragover', e => {
            e.preventDefault();
            if (!dragging || dragging === row) return;
            const rect = row.getBoundingClientRect();
            tbody.insertBefore(dragging, e.clientY < rect.top + rect.height / 2 ? row : row.nextSibling);
        });
    });
});
</script>
`,
  };
}
