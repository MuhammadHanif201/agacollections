// "410 Gone" for pages of the domain's earlier Shopify store (jewellery and bags, /products/... and /collections/...).
// Nothing on this store replaces them, and 410 tells Google to drop them sooner than a 404 does.
export function gone(): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page no longer available | AGA Collections</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Arial,Helvetica,sans-serif;background:#f5f4f8;color:#161426;text-align:center;padding:24px}a{display:inline-block;margin-top:18px;padding:14px 28px;background:#161426;color:#fff;text-decoration:none;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase}</style></head>
<body><div><h1 style="font-weight:400">This page is no longer available</h1><p>AGA Collections sells streetwear: baggy jeans, oversized tees, shirts, jerseys and hoodies, with cash on delivery across Pakistan.</p><a href="/shop">Shop the collection</a></div></body></html>`;
  return new Response(html, { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}
