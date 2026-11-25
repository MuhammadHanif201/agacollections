import { adminAction, adminPage } from '@/lib/admin/http';
import { connectDb } from '@/lib/db';
import { matchCity, orioCities, orioConfig, orioPakistanId, orioPlatforms, orioStorePlatform, sendOrderToOrio, type OrioCity, type OrioReply } from '@/lib/orio';
import { Order } from '@/models/Order';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Admin page for the Orio connection: settings check, a connection test, and the latest orders
// with a "Send to Orio" button each (city picked automatically, changeable by hand).

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pkr = (n: unknown) => `PKR ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const snippet = (r: OrioReply | undefined) => r ? `<pre style="white-space:pre-wrap;background:#fafafa;border:1px solid #eee;border-radius:8px;padding:10px;font-size:12px;max-height:220px;overflow:auto">HTTP ${r.status}\n${esc((r.json ? JSON.stringify(r.json, null, 1) : r.text).slice(0, 1500))}</pre>` : '';
const BTN = 'padding:9px 16px;background:#111;color:#fff;border:0;border-radius:8px;font-size:14px;cursor:pointer';

async function testSection() {
  const [{ id: pk, reply: countries }, cities, platforms, chosen] = await Promise.all([orioPakistanId(), orioCities(true), orioPlatforms(), orioStorePlatform()]);
  return `<h3>Connection test</h3>
<p>Pakistan country id: <b>${pk}</b>. Cities loaded: <b>${cities.list.length}</b>${cities.list.length ? ` (e.g. ${esc(cities.list.slice(0, 8).map((c) => `${c.name} = ${c.id}`).join(', '))})` : ''}.</p>
<p>Platforms in Orio: ${platforms.list.length ? platforms.list.map((p) => `<b>${esc(p.name || '(no name)')}</b> (platform_id ${p.platformId ?? '-'}, customer_platform_id ${p.customerPlatformId ?? '-'})`).join('; ') : '<i>none read</i>'}.<br>
Used for orders: platform_id <b>${chosen.platformId ?? '-'}</b>, customer_platform_id <b>${chosen.customerPlatformId ?? '-'}</b>.</p>
<details><summary>Raw replies from Orio</summary><p>Countries</p>${snippet(countries)}<p>Cities</p>${snippet(cities.reply)}<p>Platforms</p>${snippet(platforms.reply)}</details>`;
}

async function page(opts: { test?: boolean; note?: string; noteOk?: boolean; reply?: OrioReply }) {
  await connectDb();
  const cfg = orioConfig();
  const orders = await Order.find().sort({ created_at: -1, _id: -1 }).limit(30).lean();
  let cities: OrioCity[] = [];
  let cityError = '';
  if (cfg.key) {
    const c = await orioCities();
    cities = c.list;
    if (!cities.length) cityError = 'Could not load cities from Orio: run the connection test below.';
  }
  const cityOptions = (selected: number | null) => `<option value="">Pick city…</option>` +
    cities.map((c) => `<option value="${c.id}"${c.id === selected ? ' selected' : ''}>${esc(c.name)}</option>`).join('');

  const rows = orders.map((o) => {
    const m = matchCity(o.shipping_city, cities);
    const state = o.orio_sent_at
      ? `<b style="color:#15803d">Sent</b>${o.orio_order_id ? ` (Orio #${esc(o.orio_order_id)})` : ''}<br><small>${esc(new Date(o.orio_sent_at).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }))}</small>`
      : o.orio_error ? `<b style="color:#b91c1c">Not sent</b><br><small>${esc(o.orio_error)}</small>` : '<span style="color:#555">Not sent</span>';
    const form = cfg.key ? `<form method="POST" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center" onsubmit="return confirm('Send order #${o._id} to Orio${o.orio_sent_at ? ' AGAIN' : ''}?')">
<input type="hidden" name="do" value="send"><input type="hidden" name="order" value="${o._id}">${o.orio_sent_at ? '<input type="hidden" name="force" value="1">' : ''}
<select name="city" style="padding:7px;max-width:170px">${cityOptions(m?.id ?? null)}</select>
<button style="${BTN}">${o.orio_sent_at ? 'Send again' : 'Send to Orio'}</button></form>` : '';
    return `<tr><td><a href="/admin/orders/${o._id}">#${o._id}</a><br><small>${esc(new Date(o.created_at).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi' }))}</small></td>
<td>${esc(o.shipping_name)}<br><small>${esc(o.shipping_phone)}</small></td><td>${esc(o.shipping_city)}${m ? `<br><small style="color:#15803d">Orio: ${esc(m.name)}</small>` : cities.length ? '<br><small style="color:#b45309">no match, pick by hand</small>' : ''}</td>
<td>${pkr(o.total)}<br><small>${esc(o.status)}</small></td><td>${state}</td><td>${form}</td></tr>`;
  }).join('');

  const note = opts.note ? `<div style="padding:12px 16px;background:${opts.noteOk ? '#dcfce7' : '#fee2e2'};border-radius:8px;margin:12px 0">${esc(opts.note)}${opts.reply ? snippet(opts.reply) : ''}</div>` : '';
  const settings = `<ul style="line-height:1.8">
<li>API key: ${cfg.key ? '<b style="color:#15803d">set</b>' : '<b style="color:#b91c1c">missing</b>: add <code>ORIO_API_KEY</code> in Vercel → Settings → Environment Variables, then redeploy'}</li>
<li>Account: <b>${esc(cfg.acno)}</b>, user id <b>${cfg.userId}</b></li>
<li>Automatic sending of new orders: ${cfg.autoSend ? '<b style="color:#15803d">on</b>' : '<b>off</b> (send by hand below; turn on with <code>ORIO_AUTO_SEND = 1</code> in Vercel once a test order looks right in Orio)'}</li></ul>`;

  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Orio | Admin</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px;background:#f6f6f6;color:#111}main{max-width:1100px;margin:0 auto;background:#fff;padding:24px;border-radius:12px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}td,th{border-bottom:1px solid #eee;padding:9px 8px;text-align:left;vertical-align:top}a{color:#111}small{color:#666}</style></head>
<body><main><p><a href="/admin/orders">&larr; Orders</a></p><h2>Orio</h2>${note}${settings}
${cfg.key ? (opts.test ? await testSection() : `<p><a href="/admin/orio?test=1" style="${BTN};text-decoration:none;display:inline-block">Test connection</a></p>`) : ''}
${cityError ? `<p style="color:#b91c1c">${esc(cityError)}</p>` : ''}
<h3>Latest orders</h3><table><thead><tr><th>Order</th><th>Customer</th><th>City</th><th>Total</th><th>Orio</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6">No orders yet.</td></tr>'}</tbody></table></main></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export const GET = adminPage(async ({ url }) => page({ test: url.searchParams.get('test') === '1' }));

export const POST = adminAction({
  POST: async ({ input }) => {
    if (input.do !== 'send') return page({});
    const id = Number(input.order);
    if (!Number.isInteger(id)) return page({ note: 'Unknown order.', noteOk: false });
    const r = await sendOrderToOrio(id, { cityId: Number(input.city) || null, force: input.force === '1' });
    return page({ note: `Order #${id}: ${r.message}${r.orioId ? ` (Orio #${r.orioId})` : ''}`, noteOk: r.ok, reply: r.reply });
  },
});
