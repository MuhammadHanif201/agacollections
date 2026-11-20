import { adminAction, adminPage } from '@/lib/admin/http';
import { applySizes, sizePlan, SIZE_SETS, type SizePlanRow, type SizeSetKey } from '@/services/admin/bulkSizes';

export const dynamic = 'force-dynamic';

// Admin tool: set the size list of every jeans product (26-38) or hoodie (S-XL) in one go.
// GET shows what will change; nothing is saved until "Apply" is pressed.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const setKey = (v: unknown): SizeSetKey => (v === 'hoodies' ? 'hoodies' : 'jeans');

function page(key: SizeSetKey, rows: SizePlanRow[], done: boolean) {
  const set = SIZE_SETS[key];
  const changing = rows.filter((r) => !r.skipped && (r.added.length || r.removed.length));
  const body = rows.map((r) => {
    const status = r.skipped ? `<span style="color:#b45309">Skipped: ${esc(r.skipped)}</span>`
      : !r.added.length && !r.removed.length ? '<span style="color:#15803d">Already right</span>'
      : [r.added.length ? `<b style="color:#15803d">add ${esc(r.added.join(', '))}</b> (stock 0)` : '',
         r.removed.length ? `<b style="color:#b91c1c">remove ${r.removed.map((x) => `${esc(x.size)}${x.qty ? ` (${x.qty} in stock)` : ''}`).join(', ')}</b>` : ''].filter(Boolean).join('<br>');
    return `<tr><td><a href="/admin/products/${r.id}/edit">${esc(r.name)}</a></td><td>${esc(r.before.join(', ') || '-')}</td><td>${status}</td></tr>`;
  }).join('');
  const tabs = (Object.keys(SIZE_SETS) as SizeSetKey[]).map((k) => `<a href="/admin/products/sizes?set=${k}" style="margin-right:14px;${k === key ? 'font-weight:700;text-decoration:underline' : ''}">${SIZE_SETS[k].label}: ${SIZE_SETS[k].sizes.join(', ')}</a>`).join('');
  const action = done
    ? `<p style="padding:12px 16px;background:#dcfce7;border-radius:8px">Done. ${changing.length ? 'The sizes are saved; new sizes have stock 0, so set their stock on each product if you have them.' : 'Nothing needed changing.'}</p>`
    : changing.length
      ? `<form method="POST" onsubmit="return confirm('Change the sizes of ${changing.length} product(s)?')"><input type="hidden" name="set" value="${key}"><button style="padding:12px 22px;background:#111;color:#fff;border:0;border-radius:8px;font-size:15px;cursor:pointer">Apply to ${changing.length} product(s)</button></form>`
      : '<p>Every product already has these sizes.</p>';
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Bulk sizes | Admin</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;background:#f6f6f6;color:#111}main{max-width:1000px;margin:0 auto;background:#fff;padding:24px;border-radius:12px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}td,th{border-bottom:1px solid #eee;padding:9px 8px;text-align:left;vertical-align:top}a{color:#111}</style></head>
<body><main><p><a href="/admin/products">&larr; Products</a></p><h2>Bulk sizes: ${esc(set.label)} ${esc(set.sizes.join(', '))}</h2><p>${tabs}</p>
<p style="color:#555">Sizes a product already has keep their stock, price, SKU and image. Missing sizes are added with stock 0 at the product's price. Sizes not in the list are removed.</p>
${action}<table><thead><tr><th>Product</th><th>Sizes now</th><th>${done ? 'Result' : 'Change'}</th></tr></thead><tbody>${body}</tbody></table></main></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export const GET = adminPage(async ({ url }) => {
  const key = setKey(url.searchParams.get('set'));
  return page(key, await sizePlan(key), false);
});

export const POST = adminAction({
  POST: async ({ input }) => {
    const key = setKey(input.set);
    return page(key, await applySizes(key), true);
  },
});
