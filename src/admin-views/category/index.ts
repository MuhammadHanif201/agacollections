// Port of resources/views/adminside/category/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, request, csrf_token, csrf_field, method_field, count, empty, ucfirst, max, min, e, optional, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { categories } = d;
  let total = categories?.count();
  let active = categories?.where('status', 'active')?.count();
  let draft = categories?.where('status', 'draft')?.count();
  return {
    title: html`    <title>Categories — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
    <meta name="description" content="Create, edit and organise product categories (men, women, kids, accessories) for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
    <meta name="keywords" content="product categories, clothing categories, men women kids, category management, aga collections admin, ecommerce catalog">
`,
    styles: html`<link href="https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css" rel="stylesheet">
<style>
    /* ── Page shell ── */
    .cat-page { background: var(--page-bg, #FAFAFA); min-height: 100vh; padding: 0 0 48px; }

    /* ── Hero banner ── */
    .cat-hero {
        background: linear-gradient(135deg, #111111 0%, #1C1C1C 60%, #111111 100%);
        padding: 32px 0 28px;
        margin-bottom: 28px;
        position: relative;
        overflow: hidden;
        border-bottom: 1px solid rgba(17,17,17,.18);
    }
    .cat-hero::before {
        content: '';
        position: absolute; inset: 0;
        background: radial-gradient(ellipse at 70% 50%, rgba(17,17,17,.10) 0%, transparent 65%);
        pointer-events: none;
    }
    .cat-hero-inner {
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 16px; position: relative; z-index: 1;
    }
    .cat-hero-left { display: flex; align-items: center; gap: 16px; }
    .cat-hero-icon {
        width: 52px; height: 52px; border-radius: 14px;
        background: rgba(17,17,17,.18); border: 1px solid rgba(17,17,17,.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.35rem; color: #FF4F1F; flex-shrink: 0;
    }
    .cat-hero-title { font-size: 1.55rem; font-weight: 700; color: #F4F4F4; margin: 0 0 4px; }
    .cat-hero-sub { font-size: 0.78rem; color: #A3A3A3; margin: 0; }
    .cat-hero-sub a { color: #FFE6DC; text-decoration: none; }
    .cat-hero-sub a:hover { text-decoration: underline; }

    /* ── Add button ── */
    .btn-add {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 22px; background: #111111; color: #fff;
        border-radius: 10px; font-size: 0.85rem; font-weight: 600;
        text-decoration: none; transition: all .2s; border: none; white-space: nowrap;
    }
    .btn-add:hover { background: #2A2A2A; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(17,17,17,.35); }

    /* ── Stat cards ── */
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
        background: #fff; border-radius: 14px; padding: 20px 24px;
        box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04);
        border: 1px solid #F4F4F4;
        display: flex; align-items: center; gap: 16px;
        transition: box-shadow .2s;
    }
    .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.09); }
    .stat-icon {
        width: 50px; height: 50px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.25rem; flex-shrink: 0;
    }
    .stat-icon.total  { background: #F3F0E9; color: #111111; }
    .stat-icon.active { background: #F0FDF4; color: #16a34a; }
    .stat-icon.draft  { background: #FAFAFA; color: #737373; }
    .stat-label { font-size: 0.72rem; color: #A3A3A3; text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
    .stat-value { font-size: 1.75rem; font-weight: 700; color: #111111; line-height: 1; margin-top: 4px; }

    /* ── Search bar ── */
    .search-card {
        background: #fff; border-radius: 14px; padding: 16px 20px;
        box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04);
        border: 1px solid #F4F4F4;
        margin-bottom: 20px;
        display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;
    }
    .search-card .fg { margin: 0; display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 160px; }
    .search-card label { font-size: 0.71rem; font-weight: 700; color: #737373; text-transform: uppercase; letter-spacing: .05em; }
    .search-card .form-control,
    .search-card .form-select {
        height: 38px; border: 1.5px solid #E5E5E5; border-radius: 8px;
        font-size: 0.85rem; padding: 0 10px; background: #FAFAFA; color: #111111;
        transition: border-color .18s, box-shadow .18s;
    }
    .search-card .form-control:focus,
    .search-card .form-select:focus { border-color: #111111; outline: none; box-shadow: 0 0 0 3px rgba(17,17,17,.1); background: #fff; }
    .btn-search {
        height: 38px; padding: 0 20px; background: #111111; color: #fff;
        border: none; border-radius: 8px; font-size: 0.82rem; font-weight: 600;
        cursor: pointer; transition: background .18s; white-space: nowrap;
        display: flex; align-items: center; gap: 6px;
    }
    .btn-search:hover { background: #2A2A2A; }
    .btn-reset {
        height: 38px; padding: 0 16px; background: #F4F4F4; color: #737373;
        border: 1.5px solid #E5E5E5; border-radius: 8px; font-size: 0.82rem;
        cursor: pointer; transition: all .18s; white-space: nowrap;
        display: flex; align-items: center; gap: 6px; text-decoration: none;
    }
    .btn-reset:hover { background: #E5E5E5; color: #111111; }

    /* ── Table card ── */
    .table-card {
        background: #fff; border-radius: 14px;
        box-shadow: 0 1px 4px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04);
        border: 1px solid #F4F4F4;
        overflow: hidden;
    }
    .table-card-header {
        padding: 16px 24px; border-bottom: 1px solid #F4F4F4;
        display: flex; align-items: center; justify-content: space-between;
    }
    .table-card-header h3 { font-size: 0.9rem; font-weight: 700; color: #111111; margin: 0; }
    .drag-hint {
        display: flex; align-items: center; gap: 6px;
        font-size: 0.75rem; color: #A3A3A3; background: #FAFAFA;
        padding: 5px 12px; border-radius: 20px; border: 1px solid #E5E5E5;
    }

    /* ── Table ── */
    .cat-table { width: 100%; border-collapse: collapse; }
    .cat-table thead th {
        background: #FAFAFA; color: #737373; font-size: 0.70rem;
        font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
        padding: 11px 16px; border-bottom: 1.5px solid #F4F4F4; white-space: nowrap;
    }
    .cat-table tbody td {
        padding: 14px 16px; border-bottom: 1px solid #FAFAFA;
        vertical-align: middle; font-size: 0.87rem; color: #374151;
    }
    .cat-table tbody tr:last-child td { border-bottom: none; }
    .cat-table tbody tr:hover { background: #FAFAFA; }
    .cat-table tbody tr.dragging { opacity: .45; background: #F3F0E9 !important; }

    /* drag handle */
    .drag-handle {
        color: #D4D4D4; cursor: grab; font-size: 1rem; padding: 4px 6px;
        transition: color .15s;
    }
    .drag-handle:hover { color: #111111; }

    /* thumbnail */
    .cat-thumb {
        width: 48px; height: 48px; object-fit: cover; border-radius: 8px;
        border: 1.5px solid #E5E5E5; transition: transform .2s, box-shadow .2s;
        display: block;
    }
    .cat-thumb:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .no-thumb {
        width: 48px; height: 48px; border-radius: 8px; background: #F4F4F4;
        display: flex; align-items: center; justify-content: center;
        color: #D4D4D4; font-size: 1.1rem; border: 1.5px dashed #E5E5E5;
    }

    /* title cell */
    .cat-title { font-weight: 600; color: #111111; font-size: 0.88rem; }
    .cat-slug { font-size: 0.72rem; color: #A3A3A3; margin-top: 2px; font-family: monospace; }

    /* product count chip */
    .prod-count {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 10px; background: #F3F0E9; color: #111111;
        border-radius: 20px; font-size: 0.72rem; font-weight: 700;
    }

    /* status badge */
    .badge-status {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 10px; border-radius: 20px; font-size: 0.70rem; font-weight: 700; letter-spacing: .04em;
    }
    .badge-active { background: #DCFCE7; color: #15803D; }
    .badge-draft  { background: #F4F4F4; color: #737373; }
    .badge-active::before, .badge-draft::before {
        content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0;
    }

    /* action buttons */
    .action-wrap { display: flex; gap: 6px; justify-content: center; }
    .act-btn {
        width: 34px; height: 34px; border-radius: 8px; border: none;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 0.85rem; cursor: pointer; transition: all .18s; text-decoration: none;
    }
    .act-btn.edit   { background: #F3F0E9; color: #111111; }
    .act-btn.delete { background: #FEF2F2; color: #DC2626; }
    .act-btn.edit:hover   { background: #111111; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37,99,235,.25); }
    .act-btn.delete:hover { background: #DC2626; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(220,38,38,.25); }
    .protected-badge { font-size: 0.72rem; color: #D4D4D4; padding: 6px 8px; }

    /* empty state */
    .empty-state { text-align: center; padding: 60px 24px; color: #A3A3A3; }
    .empty-state-icon {
        width: 72px; height: 72px; border-radius: 18px; background: #FAFAFA;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.8rem; color: #D4D4D4; margin: 0 auto 16px;
        border: 1px solid #E5E5E5;
    }
    .empty-state h5 { font-size: 1rem; font-weight: 600; color: #525252; margin: 0 0 6px; }
    .empty-state p { font-size: 0.85rem; margin: 0; }
    .empty-state a { color: #111111; text-decoration: none; font-weight: 600; }
    .empty-state a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
        .stat-grid { grid-template-columns: 1fr 1fr; }
        .search-card { flex-direction: column; }
        .search-card .fg { min-width: 100%; }
        .cat-hero-inner { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 480px) {
        .stat-grid { grid-template-columns: 1fr; }
    }
</style>
`,
    content: html`


<div class="content-wrapper" style="background: var(--page-bg, #FAFAFA);">
<div class="cat-page">

    
    <div class="cat-hero">
        <div class="container-fluid" style="max-width:1300px;">
            <div class="cat-hero-inner">
                <div class="cat-hero-left">
                    <div class="cat-hero-icon"><i class="fas fa-layer-group"></i></div>
                    <div>
                        <h1 class="cat-hero-title">Categories</h1>
                        <p class="cat-hero-sub">
                            <a href="${route('admin.home')}">Dashboard</a>
                            <span style="margin:0 6px;color:#525252;">/</span>
                            Categories
                        </p>
                    </div>
                </div>
                <a href="${route('admin.category.create')}" class="btn-add">
                    <i class="fas fa-plus"></i> Add Category
                </a>
            </div>
        </div>
    </div>

    <div class="container-fluid" style="max-width:1300px;">

        
                <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-icon total"><i class="fas fa-layer-group"></i></div>
                <div>
                    <div class="stat-label">Total</div>
                    <div class="stat-value">${total}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon active"><i class="fas fa-eye"></i></div>
                <div>
                    <div class="stat-label">Active</div>
                    <div class="stat-value">${active}</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon draft"><i class="fas fa-eye-slash"></i></div>
                <div>
                    <div class="stat-label">Draft</div>
                    <div class="stat-value">${draft}</div>
                </div>
            </div>
        </div>

        
        <form method="GET" action="${url()?.current()}" class="search-card">
            <div class="fg">
                <label>Title</label>
                <input type="text" name="title" class="form-control" placeholder="Search title…" value="${request('title')}">
            </div>
            <div class="fg">
                <label>Slug</label>
                <input type="text" name="slug" class="form-control" placeholder="Search slug…" value="${request('slug')}">
            </div>
            <div class="fg" style="max-width:160px;">
                <label>Status</label>
                <select name="status" class="form-select">
                    <option value="">All</option>
                    <option value="active" ${request('status') === 'active' ? 'selected' : ''}>Active</option>
                    <option value="draft"  ${request('status') === 'draft'  ? 'selected' : ''}>Draft</option>
                </select>
            </div>
            <button type="submit" class="btn-search"><i class="fas fa-search"></i> Search</button>
            <a href="${url()?.current()}" class="btn-reset"><i class="fas fa-rotate-right"></i> Reset</a>
        </form>

        
        <div class="table-card">
            <div class="table-card-header">
                <h3>All Categories <span style="font-size:0.78rem;color:#A3A3A3;font-weight:400;margin-left:6px;">${total} total</span></h3>
                <div class="drag-hint"><i class="fas fa-grip-vertical"></i> Drag rows to reorder</div>
            </div>
            <div style="overflow-x:auto;">
                <table class="cat-table">
                    <thead>
                        <tr>
                            <th style="width:36px;"></th>
                            <th style="width:44px;">ID</th>
                            <th>Category</th>
                            <th>Image</th>
                            <th>Banner</th>
                            <th>Products</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th class="text-center" style="width:100px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="sortable-categories">
                        ${count(categories) ? foreach(categories, (category, loop) => html`                        <tr class="sortable-row" draggable="true" data-id="${category?.id}">
                            <td>
                                <span class="drag-handle" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></span>
                            </td>
                            <td style="color:#A3A3A3; font-size:0.78rem; font-weight:600;">#${category?.id}</td>
                            <td>
                                <div class="cat-title">${category?.title}</div>
                                <div class="cat-slug">/${category?.slug}</div>
                            </td>
                            <td>
                                ${(category?.image) ? html`                                    <a href="${asset('storage/'  +  (category?.image ?? ''))}" class="glightbox" data-gallery="cat-gallery">
                                        <img src="${asset('storage/'  +  (category?.image ?? ''))}" class="cat-thumb" alt="Image">
                                    </a>
                                ` : html`                                    <div class="no-thumb"><i class="fas fa-image"></i></div>
                                `}                            </td>
                            <td>
                                ${(category?.banner) ? html`                                    <a href="${asset('storage/'  +  (category?.banner ?? ''))}" class="glightbox" data-gallery="cat-gallery">
                                        <img src="${asset('storage/'  +  (category?.banner ?? ''))}" class="cat-thumb" alt="Banner">
                                    </a>
                                ` : html`                                    <div class="no-thumb"><i class="fas fa-panorama"></i></div>
                                `}                            </td>
                            <td>
                                <span class="prod-count">
                                    <i class="fas fa-box" style="font-size:.65rem;"></i>
                                    ${category?.products_count ?? category?.products()?.count()}
                                </span>
                            </td>
                            <td>
                                <span class="badge-status ${category?.status === 'active' ? 'badge-active' : 'badge-draft'}">
                                    ${ucfirst(category?.status ?? 'draft')}
                                </span>
                            </td>
                            <td style="color:#A3A3A3; font-size:0.78rem;" title="${category?.created_at}">
                                ${category?.created_at?.diffForHumans()}
                            </td>
                            <td>
                                ${(category?.title !== 'Home Page - New Arrival') ? html`                                <div class="action-wrap">
                                    <a href="${route('admin.category.edit', category?.id)}" class="act-btn edit" title="Edit">
                                        <i class="fas fa-pen"></i>
                                    </a>
                                    <form action="${route('admin.category.destroy', category?.id)}" method="POST" class="delete-form">
                                        ${csrf_field()} ${method_field('DELETE')}                                        <button type="submit" class="act-btn delete" title="Delete">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </form>
                                </div>
                                ` : html`                                    <div class="action-wrap"><span class="protected-badge"><i class="fas fa-lock"></i> Protected</span></div>
                                `}                            </td>
                        </tr>
                        `) : html`                        <tr>
                            <td colspan="9">
                                <div class="empty-state">
                                    <div class="empty-state-icon"><i class="fas fa-layer-group"></i></div>
                                    <h5>No categories found</h5>
                                    <p>Get started by <a href="${route('admin.category.create')}">adding your first category</a>.</p>
                                </div>
                            </td>
                        </tr>
                        `}                    </tbody>
                </table>
            </div>
        </div>

    </div>
</div>
</div>

`,
    scripts: html`<script src="https://cdn.jsdelivr.net/npm/glightbox/dist/js/glightbox.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function () {

    // ── GLightbox ──
    GLightbox({ selector: '.glightbox' });

    // ── SweetAlert delete confirm ──
    document.querySelectorAll('.delete-form').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            Swal.fire({
                title: 'Delete Category?',
                text: 'This cannot be undone. Products linked to this category will be unlinked.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#DC2626',
                cancelButtonColor: '#A3A3A3',
                confirmButtonText: 'Yes, delete it',
                cancelButtonText: 'Cancel',
                customClass: { popup: 'rounded-3 shadow' }
            }).then(result => { if (result.isConfirmed || result.value) form.submit(); });
        });
    });

    // ── Drag-and-drop sort ──
    const tbody = document.getElementById('sortable-categories');
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
            fetch('${route(`admin.category.sort`)}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '${csrf_token()}'
                },
                body: JSON.stringify({ order })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success', title: 'Order saved',
                        toast: true, position: 'top-end',
                        showConfirmButton: false, timer: 1500,
                        customClass: { popup: 'rounded-3 shadow' }
                    });
                }
            })
            .catch(() => {});
        });
        row.addEventListener('dragover', e => {
            e.preventDefault();
            if (!dragging || dragging === row) return;
            const rect = row.getBoundingClientRect();
            const mid  = rect.top + rect.height / 2;
            tbody.insertBefore(dragging, e.clientY < mid ? row : row.nextSibling);
        });
    });
});
</script>
`,
  };
}
