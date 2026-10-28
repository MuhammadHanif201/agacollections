// Port of resources/views/adminside/headlines/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, session, csrf_field, method_field, count, empty, max, min, e, method_exists, optional, Str, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { headlines } = d;

  return {
    title: html`<title>Headlines — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Manage the marquee announcement headlines shown across ${optional(companySetting)?.name ?? 'AGA Collections'} to promote offers and news.">
<meta name="keywords" content="headlines, announcements, marquee, promotional banner, store news, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
.hl-page { padding: 32px 32px 72px; }

/* Hero */
.hl-hero {
    background: linear-gradient(135deg, #111111 0%, #1E3A5F 60%, #2A2A2A 100%);
    border-radius: 22px; padding: 28px 32px;
    position: relative; overflow: hidden; margin-bottom: 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.hl-hero::before {
    content: ''; position: absolute; inset: 0; opacity: .07;
    background-image: radial-gradient(circle at 1px 1px, #fff 1px, transparent 0);
    background-size: 28px 28px;
}
.hl-hero-body { position: relative; z-index: 1; display: flex; align-items: center; gap: 18px; }
.hl-hero-ico {
    width: 52px; height: 52px; border-radius: 15px; flex-shrink: 0;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18);
    backdrop-filter: blur(8px); display: flex; align-items: center;
    justify-content: center; font-size: 1.3rem; color: #fff;
}
.hl-hero-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin: 0; }
.hl-hero-sub   { font-size: .8rem; color: rgba(255,255,255,.55); margin: 3px 0 0; }
.hl-hero-btn {
    position: relative; z-index: 1;
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.25);
    color: #fff !important; border-radius: 12px; padding: 10px 20px;
    font-size: .84rem; font-weight: 700; text-decoration: none !important;
    transition: all .2s; backdrop-filter: blur(8px);
}
.hl-hero-btn:hover { background: rgba(255,255,255,.25); }

/* Stats */
.hl-stats { display: flex; gap: 14px; margin-bottom: 24px; flex-wrap: wrap; }
.hl-stat {
    flex: 1; min-width: 130px; background: #fff; border: 1px solid #E8EDF5;
    border-radius: 16px; padding: 16px 20px;
    box-shadow: 0 2px 10px rgba(15,23,42,.05);
}
.hl-stat-val { font-size: 1.6rem; font-weight: 800; color: #111111; line-height: 1; }
.hl-stat-lbl { font-size: .74rem; color: #A3A3A3; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: .07em; }

/* Card */
.hl-card {
    background: #fff; border: 1px solid #E8EDF5;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 2px 16px rgba(15,23,42,.06);
}
.hl-card-hd {
    padding: 16px 24px; border-bottom: 1px solid #F4F4F4;
    display: flex; align-items: center; justify-content: space-between;
    background: #FAFBFE;
}
.hl-card-hd-left { display: flex; align-items: center; gap: 10px; }
.hl-card-hd-ico {
    width: 32px; height: 32px; border-radius: 9px;
    background: rgba(17,17,17,.1); color: #111111;
    display: flex; align-items: center; justify-content: center; font-size: .8rem;
}
.hl-card-hd-title { font-size: .78rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .1em; }

/* Table */
.hl-table { width: 100%; border-collapse: collapse; }
.hl-table th {
    padding: 11px 16px; font-size: .72rem; font-weight: 700;
    color: #737373; text-transform: uppercase; letter-spacing: .08em;
    border-bottom: 1.5px solid #F4F4F4; background: #FAFBFE; white-space: nowrap;
}
.hl-table td {
    padding: 14px 16px; font-size: .85rem; color: #1C1C1C;
    border-bottom: 1px solid #FAFAFA; vertical-align: middle;
}
.hl-table tbody tr:hover td { background: #FAFAFA; }
.hl-table tbody tr:last-child td { border-bottom: none; }

/* Preview chip */
.hl-chip {
    display: inline-block; border-radius: 8px; padding: 5px 12px;
    font-size: .78rem; font-weight: 700; max-width: 280px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Status badge */
.hl-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px; font-size: .72rem; font-weight: 700;
}
.hl-badge-active   { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
.hl-badge-inactive { background: #FAFAFA; color: #737373; border: 1px solid #E5E5E5; }

/* Position pill */
.hl-pos {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 8px;
    background: #F3F0E9; color: #2A2A2A; font-size: .8rem; font-weight: 800;
    border: 1.5px solid #DDD7CB;
}

/* Actions */
.hl-action-edit {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 8px;
    background: #F3F0E9; border: 1.5px solid #DDD7CB; color: #2A2A2A !important;
    font-size: .78rem; font-weight: 700; text-decoration: none !important;
    transition: all .15s;
}
.hl-action-edit:hover { background: #E9E4D9; }
.hl-action-del {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 8px;
    background: #FEF2F2; border: 1.5px solid #FECACA; color: #EF4444;
    font-size: .78rem; font-weight: 700; cursor: pointer; border: 1.5px solid #FECACA;
    transition: all .15s; background: #FEF2F2;
}
.hl-action-del:hover { background: #EF4444; color: #fff; border-color: #EF4444; }

/* Empty */
.hl-empty { text-align: center; padding: 56px 24px; }
.hl-empty-ico {
    width: 64px; height: 64px; border-radius: 18px;
    background: #F4F4F4; display: flex; align-items: center; justify-content: center;
    font-size: 1.6rem; color: #A3A3A3; margin: 0 auto 12px;
}

/* Flash */
.hl-flash-ok  { background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:13px 18px;margin-bottom:20px;font-size:.84rem;color:#166534;display:flex;align-items:center;gap:9px; }
.hl-flash-err { background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;padding:13px 18px;margin-bottom:20px;font-size:.84rem;color:#991B1B;display:flex;align-items:center;gap:9px; }
</style>

<div class="content-wrapper">
<div class="hl-page">

    
    <div class="hl-hero">
        <div class="hl-hero-body">
            <div class="hl-hero-ico"><i class="fas fa-bullhorn"></i></div>
            <div>
                <h1 class="hl-hero-title">Headlines</h1>
                <p class="hl-hero-sub">Manage scrolling announcement banners shown on the storefront.</p>
            </div>
        </div>
        <a href="${route('admin.headlines.create')}" class="hl-hero-btn">
            <i class="fas fa-plus"></i> Add Headline
        </a>
    </div>

    
    ${(session('success')) ? html`    <div class="hl-flash-ok"><i class="fas fa-circle-check"></i> ${session('success')}</div>
    ` : ''}    ${(session('error')) ? html`    <div class="hl-flash-err"><i class="fas fa-triangle-exclamation"></i> ${session('error')}</div>
    ` : ''}
    
    <div class="hl-stats">
        <div class="hl-stat">
            <div class="hl-stat-val">${headlines?.total()}</div>
            <div class="hl-stat-lbl">Total Headlines</div>
        </div>
        <div class="hl-stat">
            <div class="hl-stat-val" style="color:#16A34A;">${headlines?.where('is_active', 1)?.count()}</div>
            <div class="hl-stat-lbl">Active</div>
        </div>
        <div class="hl-stat">
            <div class="hl-stat-val" style="color:#A3A3A3;">${headlines?.where('is_active', 0)?.count()}</div>
            <div class="hl-stat-lbl">Inactive</div>
        </div>
    </div>

    
    <div class="hl-card">
        <div class="hl-card-hd">
            <div class="hl-card-hd-left">
                <div class="hl-card-hd-ico"><i class="fas fa-table-list"></i></div>
                <div class="hl-card-hd-title">All Headlines</div>
            </div>
        </div>
        <div style="overflow-x:auto;">
            <table class="hl-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Headline Text</th>
                        <th>Preview</th>
                        <th style="width:80px;">Order</th>
                        <th>Window</th>
                        <th style="width:100px;">Status</th>
                        <th style="width:150px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${count(headlines) ? foreach(headlines, (h, loop) => html`                    <tr>
                        <td style="color:#A3A3A3;font-size:.8rem;font-weight:600;">${h?.id}</td>

                        <td style="max-width:300px;">
                            <div style="font-weight:600;color:#111111;" title="${h?.message_en}">
                                ${Str.limit(h?.message_en, 70)}
                            </div>
                            ${(h?.link_url) ? html`                            <div style="font-size:.72rem;color:#A3A3A3;margin-top:3px;">
                                <i class="fas fa-link" style="margin-right:3px;"></i>${Str.limit(h?.link_url, 40)}
                            </div>
                            ` : ''}                        </td>

                        <td>
                            <span class="hl-chip"
                                  style="background:${h?.bg_color  ||  '#111111'};color:${h?.text_color  ||  '#ffffff'};">
                                ${Str.limit(h?.message_en, 35)}
                            </span>
                        </td>

                        <td><span class="hl-pos">${h?.sort_order ?? 0}</span></td>

                        <td style="font-size:.78rem;color:#737373;white-space:nowrap;">
                            <div>${optional(h?.starts_at)?.format('Y-m-d H:i') ?? '—'}</div>
                            <div>${optional(h?.ends_at)?.format('Y-m-d H:i') ?? '—'}</div>
                        </td>

                        <td>
                            ${(h?.is_active) ? html`                            <span class="hl-badge hl-badge-active"><i class="fas fa-circle" style="font-size:.45rem;"></i> Active</span>
                            ` : html`                            <span class="hl-badge hl-badge-inactive"><i class="fas fa-circle" style="font-size:.45rem;"></i> Inactive</span>
                            `}                        </td>

                        <td>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                <a href="${route('admin.headlines.edit', h?.id)}" class="hl-action-edit">
                                    <i class="fas fa-pen"></i> Edit
                                </a>
                                <form action="${route('admin.headlines.destroy', h?.id)}" method="POST"
                                      class="hl-delete-form" style="margin:0;">
                                    ${csrf_field()} ${method_field('DELETE')}                                    <button type="submit" class="hl-action-del" style="font-family:inherit;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    `) : html`                    <tr>
                        <td colspan="7">
                            <div class="hl-empty">
                                <div class="hl-empty-ico"><i class="fas fa-bullhorn"></i></div>
                                <div style="font-size:.95rem;font-weight:700;color:#374151;margin-bottom:6px;">No headlines yet</div>
                                <div style="font-size:.82rem;color:#A3A3A3;margin-bottom:16px;">Add your first announcement banner.</div>
                                <a href="${route('admin.headlines.create')}" class="hl-hero-btn"
                                   style="background:linear-gradient(135deg,#2A2A2A,#111111);border:none;box-shadow:0 4px 14px rgba(17,17,17,.35);">
                                    <i class="fas fa-plus"></i> Add Headline
                                </a>
                            </div>
                        </td>
                    </tr>
                    `}                </tbody>
            </table>
        </div>

        ${(method_exists(headlines, 'links')) ? html`        <div style="padding:14px 20px;border-top:1px solid #F4F4F4;background:#FAFBFE;">
            ${headlines?.withQueryString()?.links()}
        </div>
        ` : ''}    </div>

</div>
</div>
`,
    scripts: html`<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
document.querySelectorAll('.hl-delete-form').forEach(function(form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        Swal.fire({
            title: 'Delete this headline?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel'
        }).then(function(result) {
            if (result.isConfirmed || result.value) form.submit();
        });
    });
});
</script>
`,
  };
}
