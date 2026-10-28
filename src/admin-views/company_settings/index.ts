// Port of resources/views/adminside/company_settings/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, url, number_format, empty, ucfirst, max, min, optional, Str, entries, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { emails, emailIcons, labels } = d;

  return {
    title: html`<title>Company Settings — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="View and manage core company information — name, logo, contact, address and social profiles for ${optional(companySetting)?.name ?? 'AGA Collections'}.">
<meta name="keywords" content="company settings, store settings, branding, logo, contact info, social links, aga collections admin">
`,
    styles: html``,
    content: html`
<style>
.csi-page { padding: 32px 32px 72px; }

/* Hero */
.csi-hero {
    background: linear-gradient(135deg, #111111 0%, #1E3A5F 60%, #2A2A2A 100%);
    border-radius: 22px; padding: 28px 32px;
    position: relative; overflow: hidden; margin-bottom: 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.csi-hero::before {
    content: ''; position: absolute; inset: 0; opacity: .07;
    background-image: radial-gradient(circle at 1px 1px, #fff 1px, transparent 0);
    background-size: 28px 28px;
}
.csi-hero-body { position: relative; z-index: 1; display: flex; align-items: center; gap: 18px; }
.csi-hero-ico {
    width: 52px; height: 52px; border-radius: 15px; flex-shrink: 0;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18);
    backdrop-filter: blur(8px); display: flex; align-items: center;
    justify-content: center; font-size: 1.25rem; color: #fff;
}
.csi-hero-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin: 0; }
.csi-hero-sub   { font-size: .8rem; color: rgba(255,255,255,.55); margin: 2px 0 0; }
.csi-hero-actions { position: relative; z-index: 1; }
.csi-edit-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.15); border: 1.5px solid rgba(255,255,255,.25);
    color: #fff !important; border-radius: 12px; padding: 10px 20px;
    font-size: .84rem; font-weight: 700; text-decoration: none !important;
    transition: all .2s; backdrop-filter: blur(8px);
}
.csi-edit-btn:hover { background: rgba(255,255,255,.24); }

/* Section grid */
.csi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
@media (max-width: 768px) { .csi-grid { grid-template-columns: 1fr; } }
.csi-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
@media (max-width: 960px) { .csi-grid-3 { grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px) { .csi-grid-3 { grid-template-columns: 1fr; } }

/* Card */
.csi-card {
    background: #fff; border: 1px solid #E8EDF5;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 2px 14px rgba(15,23,42,.06);
}
.csi-card-hd {
    padding: 14px 20px; border-bottom: 1px solid #F4F4F4;
    display: flex; align-items: center; gap: 10px; background: #FAFBFE;
}
.csi-card-hd-ico {
    width: 30px; height: 30px; border-radius: 9px;
    background: rgba(17,17,17,.1); color: #111111;
    display: flex; align-items: center; justify-content: center; font-size: .78rem;
}
.csi-card-hd-title { font-size: .74rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .1em; }
.csi-card-body { padding: 20px; }

/* Info rows */
.csi-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; font-size: .85rem; color: #1C1C1C; }
.csi-row:last-child { margin-bottom: 0; }
.csi-row-lbl { font-size: .73rem; font-weight: 700; color: #A3A3A3; text-transform: uppercase; letter-spacing: .07em; min-width: 80px; flex-shrink: 0; padding-top: 2px; }
.csi-row-val { flex: 1; }

/* Badges */
.csi-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 6px; font-size: .73rem; font-weight: 700;
}
.csi-badge-green { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
.csi-badge-red   { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
.csi-badge-blue  { background: #F3F0E9; color: #2A2A2A; border: 1px solid #DDD7CB; }
.csi-badge-gray  { background: #FAFAFA; color: #737373; border: 1px solid #E5E5E5; }
.csi-badge-amber { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }

/* Logo preview */
.csi-logo-preview {
    width: 80px; height: 80px; border-radius: 13px; border: 1.5px solid #E5E5E5;
    object-fit: contain; background: #FAFAFA; padding: 4px;
}
.csi-favicon-preview {
    width: 32px; height: 32px; border-radius: 7px; border: 1px solid #E5E5E5;
    object-fit: contain; background: #FAFAFA;
}

/* Shipping table */
.csi-shipping-list { display: flex; flex-wrap: wrap; gap: 8px; }
.csi-shipping-item {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 12px; border-radius: 8px;
    background: #F4F4F4; border: 1px solid #E5E5E5;
    font-size: .8rem; font-weight: 600; color: #374151;
}

/* Empty state */
.csi-empty {
    text-align: center; padding: 56px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.csi-empty-ico {
    width: 64px; height: 64px; border-radius: 18px;
    background: #F4F4F4; display: flex; align-items: center; justify-content: center;
    font-size: 1.6rem; color: #A3A3A3;
}
.csi-empty h3 { font-size: 1rem; font-weight: 700; color: #374151; margin: 0; }
.csi-empty p  { font-size: .82rem; color: #A3A3A3; margin: 0; }
.csi-empty-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #2A2A2A, #111111); color: #fff !important;
    border-radius: 11px; padding: 11px 22px; font-size: .85rem; font-weight: 700;
    text-decoration: none !important; transition: all .2s;
    box-shadow: 0 4px 14px rgba(17,17,17,.3);
}
.csi-empty-btn:hover { transform: translateY(-1px); }
</style>

<div class="content-wrapper">
<div class="csi-page">

    
    <div class="csi-hero">
        <div class="csi-hero-body">
            <div class="csi-hero-ico"><i class="fas fa-building"></i></div>
            <div>
                <h1 class="csi-hero-title">Company Settings</h1>
                <p class="csi-hero-sub">Brand identity, contact info, shipping, and marketing integrations.</p>
            </div>
        </div>
        <div class="csi-hero-actions">
            <a href="${route('admin.company-settings.edit')}" class="csi-edit-btn">
                <i class="fas fa-pen"></i> Edit Settings
            </a>
        </div>
    </div>

    ${(companySetting) ? (() => { let emails = companySetting?.getEmailsAsAssociative();
let emailIcons: Record<string, any> = {'default':'fas fa-circle-dot','support':'fas fa-headset','sales':'fas fa-tag','contact':'fas fa-message'};
 return html`
    
    <div class="csi-grid">

        
        <div class="csi-card">
            <div class="csi-card-hd">
                <div class="csi-card-hd-ico"><i class="fas fa-palette"></i></div>
                <div class="csi-card-hd-title">Branding</div>
            </div>
            <div class="csi-card-body">
                <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;">
                    <img src="${companySetting?.logo_url}" alt="Logo" class="csi-logo-preview">
                    <div style="flex:1;">
                        <div style="font-size:1.05rem;font-weight:800;color:#111111;margin-bottom:4px;">
                            ${companySetting?.name}
                        </div>
                        ${(companySetting?.description) ? html`                        <div style="font-size:.8rem;color:#737373;line-height:1.5;margin-bottom:8px;">
                            ${Str.limit(companySetting?.description, 120)}
                        </div>
                        ` : ''}                        <div style="display:flex;align-items:center;gap:8px;">
                            <img src="${companySetting?.favicon_url}" alt="Favicon" class="csi-favicon-preview">
                            <span style="font-size:.72rem;color:#A3A3A3;">favicon</span>
                        </div>
                    </div>
                </div>
                ${(companySetting?.address) ? html`                <div class="csi-row">
                    <span class="csi-row-lbl">Address</span>
                    <span class="csi-row-val" style="font-size:.82rem;color:#525252;">${companySetting?.address}</span>
                </div>
                ` : ''}            </div>
        </div>

        
        <div class="csi-card">
            <div class="csi-card-hd">
                <div class="csi-card-hd-ico"><i class="fas fa-address-book"></i></div>
                <div class="csi-card-hd-title">Contact</div>
            </div>
            <div class="csi-card-body">
                                ${foreach(entries(emails), ([key, email], loop) => html`                ${(email) ? html`                <div class="csi-row">
                    <span class="csi-row-lbl">${ucfirst(key)}</span>
                    <span class="csi-row-val"><i class="${emailIcons?.[key] ?? 'fas fa-envelope'}" style="color:#111111;margin-right:5px;font-size:.75rem;"></i>${email}</span>
                </div>
                ` : ''}                `)}
                ${(!empty(companySetting?.phones)) ? html`                <div class="csi-row" style="margin-top:8px;">
                    <span class="csi-row-lbl">Phones</span>
                    <span class="csi-row-val">
                        ${foreach(companySetting?.phones, (p, loop) => html`                        <span class="csi-badge csi-badge-blue" style="margin:2px;"><i class="fas fa-phone"></i> ${p}</span>
                        `)}                    </span>
                </div>
                ` : ''}
                ${(!empty(companySetting?.whatsapps)) ? html`                <div class="csi-row">
                    <span class="csi-row-lbl">WhatsApp</span>
                    <span class="csi-row-val">
                        ${foreach(companySetting?.whatsapps, (w, loop) => html`                        <span class="csi-badge csi-badge-green" style="margin:2px;"><i class="fab fa-whatsapp"></i> ${w}</span>
                        `)}                    </span>
                </div>
                ` : ''}
                ${(!empty(companySetting?.social_links)) ? html`                <div class="csi-row" style="margin-top:8px;">
                    <span class="csi-row-lbl">Social</span>
                    <span class="csi-row-val" style="display:flex;flex-wrap:wrap;gap:4px;">
                        ${foreach(companySetting?.social_links, (sl, loop) => html`                        ${(!empty(sl?.['platform']) && !empty(sl?.['url'])) ? html`                        <a href="${sl?.['url']}" target="_blank" class="csi-badge csi-badge-gray" style="text-decoration:none;">
                            <i class="fab fa-${sl?.['platform']}"></i> ${ucfirst(sl?.['platform'])}
                        </a>
                        ` : ''}                        `)}                    </span>
                </div>
                ` : ''}            </div>
        </div>

    </div>

    
    <div class="csi-grid-3">

        
        <div class="csi-card">
            <div class="csi-card-hd">
                <div class="csi-card-hd-ico"><i class="fas fa-truck"></i></div>
                <div class="csi-card-hd-title">Shipping</div>
            </div>
            <div class="csi-card-body">
                <div class="csi-row">
                    <span class="csi-row-lbl">Mode</span>
                    <span class="csi-row-val">
                        <span class="csi-badge csi-badge-blue">
                            ${companySetting?.shipping_mode === 'by_region' ? 'By Region' : 'Flat Rate'}
                        </span>
                    </span>
                </div>
                <div class="csi-row">
                    <span class="csi-row-lbl">Free Ship</span>
                    <span class="csi-row-val">
                        ${(companySetting?.free_shipping_enabled) ? html`                        <span class="csi-badge csi-badge-green"><i class="fas fa-check"></i> Above PKR ${number_format(companySetting?.free_shipping_threshold, 0)}</span>
                        ` : html`                        <span class="csi-badge csi-badge-gray">Disabled</span>
                        `}                    </span>
                </div>
                ${(!empty(companySetting?.shipping_charges)) ? (() => { let labels: Record<string, any> = {
                        'karachi'          : 'Karachi',
                        'lahore'           : 'Lahore',
                        'islamabad'        : 'Islamabad',
                        'other_major'      : 'Other Major',
                        'rest_of_pakistan' : 'Rest of PK',
                        'remote'           : 'Remote',
                    };
 return html`                <div style="margin-top:12px;">
                                        <div class="csi-shipping-list">
                        ${foreach(entries(companySetting?.shipping_charges), ([code, cost], loop) => html`                        <div class="csi-shipping-item">
                            <span style="color:#A3A3A3;font-size:.7rem;">${labels?.[code] ?? code}</span>
                            <span style="color:#2A2A2A;font-weight:800;">PKR ${number_format(cost, 0)}</span>
                        </div>
                        `)}                    </div>
                </div>
                `; })() : ''}            </div>
        </div>


    </div>

    `; })() : html`    <div class="csi-card">
        <div class="csi-empty">
            <div class="csi-empty-ico"><i class="fas fa-building"></i></div>
            <h3>No Settings Found</h3>
            <p>Set up your company profile to get started.</p>
            <a href="${route('admin.company-settings.create')}" class="csi-empty-btn">
                <i class="fas fa-plus"></i> Create Company Settings
            </a>
        </div>
    </div>
    `}
</div>
</div>

`,
    scripts: html``,
  };
}
