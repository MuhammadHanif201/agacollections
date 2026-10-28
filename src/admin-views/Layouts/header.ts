// Port of resources/views/adminside/Layouts/header.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, url, request, csrf_token, csrf_field, Auth, strtoupper, substr, strrpos, max, min, optional } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let {  } = d;
  let navPending = d.pendingOrders;
  let pendingOrders = d.pendingOrders;
  let pendingReviewsCount = d.pendingReviews;
  return {
    title: html``,
    styles: html``,
    content: html`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="author" content="Nabeel Imrani - Website Developer">
    <meta name="csrf-token" content="${csrf_token()}">
    <meta name="robots" content="noindex, nofollow">

    ${d.title}
    <link rel="shortcut icon" type="image/x-icon"
        href="${url(optional(companySetting)?.favicon ? 'storage/'  +  (companySetting?.favicon ?? '') : 'clientside/company_logo/favicon.png')}">

    <!-- Google Fonts: Archivo + Manrope (same pair as the AGA Collections storefront) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="${asset('adminSide/plugins/fontawesome-free/css/all.min.css')}">
    <!-- Ionicons -->
    <link rel="stylesheet" href="${asset('adminSide/plugins/ionicons/ionicons.min.css')}">
    <!-- Bootstrap -->
    <link rel="stylesheet" href="${asset('adminSide/plugins/bootstrap/5.1.3/css/bootstrap.min.css')}">
    <!-- AdminLTE -->
    <link rel="stylesheet" href="${asset('adminSide/dist/css/adminlte.min.css')}">
    <!-- Plugins -->
    <link rel="stylesheet" href="${asset('adminSide/plugins/overlayScrollbars/css/OverlayScrollbars.min.css')}">
    <link rel="stylesheet" href="${asset('adminSide/plugins/daterangepicker/daterangepicker.css')}">
    <link rel="stylesheet" href="${asset('adminSide/plugins/summernote/summernote-bs4.css')}">
    <link rel="stylesheet" href="${asset('adminSide/plugins/sweetalert2-theme-bootstrap-4/bootstrap-4.min.css')}">
    <link rel="stylesheet" href="${asset('adminSide/plugins/toastr/toastr.min.css')}">
    <link rel="stylesheet" href="${asset('adminSide/plugins/jquery-ui/jquery-ui.min.css')}">
    <!-- Quill -->
    <link rel="stylesheet" href="${asset('adminSide/plugins/quill/2.0.2/quill.snow.css')}">
    <!-- Tagify -->
    <link rel="stylesheet" href="${asset('adminSide/plugins/tagify/3.14.1/tagify.min.css')}">
    <link rel="stylesheet" href="${asset('adminSide/dist/css/custom.css')}">

    <style>
        /* ═══════════════════════════════════════════════════════════════
           AGA Collections — Admin Panel Design System  v2.0
           Professional Navy + Blue  (no pink)
        ═══════════════════════════════════════════════════════════════ */

        :root {
            /* ── Primary Accent ── */
            --dc-blue:           #111111;
            --dc-blue-dark:      #2A2A2A;
            --dc-blue-light:     #F3F0E9;
            --dc-blue-muted:     rgba(17,17,17,0.12);

            /* Backwards-compat aliases used by older templates */
            --dc-crimson:        #111111;
            --dc-crimson-dark:   #2A2A2A;
            --dc-crimson-light:  #F3F0E9;
            --dc-crimson-muted:  rgba(17,17,17,0.12);

            /* ── Sidebar ── */
            --sidebar-bg:          #111111;
            --sidebar-surface:     #1A2235;
            --sidebar-hover:       rgba(255,255,255,0.06);
            --sidebar-active-bg:   rgba(17,17,17,0.14);
            --sidebar-active-text: #FFE6DC;
            --sidebar-text:        #A3A3A3;
            --sidebar-text-dim:    #525252;
            --sidebar-header:      #525252;
            --sidebar-border:      rgba(255,255,255,0.07);
            --sidebar-width:       256px;

            /* ── Navbar ── */
            --navbar-height:       58px;
            --navbar-bg:           #ffffff;
            --navbar-border:       #E5E5E5;

            /* ── Content ── */
            --page-bg:             #FAFAFA;
            --surface:             #ffffff;
            --surface-2:           #FAFAFA;
            --border:              #E5E5E5;
            --border-strong:       #D4D4D4;

            /* ── Text ── */
            --text-primary:        #111111;
            --text-secondary:      #525252;
            --text-muted:          #A3A3A3;

            /* ── Status ── */
            --clr-success:         #10B981;
            --clr-warning:         #F59E0B;
            --clr-danger:          #EF4444;
            --clr-info:            #6366F1;
        }

        /* ── Base font ── */
        body, .main-sidebar, .main-header, .content-wrapper,
        .main-footer, button, input, select, textarea {
            font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif !important;
        }

        /* ══════════════════════════════════════════════════════════════
           TOP NAVBAR
        ══════════════════════════════════════════════════════════════ */
        .main-header.navbar {
            height: var(--navbar-height) !important;
            background: var(--navbar-bg) !important;
            border-bottom: 1px solid var(--navbar-border) !important;
            box-shadow: 0 1px 0 var(--navbar-border) !important;
            padding: 0 1.25rem !important;
        }

        .main-header [data-widget="pushmenu"] {
            width: 36px; height: 36px; border-radius: 9px;
            display: flex !important; align-items: center; justify-content: center;
            color: var(--text-secondary) !important; font-size: 1rem;
            transition: background .15s, color .15s;
        }
        .main-header [data-widget="pushmenu"]:hover {
            background: var(--page-bg); color: var(--text-primary) !important;
        }

        .navbar-divider {
            width: 1px; height: 20px; background: var(--border);
            margin: 0 .6rem; align-self: center;
        }

        .main-header .nav-link {
            color: var(--text-secondary) !important; font-size: .8375rem;
            font-weight: 500; padding: .4rem .7rem; border-radius: 8px;
            transition: background .15s, color .15s;
        }
        .main-header .nav-link:hover {
            background: var(--page-bg); color: var(--text-primary) !important;
        }

        .navbar-search {
            display: flex; align-items: center; gap: .5rem;
            background: var(--page-bg); border: 1px solid var(--border);
            border-radius: 10px; padding: .38rem .75rem; min-width: 200px;
            transition: border-color .15s, box-shadow .15s;
        }
        .navbar-search:focus-within {
            border-color: var(--dc-blue);
            box-shadow: 0 0 0 3px rgba(17,17,17,.12);
        }
        .navbar-search i { color: var(--text-muted); font-size: .8rem; }
        .navbar-search input {
            border: none !important; background: transparent !important;
            font-size: .8375rem; color: var(--text-primary);
            outline: none; width: 100%; padding: 0 !important; box-shadow: none !important;
        }
        .navbar-search input::placeholder { color: var(--text-muted); }

        .navbar-user-chip {
            display: flex; align-items: center; gap: .5rem;
            padding: .3rem .65rem .3rem .3rem; border-radius: 30px;
            border: 1px solid var(--border); background: var(--surface);
            cursor: default; transition: background .15s, border-color .15s;
        }
        .navbar-user-chip:hover { background: var(--page-bg); border-color: var(--border-strong); }

        .user-avatar {
            width: 30px; height: 30px; border-radius: 50%;
            background: linear-gradient(135deg, #111111 0%, #2A2A2A 100%);
            color: #fff; font-size: .72rem; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; letter-spacing: .03em;
        }
        .user-name {
            font-size: .8125rem; font-weight: 600; color: var(--text-primary);
            max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .navbar-logout {
            display: inline-flex; align-items: center; gap: .4rem;
            padding: .35rem .75rem; border-radius: 9px; font-size: .8125rem;
            font-weight: 500; color: var(--clr-danger) !important;
            border: 1px solid rgba(239,68,68,.2); background: rgba(239,68,68,.05);
            text-decoration: none; transition: background .15s, border-color .15s;
        }
        .navbar-logout:hover { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.35); }

        /* ══════════════════════════════════════════════════════════════
           SIDEBAR
        ══════════════════════════════════════════════════════════════ */
        .main-sidebar {
            background: var(--sidebar-bg) !important;
            border-right: 1px solid rgba(255,255,255,.05) !important;
            box-shadow: none !important;
            width: var(--sidebar-width) !important;
        }

        .brand-link {
            padding: 0 1.1rem !important; height: var(--navbar-height) !important;
            border-bottom: 1px solid var(--sidebar-border) !important;
            background: transparent !important;
            display: flex !important; align-items: center !important; gap: .75rem;
            text-decoration: none !important;
        }
        .brand-link:hover { background: rgba(255,255,255,.03) !important; }

        .brand-image {
            width: 34px !important; height: 34px !important; object-fit: contain;
            border-radius: 9px !important; margin: 0 !important; float: none !important;
            background: rgba(255,255,255,.07); padding: 3px;
            border: 1px solid rgba(255,255,255,.1); flex-shrink: 0;
        }

        .brand-text { display: flex !important; flex-direction: column; line-height: 1.2 !important; }
        .brand-name {
            font-size: .9375rem !important; font-weight: 700 !important;
            color: #FFFFFF !important; letter-spacing: .01em;
        }
        .brand-sub {
            font-size: .68rem; font-weight: 400; color: var(--sidebar-header);
            letter-spacing: .06em; text-transform: uppercase;
        }

        .user-panel {
            border-bottom: 1px solid var(--sidebar-border) !important;
            padding: .9rem 1.1rem !important; margin: 0 !important;
            background: var(--sidebar-surface) !important;
        }
        .up-avatar {
            width: 34px; height: 34px; border-radius: 50%;
            background: linear-gradient(135deg, #111111, #2A2A2A);
            display: flex; align-items: center; justify-content: center;
            color: #fff; font-size: .75rem; font-weight: 700; flex-shrink: 0;
        }
        .up-name {
            font-size: .8375rem; font-weight: 600; color: #E5E5E5;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .up-role {
            font-size: .7rem; color: var(--sidebar-header);
            font-weight: 400; text-transform: uppercase; letter-spacing: .06em;
        }

        .nav-header {
            font-size: .6rem !important; font-weight: 700 !important;
            letter-spacing: .16em !important; color: var(--sidebar-header) !important;
            padding: 1.1rem 1.1rem .35rem !important; text-transform: uppercase !important;
        }

        .nav-sidebar .nav-link {
            color: var(--sidebar-text) !important; border-radius: 8px !important;
            margin: 1px 8px !important; padding: .5rem .85rem !important;
            font-size: .835rem !important; font-weight: 500 !important;
            transition: background .15s, color .15s !important;
            display: flex !important; align-items: center !important;
        }
        .nav-sidebar .nav-link:hover {
            background: var(--sidebar-hover) !important; color: #D4D4D4 !important;
        }
        .nav-sidebar .nav-link.active {
            background: var(--sidebar-active-bg) !important;
            color: var(--sidebar-active-text) !important; font-weight: 600 !important;
        }
        .nav-sidebar .nav-link .nav-icon {
            width: 1.3rem !important; font-size: .825rem !important;
            color: inherit !important; opacity: .6; margin-right: .65rem !important; text-align: center;
        }
        .nav-sidebar .nav-link.active .nav-icon { opacity: 1; }

        .nav-sidebar .nav-link .right {
            margin-left: auto !important; font-size: .65rem !important;
            opacity: .3; transition: transform .2s !important;
        }
        .nav-item.menu-open > .nav-link .right { transform: rotate(-90deg) !important; opacity: .5; }

        .nav-treeview {
            background: rgba(0,0,0,.2) !important; border-radius: 8px !important;
            margin: 2px 8px !important; padding: .3rem 0 !important;
        }
        .nav-treeview .nav-link {
            margin: 1px 4px !important; font-size: .8rem !important;
            color: var(--sidebar-text-dim) !important; padding: .38rem .85rem !important;
        }
        .nav-treeview .nav-link:hover { color: #A3A3A3 !important; }
        .nav-treeview .nav-link.active {
            color: var(--sidebar-active-text) !important;
            background: var(--sidebar-active-bg) !important;
        }
        .nav-treeview .nav-icon {
            font-size: .38rem !important; color: inherit !important; opacity: .5;
            width: 1rem !important; margin-right: .6rem !important;
        }

        /* ── Ensure <p> tags in nav links don't break flex alignment ── */
        .nav-sidebar .nav-link p,
        .nav-treeview .nav-link p {
            margin: 0 !important;
            flex: 1 !important;
            display: flex !important;
            align-items: center !important;
            line-height: 1.4 !important;
            font-size: inherit !important;
        }
        /* Badge inside nav p */
        .nav-sidebar .nav-link p .badge,
        .nav-treeview .nav-link p .badge {
            margin-left: auto !important;
        }

        .sidebar {
            overflow-y: auto; scrollbar-width: thin;
            scrollbar-color: rgba(17,17,17,.15) transparent;
        }
        .sidebar::-webkit-scrollbar { width: 3px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .sidebar::-webkit-scrollbar-thumb { background: rgba(17,17,17,.18); border-radius: 4px; }
        .sidebar::-webkit-scrollbar-thumb:hover { background: rgba(17,17,17,.35); }

        /* ══════════════════════════════════════════════════════════════
           CONTENT WRAPPER
        ══════════════════════════════════════════════════════════════ */
        .content-wrapper { background: var(--page-bg) !important; }

        .content-header { padding: 1.1rem 1.5rem .4rem !important; }
        .content-header h1 {
            font-size: 1.2rem !important; font-weight: 700 !important;
            color: var(--text-primary) !important; letter-spacing: -.01em;
        }
        .breadcrumb-item a { color: var(--dc-blue) !important; text-decoration: none; }
        .breadcrumb-item a:hover { color: var(--dc-blue-dark) !important; }
        .breadcrumb-item.active { color: var(--text-muted) !important; }

        /* Page hero banner */
        .page-hero {
            background: linear-gradient(135deg, #111111 0%, #1C1C1C 100%);
            border-radius: 14px; padding: 1.35rem 1.6rem; margin-bottom: 1.5rem;
            display: flex; align-items: center; justify-content: space-between;
            gap: 1rem; border: 1px solid rgba(17,17,17,.18);
            position: relative; overflow: hidden;
        }
        .page-hero::after {
            content: ''; position: absolute; right: -40px; top: -40px;
            width: 180px; height: 180px;
            background: radial-gradient(circle, rgba(17,17,17,.14), transparent 70%);
            pointer-events: none;
        }
        .page-hero h1 { font-size: 1.1rem; font-weight: 700; color: #F4F4F4; margin: 0; }
        .page-hero p  { font-size: .8rem; color: rgba(163,163,163,.8); margin: .2rem 0 0; }

        /* ══════════════════════════════════════════════════════════════
           GLOBAL COMPONENT OVERRIDES
        ══════════════════════════════════════════════════════════════ */

        /* ── Buttons ── */
        .btn-primary {
            background: var(--dc-blue) !important; border-color: var(--dc-blue) !important;
            color: #fff !important; font-weight: 600; border-radius: 9px !important;
        }
        .btn-primary:hover {
            background: var(--dc-blue-dark) !important; border-color: var(--dc-blue-dark) !important;
        }
        .btn-outline-primary {
            color: var(--dc-blue) !important; border-color: var(--dc-blue) !important; border-radius: 9px !important;
        }
        .btn-outline-primary:hover {
            background: var(--dc-blue) !important; border-color: var(--dc-blue) !important; color: #fff !important;
        }
        .btn { border-radius: 9px !important; font-weight: 500; }

        /* ── Cards ── */
        .card {
            border: 1px solid var(--border) !important; border-radius: 14px !important;
            box-shadow: 0 1px 4px rgba(15,23,42,.05) !important; background: var(--surface) !important;
        }
        .card-header {
            background: var(--surface-2) !important; border-bottom: 1px solid var(--border) !important;
            color: var(--text-secondary) !important; font-size: .75rem !important;
            font-weight: 700 !important; text-transform: uppercase !important;
            letter-spacing: .08em !important; padding: .9rem 1.25rem !important;
            border-radius: 14px 14px 0 0 !important;
        }
        .card-footer {
            background: var(--surface-2) !important; border-top: 1px solid var(--border) !important;
            border-radius: 0 0 14px 14px !important;
        }
        .card-body { padding: 1.25rem !important; }

        /* ── Forms ── */
        .form-control, .form-select {
            border: 1.5px solid var(--border-strong) !important; border-radius: 9px !important;
            font-size: .875rem !important; color: var(--text-primary) !important;
            background: var(--surface) !important; transition: border-color .15s, box-shadow .15s;
        }
        .form-control:focus, .form-select:focus {
            border-color: var(--dc-blue) !important;
            box-shadow: 0 0 0 3px rgba(17,17,17,.15) !important; outline: none;
        }
        .form-label {
            font-size: .8rem !important; font-weight: 600 !important;
            color: var(--text-secondary) !important; margin-bottom: .35rem !important; letter-spacing: .01em;
        }
        .input-group-text {
            border: 1.5px solid var(--border-strong) !important;
            background: var(--surface-2) !important; color: var(--text-muted) !important; border-radius: 9px !important;
        }

        /* ── Tables ── */
        .table > :not(caption) > * > * {
            border-bottom-color: var(--border) !important; padding: .75rem 1rem !important;
        }
        .table thead th {
            color: var(--text-muted) !important; font-size: .72rem !important;
            font-weight: 700 !important; letter-spacing: .08em !important;
            text-transform: uppercase !important; background: var(--surface-2) !important;
        }
        .table-hover > tbody > tr:hover > * { background: #F7F5F0 !important; }
        .table-light, .table-light > th, .table-light > td {
            background: var(--surface-2) !important; color: var(--text-secondary) !important;
        }

        /* ── Badges ── */
        .badge { border-radius: 6px !important; font-weight: 600 !important; font-size: .7rem !important; }
        .badge.bg-primary, .badge.bg-blue { background: var(--dc-blue) !important; }
        .badge.bg-success                 { background: var(--clr-success) !important; }
        .badge.bg-warning                 { background: var(--clr-warning) !important; color: #fff !important; }
        .badge.bg-danger                  { background: var(--clr-danger) !important; }
        .badge.bg-info                    { background: var(--clr-info) !important; }
        .badge.bg-secondary               { background: #A3A3A3 !important; }
        .badge.bg-dark                    { background: #1C1C1C !important; }

        /* ── Alerts ── */
        .alert { border-radius: 10px !important; font-size: .875rem !important; border-width: 1px !important; }
        .alert-success { background: rgba(16,185,129,.08) !important; border-color: rgba(16,185,129,.25) !important; color: #065F46 !important; }
        .alert-danger  { background: rgba(239,68,68,.07)  !important; border-color: rgba(239,68,68,.22)  !important; color: #B91C1C !important; }
        .alert-warning { background: rgba(245,158,11,.08) !important; border-color: rgba(245,158,11,.25) !important; color: #92400E !important; }
        .alert-info    { background: rgba(99,102,241,.08) !important; border-color: rgba(99,102,241,.22) !important; color: #3730A3 !important; }

        /* ── Pagination ── */
        .pagination .page-link {
            color: var(--dc-blue) !important; border-color: var(--border) !important;
            border-radius: 8px !important; margin: 0 2px; font-size: .8125rem;
        }
        .pagination .page-link:hover { background: var(--dc-blue-light) !important; }
        .pagination .page-item.active .page-link {
            background: var(--dc-blue) !important; border-color: var(--dc-blue) !important; color: #fff !important;
        }
        .pagination .page-item.disabled .page-link {
            color: var(--text-muted) !important; border-color: var(--border) !important;
        }

        /* ── Modals ── */
        .modal-content { border-radius: 16px !important; border: 1px solid var(--border) !important; }
        .modal-header { border-bottom: 1px solid var(--border) !important; padding: 1.25rem 1.5rem !important; }
        .modal-footer { border-top: 1px solid var(--border) !important; }
        .modal-title { font-weight: 700 !important; color: var(--text-primary) !important; font-size: 1rem !important; }

        /* ── Focus ring ── */
        *:focus-visible { outline: 2px solid var(--dc-blue); outline-offset: 2px; }

        /* ── Content links ── */
        .content-wrapper a:not(.btn):not(.nav-link) { color: var(--dc-blue); }
        .content-wrapper a:not(.btn):not(.nav-link):hover { color: var(--dc-blue-dark); }

        /* ── Select2 ── */
        .select2-container--default .select2-selection--single {
            border: 1.5px solid var(--border-strong) !important;
            border-radius: 9px !important; height: calc(1.5em + .75rem + 2px) !important;
        }
        .select2-container--default .select2-selection--single:focus,
        .select2-container--default.select2-container--focus .select2-selection--multiple {
            border-color: var(--dc-blue) !important;
            box-shadow: 0 0 0 3px rgba(17,17,17,.15) !important;
        }

        /* ── SweetAlert2 ── */
        .swal2-popup.swal2-toast { border-radius: 12px !important; }

        /* ── Quill editor ── */
        .ql-toolbar { border-radius: 9px 9px 0 0 !important; border-color: var(--border-strong) !important; }
        .ql-container { border-radius: 0 0 9px 9px !important; border-color: var(--border-strong) !important; }

        /* ══════════════════════════════════════════════════════════════
           AGA Collections STOREFRONT MATCH — "Street Bold": ink + blaze orange,
           condensed heavy headings (Archivo), Manrope text, pill buttons
        ══════════════════════════════════════════════════════════════ */
        :root { --zq-blaze: #FF4F1F; --zq-paper: #F3F0E9; }
        body, .main-sidebar, .main-header, .content-wrapper,
        .main-footer, button, input, select, textarea {
            font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif !important;
        }
        .content-wrapper { background: var(--zq-paper) !important; }
        .content-header h1, .page-hero h1, .modal-title, .brand-name,
        .card-title, h1, h2, h3, h4, h5 {
            font-family: 'Archivo', 'Arial Narrow', Arial, sans-serif !important;
            font-weight: 800 !important;
            font-stretch: 80%;
            text-transform: uppercase;
            letter-spacing: 0 !important;
        }
        .brand-name { font-weight: 900 !important; font-stretch: 75%; font-size: 1.25rem !important; letter-spacing: -.01em !important; }
        .brand-name::after { content: ''; display: inline-block; width: 7px; height: 7px; margin-left: 3px; border-radius: 50%; background: var(--zq-blaze); }

        .nav-sidebar .nav-link.active {
            color: #FFFFFF !important;
            background: rgba(255,79,31,.14) !important;
            box-shadow: inset 3px 0 0 var(--zq-blaze);
        }
        .nav-sidebar .nav-link.active .nav-icon { color: var(--zq-blaze) !important; }
        .nav-sidebar .nav-link:hover { color: #FFFFFF !important; }
        .nav-header { letter-spacing: .18em !important; color: rgba(255,255,255,.4) !important; }

        .user-avatar, .up-avatar {
            background: var(--zq-blaze) !important; color: #111111 !important; border: 0;
        }

        .btn, .navbar-logout, .pagination .page-link { border-radius: 999px !important; }
        .form-control, .form-select, .input-group-text,
        .select2-container--default .select2-selection--single { border-radius: 10px !important; }
        .card, .page-hero { border-radius: 14px !important; border: 0 !important; }
        .card-header { border-radius: 14px 14px 0 0 !important; letter-spacing: .1em !important; }
        .card-footer { border-radius: 0 0 14px 14px !important; }
        .modal-content { border-radius: 14px !important; }

        .btn-primary, .btn-dark {
            text-transform: uppercase; letter-spacing: .06em; font-size: .78rem; font-weight: 800 !important;
        }
        .btn-primary:hover, .btn-dark:hover {
            background: var(--zq-blaze) !important; border-color: var(--zq-blaze) !important; color: #111111 !important;
        }
        .pagination .page-item.active .page-link { background: var(--zq-blaze) !important; border-color: var(--zq-blaze) !important; color: #111111 !important; }
        .form-control:focus, .form-select:focus { border-color: #111111 !important; box-shadow: 0 0 0 3px rgba(255,79,31,.22) !important; }
        .page-hero { border-bottom: 3px solid var(--zq-blaze) !important; }
        .badge.bg-warning { color: #111111 !important; }
    </style>

    ${d.styles}</head>

<body class="hold-transition sidebar-mini">
    <div class="wrapper">

        
        <nav class="main-header navbar navbar-expand navbar-white navbar-light">

            <ul class="navbar-nav align-items-center">
                
                <li class="nav-item">
                    <a class="nav-link p-0" data-widget="pushmenu" href="#" role="button" aria-label="Toggle sidebar"
                       style="width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-bars" style="font-size:.9rem;"></i>
                    </a>
                </li>

                <div class="navbar-divider d-none d-sm-flex"></div>

                
                <li class="nav-item d-none d-sm-inline-block">
                    <a href="${route('admin.home')}" class="nav-link"
                       style="display:flex;align-items:center;gap:.35rem;">
                        <i class="fas fa-gauge-high" style="font-size:.75rem;opacity:.5;"></i>
                        <span style="font-weight:600;color:#1C1C1C;">AGA Collections</span>
                        <span style="opacity:.35;font-size:.75rem;">— Admin</span>
                    </a>
                </li>
            </ul>

            <ul class="navbar-nav ms-auto align-items-center gap-2">

                
                                ${(navPending > 0) ? html`                <li class="nav-item d-none d-md-flex">
                    <a href="${route('admin.orders.index')}" class="nav-link"
                       style="display:flex;align-items:center;gap:.4rem;font-size:.8rem;">
                        <i class="fas fa-bag-shopping" style="font-size:.8rem;"></i>
                        <span>Orders</span>
                        <span class="badge bg-warning text-dark" style="font-size:.65rem;">${navPending}</span>
                    </a>
                </li>
                <div class="navbar-divider d-none d-md-flex"></div>
                ` : ''}
                
                <li class="nav-item d-none d-md-flex">
                    <div class="navbar-user-chip">
                        <div class="user-avatar">
                            ${strtoupper(substr(Auth.user()?.name, 0, 1))}${strtoupper(substr(Auth.user()?.name, (strrpos(Auth.user()?.name,' ') as number) + 1, 1))}
                        </div>
                        <span class="user-name">${Auth.user()?.name}</span>
                    </div>
                </li>

                
                <li class="nav-item">
                    <a class="navbar-logout" href="${route('admin.logout')}"
                       onclick="event.preventDefault(); document.getElementById('navbar-logout-form').submit();"
                       aria-label="Logout">
                        <i class="fas fa-arrow-right-from-bracket"></i>
                        <span class="d-none d-sm-inline">Logout</span>
                    </a>
                    <form id="navbar-logout-form" action="${route('admin.logout')}" method="POST" class="d-none">
                        ${csrf_field()}                    </form>
                </li>

            </ul>
        </nav>

        
        <aside class="main-sidebar sidebar-dark-primary elevation-0">

            
            <a href="${route('admin.home')}" class="brand-link">
                <img src="${asset(optional(companySetting)?.logo ? 'storage/' + (companySetting?.logo ?? '') : 'clientside/company_logo/default-logo.png')}"
                    alt="Logo" class="brand-image img-circle elevation-0">
                <span class="brand-text">
                    <span class="brand-name">${optional(companySetting)?.company_name ?? 'AGA Collections'}</span>
                    <span class="brand-sub">Admin Panel</span>
                </span>
            </a>

            <div class="sidebar">

                
                <div class="user-panel d-flex align-items-center gap-2">
                    <div class="up-avatar">
                        ${strtoupper(substr(Auth.user()?.name, 0, 1))}${strtoupper(substr(Auth.user()?.name, (strrpos(Auth.user()?.name,' ') as number) + 1, 1))}
                    </div>
                    <div style="min-width:0">
                        <div class="up-name">${Auth.user()?.name}</div>
                        <div class="up-role">Administrator</div>
                    </div>
                </div>

                <nav class="mt-2 pb-4">
                    <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">

                        
                        <li class="nav-item">
                            <a href="${route('admin.home')}"
                               class="nav-link ${request()?.routeIs('admin.home') ? 'active' : ''}">
                                <i class="nav-icon fas fa-gauge-high"></i>
                                <p>Dashboard</p>
                            </a>
                        </li>

                        
                        <li class="nav-header">Sales</li>

                        <li class="nav-item">
                            <a href="${route('admin.orders.index')}"
                               class="nav-link ${request()?.routeIs('admin.orders.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-bag-shopping"></i>
                                                                <p>
                                    Orders
                                    ${(pendingOrders > 0) ? html`                                        <span class="badge bg-warning text-dark">${pendingOrders}</span>
                                    ` : ''}                                </p>
                            </a>
                        </li>

                        <li class="nav-item has-treeview ${request()?.is('admin/customorders*') ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${request()?.is('admin/customorders*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-pen-ruler"></i>
                                <p>Custom Orders <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.customorders.create')}"
                                       class="nav-link ${request()?.routeIs('admin.customorders.create') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Create Order</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.customorders.index')}"
                                       class="nav-link ${request()?.routeIs('admin.customorders.index') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>All Custom Orders</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.customers.index')}"
                               class="nav-link ${request()?.routeIs('admin.customers.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-users"></i>
                                <p>Customers</p>
                            </a>
                        </li>

                        
                        <li class="nav-header">Affiliate Program</li>

                        <li class="nav-item has-treeview ${(request()?.routeIs('admin.affiliates.*') || request()?.routeIs('admin.affiliate-withdrawals.*')) ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${(request()?.routeIs('admin.affiliates.*') || request()?.routeIs('admin.affiliate-withdrawals.*')) ? 'active' : ''}">
                                <i class="nav-icon fas fa-handshake"></i>
                                <p>Affiliates <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.affiliates.index')}"
                                       class="nav-link ${request()?.routeIs('admin.affiliates.*') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>All Affiliates</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.affiliate-withdrawals.index')}"
                                       class="nav-link ${request()?.routeIs('admin.affiliate-withdrawals.*') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Withdrawals</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        
                        <li class="nav-header">Catalog</li>

                        <li class="nav-item has-treeview ${request()?.routeIs('admin.category.*') ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${request()?.routeIs('admin.category.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-layer-group"></i>
                                <p>Categories <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.category.create')}"
                                       class="nav-link ${request()?.routeIs('admin.category.create') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Add Category</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.category.index')}"
                                       class="nav-link ${request()?.routeIs('admin.category.index') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>All Categories</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li class="nav-item has-treeview ${request()?.routeIs('admin.products.*') ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${request()?.routeIs('admin.products.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-shirt"></i>
                                <p>Products <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.products.create')}"
                                       class="nav-link ${request()?.routeIs('admin.products.create') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Add Product</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.products.index')}"
                                       class="nav-link ${request()?.routeIs('admin.products.index') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>All Products</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.reviews.index')}"
                               class="nav-link ${request()?.routeIs('admin.reviews.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-star"></i>
                                                                <p>
                                    Product Reviews
                                    ${(pendingReviewsCount > 0) ? html`                                        <span class="badge bg-warning text-dark">${pendingReviewsCount}</span>
                                    ` : ''}                                </p>
                            </a>
                        </li>

                        
                        <li class="nav-header">Marketing</li>

                        <li class="nav-item has-treeview ${request()?.routeIs('admin.coupon.*') ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${request()?.routeIs('admin.coupon.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-ticket"></i>
                                <p>Coupons <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.coupon.create')}"
                                       class="nav-link ${request()?.routeIs('admin.coupon.create') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Add Coupon</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.coupon.index')}"
                                       class="nav-link ${request()?.routeIs('admin.coupon.index') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>All Coupons</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li class="nav-item has-treeview ${request()?.routeIs('admin.newsletter.*') ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${request()?.routeIs('admin.newsletter.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-envelope-open-text"></i>
                                <p>Email Newsletter <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.newsletter.subscribers.index')}"
                                       class="nav-link ${request()?.routeIs('admin.newsletter.subscribers.*') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Subscribers</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.newsletter.campaigns.index')}"
                                       class="nav-link ${request()?.routeIs('admin.newsletter.campaigns.*') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Campaigns</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li class="nav-item has-treeview ${request()?.routeIs('admin.headlines.*') ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${request()?.routeIs('admin.headlines.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-bullhorn"></i>
                                <p>Announcement Bar <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.headlines.create')}"
                                       class="nav-link ${request()?.routeIs('admin.headlines.create') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Add Announcement</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.headlines.index')}"
                                       class="nav-link ${request()?.routeIs('admin.headlines.index') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>All Announcements</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.popup.edit')}"
                               class="nav-link ${request()?.routeIs('admin.popup.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-rectangle-ad"></i>
                                <p>Popup Banner</p>
                            </a>
                        </li>

                        
                        <li class="nav-header">Content</li>

                        <li class="nav-item has-treeview ${request()?.routeIs('admin.slider.*') ? 'menu-open' : ''}">
                            <a href="#" class="nav-link ${request()?.routeIs('admin.slider.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-images"></i>
                                <p>Homepage Sliders <i class="right fas fa-angle-left"></i></p>
                            </a>
                            <ul class="nav nav-treeview">
                                <li class="nav-item">
                                    <a href="${route('admin.slider.create')}"
                                       class="nav-link ${request()?.routeIs('admin.slider.create') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>Add Slide</p>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="${route('admin.slider.index')}"
                                       class="nav-link ${request()?.routeIs('admin.slider.index') ? 'active' : ''}">
                                        <i class="fa-solid fa-circle nav-icon"></i>
                                        <p>All Slides</p>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.pages.about.edit')}"
                               class="nav-link ${request()?.routeIs('admin.pages.about.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-file-lines"></i>
                                <p>About Page</p>
                            </a>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.policies.index')}"
                               class="nav-link ${request()?.routeIs('admin.policies.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-file-shield"></i>
                                <p>Store Policies</p>
                            </a>
                        </li>

                        
                        <li class="nav-header">System</li>

                        <li class="nav-item">
                            <a href="${route('admin.company-settings.edit')}"
                               class="nav-link ${request()?.routeIs('admin.company-settings.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-building"></i>
                                <p>Store Settings</p>
                            </a>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.admins.index')}"
                               class="nav-link ${request()?.routeIs('admin.admins.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-users-gear"></i>
                                <p>Admin Users</p>
                            </a>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.adminprofile')}"
                               class="nav-link ${request()?.routeIs('admin.adminprofile') ? 'active' : ''}">
                                <i class="nav-icon fas fa-circle-user"></i>
                                <p>My Profile</p>
                            </a>
                        </li>

                        <li class="nav-item">
                            <a href="${route('admin.audits.audits')}"
                               class="nav-link ${request()?.routeIs('admin.audits.*') ? 'active' : ''}">
                                <i class="nav-icon fas fa-clock-rotate-left"></i>
                                <p>Audit Log</p>
                            </a>
                        </li>

                    </ul>
                </nav>
            </div>
        </aside>
`,
    scripts: html``,
  };
}
