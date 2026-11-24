import { adminAction, adminPage } from '@/lib/admin/http';
import { createNewHoodies, featureNewHoodies, newHoodiePlan, placeAfterOriginals, NEW_HOODIE_COMPARE, NEW_HOODIE_PRICE, NEW_HOODIE_SIZES, TEMPLATE_SLUG, type NewHoodieRow } from '@/services/admin/newHoodies';

export const dynamic = 'force-dynamic';

// Admin tool: add the 450 GSM oversized hoodie in 7 colours (PKR 3,499, was 4,499) in one go.
// GET shows exactly what will be created; nothing is saved until "Create" is pressed.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function page(rows: NewHoodieRow[], description: string | null, done: boolean, error: string | null) {
  const todo = rows.filter((r) => !r.exists);
  const body = rows.map((r) => {
    const status = r.created ? '<b style="color:#15803d">Created</b>'
      : r.error ? `<b style="color:#b91c1c">Failed: ${esc(r.error)}</b>`
      : r.exists ? '<span style="color:#b45309">Already on the site, left alone</span>'
      : 'Will be created';
    const link = r.created || r.exists ? `<a href="/product/${esc(r.slug)}" target="_blank">${esc(r.name)}</a>` : esc(r.name);
    return `<tr><td><img src="${esc(r.image)}" alt="" style="width:60px;height:80px;object-fit:cover;border:1px solid #eee"></td><td>${link}</td><td>${status}</td></tr>`;
  }).join('');
  const action = error
    ? `<p style="padding:12px 16px;background:#fee2e2;border-radius:8px">${esc(error)}</p>`
    : done
      ? `<p style="padding:12px 16px;background:#dcfce7;border-radius:8px">Done. The hoodies are live under the same categories as the Black one. Open any of them in Products to change stock or photos.</p>`
      : todo.length
        ? `<form method="POST" onsubmit="return confirm('Create ${todo.length} hoodie product(s)?')">
<label style="display:block;margin:0 0 12px">Stock for <b>each size</b> (${NEW_HOODIE_SIZES.join(', ')}) of each colour:
<input type="number" name="stock" min="0" max="999" required style="width:90px;padding:8px;margin-left:8px;font-size:15px"></label>
<button style="padding:12px 22px;background:#111;color:#fff;border:0;border-radius:8px;font-size:15px;cursor:pointer">Create ${todo.length} hoodie(s)</button></form>`
        : `<p>All of these hoodies are already on the site.</p>
<form method="POST"><input type="hidden" name="do" value="order"><p style="margin:0 0 8px">Shop order: Dusty Lavender 1st, Black 2nd, then the new colours (in the order below).</p>
<button style="padding:12px 22px;background:#111;color:#fff;border:0;border-radius:8px;font-size:15px;cursor:pointer">Fix order</button></form>
<form method="POST" style="margin-top:18px"><input type="hidden" name="do" value="feature"><p style="margin:0 0 8px">Home page: show all the new colours at the start of "New In" (marks them Featured; untick Featured on a product to take it off).</p>
<button style="padding:12px 22px;background:#111;color:#fff;border:0;border-radius:8px;font-size:15px;cursor:pointer">Show on home page</button></form>`;
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>New hoodies | Admin</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;background:#f6f6f6;color:#111}main{max-width:900px;margin:0 auto;background:#fff;padding:24px;border-radius:12px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}td,th{border-bottom:1px solid #eee;padding:9px 8px;text-align:left;vertical-align:middle}a{color:#111}</style></head>
<body><main><p><a href="/admin/products">&larr; Products</a></p><h2>New 450 GSM oversized hoodies</h2>
<p>Price <b>PKR ${NEW_HOODIE_PRICE.toLocaleString('en-US')}</b>, crossed-out <b>PKR ${NEW_HOODIE_COMPARE.toLocaleString('en-US')}</b>. Sizes ${NEW_HOODIE_SIZES.join(', ')}. Category, description, type, tags and cost are copied from <a href="/product/${TEMPLATE_SLUG}" target="_blank">450 GSM Essential Oversized Hoodie - Black</a>.</p>
<p style="color:#555;margin-bottom:4px">Description that will be used:</p><div style="padding:10px 14px;background:#fafafa;border:1px solid #eee;border-radius:8px;font-size:14px">${description ? esc(description.replace(/<[^>]+>/g, ' ')) : '<i>(empty)</i>'}</div>
<div style="margin-top:16px">${action}</div>
<table><thead><tr><th>Photo</th><th>Product</th><th>${done ? 'Result' : 'Status'}</th></tr></thead><tbody>${body}</tbody></table></main></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

/** the page again, with a "done" note above the button */
async function withNote(res: Response, note: string) {
  const html = (await res.text()).replace('<div style="margin-top:16px">',
    `<div style="margin-top:16px"><p style="padding:12px 16px;background:#dcfce7;border-radius:8px">${note}</p>`);
  return new Response(html, { headers: res.headers });
}

export const GET = adminPage(async () => {
  const { template, rows } = await newHoodiePlan();
  return page(rows, template?.description ?? null, false, template ? null : `The template product (${TEMPLATE_SLUG}) was not found.`);
});

export const POST = adminAction({
  POST: async ({ input, req, admin, url }) => {
    if (input.do === 'order') {
      await placeAfterOriginals();
      const { template, rows } = await newHoodiePlan();
      return withNote(page(rows, template?.description ?? null, false, null), 'Order fixed. Dusty Lavender and Black are 1st and 2nd; the new colours follow from 3rd.');
    }
    if (input.do === 'feature') {
      await featureNewHoodies();
      const { template, rows } = await newHoodiePlan();
      return withNote(page(rows, template?.description ?? null, false, null), 'Done. All the new colours now show first in "New In" on the home page.');
    }
    const stock = Math.max(0, Math.min(999, Math.floor(Number(input.stock) || 0)));
    const { rows, error } = await createNewHoodies(url.origin, stock, req, admin._id);
    const { template } = await newHoodiePlan();
    return page(rows, template?.description ?? null, true, error);
  },
});
