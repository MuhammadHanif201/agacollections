// Port of resources/views/layouts/app.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, asset, config, csrf_token, empty, min } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let {  } = d;
  let brandName = companySetting?.name ?? config('app.name','AGA Collections');
  let brandTagline = 'Streetwear Made for Your Style';
  let favicon = (!empty(companySetting?.logo))
          ? asset('storage/' + (companySetting?.logo ?? ''))
          : asset('clientside/company_logo/default-logo.png');
  return {
    title: html``,
    styles: html``,
    content: html`<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="${csrf_token()}">

    <!-- SEO defaults (override per page if needed) -->
    <title>${brandName} | ${d.title ?? brandTagline}</title>
    <meta name="description" content="${d.metaDescription ?? brandTagline}">

    <link rel="icon" href="${favicon}">
    <link rel="apple-touch-icon" href="${favicon}">

    <!-- Fonts (Luxury: Playfair + Inter) -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&family=playfair-display:500,600,700" rel="stylesheet" />

    <!-- Bootstrap -->
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css"
          integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg=="
          crossorigin="anonymous" referrerpolicy="no-referrer" />

    <!-- Font Awesome -->
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
          integrity="sha512-pV4B+V9+FbWnJKtvQotWbZ8OtEPbuP/oM15OfQ0g1OqGVUP2usya+fSWeTJvZQLIITyV8u3vu1aHY2gnMw3aAw=="
          crossorigin="anonymous" referrerpolicy="no-referrer" />

    <!-- Global theme helpers -->
    <style>
        :root{
            --oj-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif;
            --oj-font-serif: "Playfair Display", ui-serif, Georgia, "Times New Roman", serif;
        }
        body{
            font-family: var(--oj-font-sans);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .dc-serif{ font-family: var(--oj-font-serif); }
    </style>

    ${d.styles}
</head>

<body class="${d.bodyClass}">

    <div id="app" class="min-vh-100">
        <main class="${d.mainClass ?? 'py-4'}">
            ${d.content}        </main>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.bundle.min.js"
            integrity="sha512-7Pi/otdlbbCR+LnW+F7PwFcSDJOuUJB3OxtEHbg4vSMvzvJjde4Po1v4BR9Gdc9aXNUNFVUY+SK51wWT8WF0Gg=="
            crossorigin="anonymous" referrerpolicy="no-referrer"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/js/all.min.js"
            integrity="sha512-b+nQTCdtTBIRIbraqNEwsjB6UvL3UEMkXnhzd8awtCYh0Kcsjl9uEgwVFVbhoj3uu1DO1ZMacNvLoyJJiNfcvg=="
            crossorigin="anonymous" referrerpolicy="no-referrer"></script>

    ${d.scripts}</body>
</html>
`,
    scripts: html``,
  };
}
