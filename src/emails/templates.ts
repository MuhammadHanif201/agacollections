// Email bodies ported from resources/views/emails/*.blade.php with the same markup.
// e() escapes like Blade's {{ }}; values written with raw() were {!! !!} in Blade.
import { escapeHtml as e, formatDate, numberFormat, ucfirst } from '@/lib/format';
import type { CompanySettingDoc } from '@/models/content';

export interface OrderMailItem {
  name: string | null;
  slug: string | null;
  image: string | null; // absolute URL
  optionsLabel: string;
  quantity: number;
  price: number;
  /** the "was" price as the product card reads it (variant sale_price, else product sale_price) */
  wasPriceRaw: number;
}

export interface OrderMailData {
  id: number;
  created_at: Date;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon_code?: string | null;
  payment_method?: string | null;
  order_notes?: string | null;
  contact: { name: string | null; email: string | null; phone: string | null; address: string | null; city: string | null };
  items: OrderMailItem[];
}

const karachi = (d: Date) => new Date(d.getTime() + 5 * 3600 * 1000); // Asia/Karachi is UTC+5, no DST
const money = (v: number) => 'PKR ' + numberFormat(v, 0);

/** PHP parse_url($s, PHP_URL_PATH) trimmed of "/" */
function urlPath(u: string): string {
  try { return new URL(u).pathname.replace(/^\/+|\/+$/g, ''); } catch { return ''; }
}
function hostOf(u: string): string {
  try { return new URL(u).hostname || u; } catch { return u; }
}
const isIp = (h: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(':');

const wasPrice = (i: OrderMailItem) => (i.wasPriceRaw > i.price ? i.wasPriceRaw : 0);

interface OrderMailContext {
  setting: CompanySettingDoc | null;
  siteUrl: string;
  policiesUrl: string;
  productUrl: (slug: string) => string;
  helpEmail: string | null;
  appName: string;
}

export function customerOrderHtml(order: OrderMailData, ctx: OrderMailContext): string {
  const brand = ctx.setting?.name ?? ctx.appName;
  const navy = '#161426';
  const site = ctx.siteUrl;
  const host = hostOf(site);
  const showHost = host !== 'localhost' && !isIp(host);
  const phone = ctx.setting?.phones?.[0] ?? null;
  let waDigits = phone ? phone.replace(/\D+/g, '') : null;
  if (waDigits && waDigits.startsWith('0')) waDigits = '92' + waDigits.slice(1);
  const waLink = waDigits ? 'https://wa.me/' + waDigits + '?text=' + encodeURIComponent('Hi ' + brand + ', about my order #' + order.id) : null;
  const socials = (ctx.setting?.social_links ?? []).filter((s) => s.url && urlPath(s.url) !== '');
  const returnsUrl = ctx.policiesUrl + '#return';
  const saved = order.items.reduce((s, i) => s + (wasPrice(i) ? (wasPrice(i) - i.price) * i.quantity : 0), 0) + Number(order.discount);
  const isCod = (order.payment_method ?? 'cod') === 'cod';
  const firstName = (order.contact.name ?? '').trim().split(' ')[0]?.trim() || 'there';
  const placedAt = formatDate(karachi(order.created_at), 'd M Y, h:i A');
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const steps = ['Received', 'Confirmed', 'Shipped', 'Delivered'];

  const stepCells = steps.map((step, i) => `
                        <td width="25%" align="center" valign="top" style="font-family:Arial,Helvetica,sans-serif;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="50%" style="border-bottom:2px solid ${i === 0 ? '#ffffff' : '#e2e0ea'};font-size:0;line-height:0;">&nbsp;</td>
                                    <td rowspan="2" width="26" align="center" valign="middle">
                                        <div style="width:26px;height:26px;line-height:26px;border-radius:13px;text-align:center;font-size:12px;font-weight:bold;${i === 0 ? 'background:' + navy + ';color:#ffffff;' : 'background:#ffffff;color:#a7a4ba;border:2px solid #e2e0ea;width:22px;height:22px;line-height:22px;'}">${i === 0 ? '✓' : i + 1}</div>
                                    </td>
                                    <td width="50%" style="border-bottom:2px solid ${i === steps.length - 1 ? '#ffffff' : '#e2e0ea'};font-size:0;line-height:0;">&nbsp;</td>
                                </tr>
                                <tr><td style="font-size:0;line-height:0;">&nbsp;</td><td style="font-size:0;line-height:0;">&nbsp;</td></tr>
                            </table>
                            <div class="tz-step-label" style="margin-top:10px;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:${i === 0 ? navy : '#a7a4ba'};">${step}</div>
                        </td>`).join('');

  const itemRows = order.items.map((item) => {
    const productUrl = item.slug ? ctx.productUrl(item.slug) : site;
    const was = wasPrice(item);
    return `
                    <tr>
                        <td width="84" valign="top" style="padding:18px 16px 18px 0;border-bottom:1px solid #eeedf3;">
                            <a href="${e(productUrl)}" style="display:block;width:72px;height:90px;background:#f3f2ef;">
                                ${item.image ? `<img src="${e(item.image)}" width="72" height="90" alt="${e(item.name ?? 'Item')}" style="display:block;width:72px;height:90px;object-fit:cover;border:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.3;color:#8a86a3;overflow:hidden;">` : ''}
                            </a>
                        </td>
                        <td valign="top" style="padding:20px 0 18px;border-bottom:1px solid #eeedf3;">
                            <a href="${e(productUrl)}" style="font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${navy};text-decoration:none;">${e(item.name ?? 'Item')}</a>
                            ${item.optionsLabel ? `<div style="margin-top:6px;font-size:12px;color:#8a86a3;">${e(item.optionsLabel)}</div>` : ''}
                            <div style="margin-top:6px;font-size:12px;color:#8a86a3;">Qty ${item.quantity} × ${e(money(item.price))}</div>
                        </td>
                        <td align="right" valign="top" style="padding:20px 0 18px 12px;border-bottom:1px solid #eeedf3;white-space:nowrap;font-size:14px;font-weight:bold;color:${navy};">
                            ${e(money(item.price * item.quantity))}
                            ${was ? `<div style="margin-top:4px;font-size:12px;font-weight:normal;color:#a7a4ba;text-decoration:line-through;">${e(money(was * item.quantity))}</div>` : ''}
                        </td>
                    </tr>`;
  }).join('');

  const socialLinks = socials.map((s, idx) =>
    `<a href="${e(s.url)}" style="color:#ffffff;text-decoration:none;">${e(ucfirst(s.platform ?? 'Social'))}</a>${idx < socials.length - 1 ? '<span style="color:#5d5980;">&nbsp;&nbsp;·&nbsp;&nbsp;</span>' : ''}`,
  ).join('\n                            ');

  const footerLinks = [
    waLink ? `<a href="${e(waLink)}" style="color:#9d98bd;text-decoration:none;">WhatsApp ${e(phone ?? '')}</a>` : null,
    ctx.helpEmail ? `<a href="mailto:${e(ctx.helpEmail)}" style="color:#9d98bd;text-decoration:none;">${e(ctx.helpEmail)}</a>` : null,
    showHost ? `<a href="${e(site)}" style="color:#9d98bd;text-decoration:none;">${e(host)}</a>` : null,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Order #${order.id} received · ${e(brand)}</title>
    <style>
        body { margin: 0; padding: 0; background: #efeee9; }
        a { text-decoration: none; }
        @media (max-width: 620px) {
            .tz-wrap { width: 100% !important; }
            .tz-pad { padding-left: 22px !important; padding-right: 22px !important; }
            .tz-col { display: block !important; width: 100% !important; padding: 0 0 18px 0 !important; }
            .tz-h1 { font-size: 30px !important; }
            .tz-btn { display: block !important; width: 100% !important; margin: 0 0 10px 0 !important; box-sizing: border-box; }
            .tz-step-label { font-size: 9px !important; letter-spacing: 1px !important; }
            .tz-hide-sm { display: none !important; }
            .tz-due-label { letter-spacing: 1px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#efeee9;">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Order #${order.id} received – ${e(money(order.total))}${isCod ? ' COD' : ''}.${saved > 0 ? e(' You saved ' + money(saved) + '.') : ''}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#efeee9;">
<tr><td align="center" style="padding:28px 12px;">

<table role="presentation" class="tz-wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;">

    <tr>
        <td align="center" style="background:#0d0c18;padding:9px 16px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#cfcbe6;">
            Made for Your Style<span class="tz-hide-sm"> &nbsp;·&nbsp; Cash on Delivery Across Pakistan</span>
        </td>
    </tr>

    <tr>
        <td align="center" style="background:${navy};padding:38px 24px 34px;">
            <a href="${e(site)}" style="text-decoration:none;"><img src="${e(site)}/clientside/company_logo/monogram-aga.png" width="70" height="40" alt="" style="display:block;margin:0 auto 14px;width:70px;height:auto;border:0;"></a>
            <a href="${e(site)}" style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:bold;letter-spacing:8px;color:#ffffff;text-decoration:none;padding-left:8px;">${e(brand.toUpperCase())}</a>
            <div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9d98bd;">Streetwear &nbsp;·&nbsp; Lahore</div>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:44px 44px 8px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a86a3;font-weight:bold;">Order received</div>
            <h1 class="tz-h1" style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-style:italic;font-size:36px;line-height:1.15;color:${navy};">Thank you, ${e(firstName)}.</h1>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#4b4a57;">
                Your order is in. We may call or WhatsApp you on <strong style="color:${navy};">${e(order.contact.phone ?? '')}</strong> to confirm it, then we pack it and send it your way.
            </p>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:26px 44px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e6e4ef;">
                <tr>
                    <td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a86a3;">Order number</div>
                        <div style="margin-top:4px;font-size:22px;font-weight:bold;color:${navy};">#${order.id}</div>
                    </td>
                    <td align="right" style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a86a3;">Placed on</div>
                        <div style="margin-top:6px;font-size:13px;color:#4b4a57;">${e(placedAt)}</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:30px 44px 6px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>${stepCells}
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:34px 44px 0;font-family:Arial,Helvetica,sans-serif;">
            <div style="padding-bottom:12px;border-bottom:2px solid ${navy};font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;color:${navy};">
                Your order &nbsp;<span style="color:#8a86a3;font-weight:normal;letter-spacing:1px;">(${itemCount} ${itemCount === 1 ? 'item' : 'items'})</span>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${itemRows}
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:18px 44px 0;font-family:Arial,Helvetica,sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#4b4a57;">
                <tr>
                    <td style="padding:5px 0;">Subtotal</td>
                    <td align="right" style="padding:5px 0;">${e(money(order.subtotal))}</td>
                </tr>
                ${Number(order.discount) > 0 ? `<tr>
                    <td style="padding:5px 0;">Discount${order.coupon_code ? e(' (' + order.coupon_code + ')') : ''}</td>
                    <td align="right" style="padding:5px 0;color:#2d7a4a;">− ${e(money(order.discount))}</td>
                </tr>` : ''}
                <tr>
                    <td style="padding:5px 0;">Delivery</td>
                    <td align="right" style="padding:5px 0;">${Number(order.shipping) > 0 ? e(money(order.shipping)) : 'Free'}</td>
                </tr>
                ${saved > 0 ? `<tr>
                    <td style="padding:5px 0;color:#2d7a4a;font-weight:bold;">You saved</td>
                    <td align="right" style="padding:5px 0;color:#2d7a4a;font-weight:bold;">${e(money(saved))}</td>
                </tr>` : ''}
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:16px 44px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${navy};">
                <tr>
                    <td style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;">
                        <div class="tz-due-label" style="font-size:10px;letter-spacing:3px;text-transform:uppercase;white-space:nowrap;color:#9d98bd;">${isCod ? 'Pay on delivery' : 'Order total'}</div>
                        <div style="margin-top:4px;font-size:13px;color:#cfcbe6;">${isCod ? 'Please keep the exact cash ready for the courier.' : 'Paid online.'}</div>
                    </td>
                    <td align="right" style="padding:20px 22px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#ffffff;white-space:nowrap;">
                        ${e(money(order.total))}
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:34px 44px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td class="tz-col" width="50%" valign="top" style="padding-right:14px;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;color:#8a86a3;">Delivering to</div>
                        <div style="margin-top:10px;font-size:14px;line-height:1.7;color:#4b4a57;">
                            <strong style="color:${navy};">${e(order.contact.name ?? '')}</strong><br>
                            ${e(order.contact.address ?? '')}<br>
                            ${e(order.contact.city ?? '')}<br>
                            ${e(order.contact.phone ?? '')}
                        </div>
                    </td>
                    <td class="tz-col" width="50%" valign="top" style="padding-left:14px;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;color:#8a86a3;">Estimated delivery</div>
                        <div style="margin-top:10px;font-size:14px;line-height:1.7;color:#4b4a57;">
                            <strong style="color:${navy};">2–4 working days</strong> to Karachi, Lahore &amp; Islamabad<br>
                            <strong style="color:${navy};">4–6 working days</strong> to other cities
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:22px 44px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f5f9;">
                <tr>
                    <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#4b4a57;">
                        <strong style="color:${navy};">Wrong size?</strong> Eligible items can be exchanged within 7 days of delivery.
                        <a href="${e(returnsUrl)}" style="color:${navy};text-decoration:underline;">See our Return &amp; Exchange Policy</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" align="center" style="padding:36px 44px 8px;">
            <a class="tz-btn" href="${e(site)}" style="display:inline-block;margin:0 5px 10px;padding:15px 30px;background:${navy};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">Continue shopping</a>
            ${waLink ? `<a class="tz-btn" href="${e(waLink)}" style="display:inline-block;margin:0 5px 10px;padding:14px 29px;border:1px solid ${navy};color:${navy};font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;text-decoration:none;">WhatsApp us</a>` : ''}
        </td>
    </tr>
    <tr>
        <td class="tz-pad" align="center" style="padding:6px 44px 40px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#8a86a3;">
            ${phone && waLink
              ? `Questions about your order? Reply to this email or WhatsApp us on <a href="${e(waLink)}" style="color:${navy};text-decoration:underline;">${e(phone)}</a>.`
              : 'Questions about your order? Reply to this email.'}
        </td>
    </tr>

    <tr>
        <td align="center" style="background:${navy};padding:34px 24px 30px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:18px;font-weight:bold;letter-spacing:8px;color:#ffffff;padding-left:8px;">${e(brand.toUpperCase())}</div>
            <div style="margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:#cfcbe6;">Made for Your Style.</div>
            ${socials.length ? `<div style="margin-top:20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                            ${socialLinks}
                </div>` : ''}
            <div style="margin-top:20px;font-size:11px;line-height:1.8;color:#9d98bd;">
                ${ctx.setting?.address ? e(ctx.setting.address) + '<br>' : ''}
                ${footerLinks.join(' &nbsp;·&nbsp; ')}
            </div>
            <div style="margin-top:14px;font-size:10px;color:#5d5980;">© ${new Date().getUTCFullYear()} ${e(brand)}. All rights reserved.</div>
        </td>
    </tr>

</table>

</td></tr>
</table>
</body>
</html>
`;
}

export function customerOrderText(order: OrderMailData, ctx: OrderMailContext): string {
  const brand = ctx.setting?.name ?? ctx.appName;
  const site = ctx.siteUrl;
  const siteHost = hostOf(site);
  const showSite = siteHost !== 'localhost' && !isIp(siteHost);
  const phone = ctx.setting?.phones?.[0] ?? null;
  const isCod = (order.payment_method ?? 'cod') === 'cod';
  const firstName = (order.contact.name ?? '').trim().split(' ')[0]?.trim() || 'there';
  const saved = order.items.reduce((s, i) => s + (wasPrice(i) ? (wasPrice(i) - i.price) * i.quantity : 0), 0) + Number(order.discount);
  const lines = [
    `${brand.toUpperCase()} — Made for Your Style`,
    '',
    `Thank you, ${firstName}.`,
    `Your order #${order.id} is in. We may call or WhatsApp you on ${order.contact.phone ?? ''} to confirm it, then we pack it and send it your way.`,
    '',
    `Placed on: ${formatDate(karachi(order.created_at), 'd M Y, h:i A')}`,
    'Status: Received → Confirmed → Shipped → Delivered',
    '',
    'YOUR ORDER',
    ...order.items.map((i) => `- ${i.name ?? 'Item'}${i.optionsLabel ? ' (' + i.optionsLabel + ')' : ''} × ${i.quantity} — ${money(i.price * i.quantity)}`),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    ...(Number(order.discount) > 0 ? [`Discount${order.coupon_code ? ' (' + order.coupon_code + ')' : ''}: − ${money(order.discount)}`] : []),
    `Delivery: ${Number(order.shipping) > 0 ? money(order.shipping) : 'Free'}`,
    ...(saved > 0 ? [`You saved: ${money(saved)}`] : []),
    `${isCod ? 'PAY ON DELIVERY' : 'ORDER TOTAL'}: ${money(order.total)}`,
    '',
    'DELIVERING TO',
    order.contact.name ?? '',
    order.contact.address ?? '',
    order.contact.city ?? '',
    order.contact.phone ?? '',
    '',
    'Estimated delivery: 2–4 working days to Karachi, Lahore & Islamabad; 4–6 working days to other cities.',
    '',
    'Wrong size? Eligible items can be exchanged within 7 days of delivery.',
    `Return & Exchange Policy: ${ctx.policiesUrl}#return`,
    '',
    `Questions? Reply to this email${phone ? ' or WhatsApp us on ' + phone : ''}.`,
    '',
    ...(showSite ? [site] : []),
    `© ${new Date().getUTCFullYear()} ${brand}`,
  ];
  return lines.join('\n') + '\n';
}

/** "New order" alert for the shop's own inbox: the customer email's look, with what staff act on */
export function adminOrderHtml(order: OrderMailData, appName: string, siteUrl: string): string {
  const navy = '#161426';
  const site = siteUrl.replace(/\/+$/, '');
  const adminUrl = `${site}/admin/orders/${order.id}`;
  const placedAt = formatDate(karachi(order.created_at), 'd M Y, h:i A');
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const isCod = (order.payment_method ?? 'cod') === 'cod';
  const label = 'font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8a86a3;font-weight:bold;';
  const phoneDigits = (order.contact.phone ?? '').replace(/\D+/g, '');
  const contactRow = (name: string, value: string) => value ? `
                <tr>
                    <td style="padding:5px 0;width:84px;vertical-align:top;font-size:12px;color:#8a86a3;">${name}</td>
                    <td style="padding:5px 0;font-size:14px;color:#1a1a1a;">${value}</td>
                </tr>` : '';

  const items = order.items.map((item) => `
                <tr>
                    <td width="64" style="padding:14px 0;border-bottom:1px solid #efedf3;vertical-align:top;">
                        ${item.image ? `<img src="${e(item.image)}" width="56" height="70" alt="" style="display:block;width:56px;height:70px;object-fit:cover;border:0;background:#f3f1ec;">` : `<div style="width:56px;height:70px;background:#f3f1ec;"></div>`}
                    </td>
                    <td style="padding:14px 12px;border-bottom:1px solid #efedf3;vertical-align:top;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#1a1a1a;">${e(item.name ?? 'Item')}</div>
                        ${item.optionsLabel ? `<div style="margin-top:4px;font-size:12px;color:#8a86a3;">${e(item.optionsLabel)}</div>` : ''}
                        <div style="margin-top:4px;font-size:12px;color:#8a86a3;">Qty ${item.quantity} × ${money(item.price)}</div>
                    </td>
                    <td align="right" style="padding:14px 0;border-bottom:1px solid #efedf3;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#1a1a1a;white-space:nowrap;">${money(item.price * item.quantity)}</td>
                </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New order #${order.id}</title>
    <style>
        @media (max-width: 620px) {
            .tz-wrap { width: 100% !important; }
            .tz-pad { padding-left: 22px !important; padding-right: 22px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#efeee9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#efeee9;">
<tr><td align="center" style="padding:28px 12px;">

<table role="presentation" class="tz-wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;">

    <tr>
        <td align="center" style="background:${navy};padding:28px 24px 26px;">
            <img src="${e(site)}/clientside/company_logo/monogram-aga.png" width="56" height="32" alt="" style="display:block;margin:0 auto 12px;width:56px;height:auto;border:0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:6px;color:#ffffff;padding-left:6px;">${e(appName.toUpperCase())}</div>
            <div style="margin-top:8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9d98bd;">Admin &nbsp;·&nbsp; New order</div>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:36px 44px 0;font-family:Arial,Helvetica,sans-serif;">
            <div style="${label}">New order received</div>
            <div style="margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:30px;line-height:1.2;color:#1a1a1a;">Order #${order.id} &middot; ${money(order.total)}</div>
            <div style="margin-top:10px;font-size:14px;line-height:1.7;color:#4a4760;">${itemCount} ${itemCount === 1 ? 'item' : 'items'} from <strong style="color:#1a1a1a;">${e(order.contact.name ?? 'a customer')}</strong>, placed ${e(placedAt)}.</div>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" align="center" style="padding:24px 44px 0;">
            <a href="${e(adminUrl)}" style="display:block;background:${navy};color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:16px 20px;text-align:center;">Open order in admin</a>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:32px 44px 0;font-family:Arial,Helvetica,sans-serif;">
            <div style="${label}padding-bottom:8px;border-bottom:2px solid ${navy};color:${navy};">Customer</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;">${[
              contactRow('Name', e(order.contact.name ?? '')),
              contactRow('Phone', order.contact.phone ? `<a href="tel:${e(order.contact.phone)}" style="color:#1a1a1a;text-decoration:none;font-weight:bold;">${e(order.contact.phone)}</a>${phoneDigits ? ` &nbsp;<a href="https://wa.me/${e(phoneDigits)}" style="color:#1f8f4e;text-decoration:none;font-size:12px;font-weight:bold;">WhatsApp</a>` : ''}` : ''),
              contactRow('Email', order.contact.email ? `<a href="mailto:${e(order.contact.email)}" style="color:#1a1a1a;">${e(order.contact.email)}</a>` : ''),
              contactRow('Address', e(order.contact.address ?? '')),
              contactRow('City', e(order.contact.city ?? '')),
            ].join('')}
            </table>
            ${order.order_notes ? `<div style="margin-top:12px;padding:12px 14px;background:#fff8ec;border-left:3px solid #c97864;font-size:13px;line-height:1.6;color:#4a4760;"><strong style="color:#1a1a1a;">Note:</strong> ${e(order.order_notes)}</div>` : ''}
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:30px 44px 0;font-family:Arial,Helvetica,sans-serif;">
            <div style="${label}padding-bottom:8px;border-bottom:2px solid ${navy};color:${navy};">Items <span style="color:#8a86a3;">(${itemCount})</span></div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items}
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:16px 44px 0;font-family:Arial,Helvetica,sans-serif;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#4a4760;">
                <tr><td style="padding:4px 0;">Subtotal</td><td align="right" style="padding:4px 0;">${money(order.subtotal)}</td></tr>
                ${Number(order.discount) > 0 ? `<tr><td style="padding:4px 0;">Discount${order.coupon_code ? ' (' + e(order.coupon_code) + ')' : ''}</td><td align="right" style="padding:4px 0;">− ${money(order.discount)}</td></tr>` : ''}
                <tr><td style="padding:4px 0;">Delivery</td><td align="right" style="padding:4px 0;">${Number(order.shipping) > 0 ? money(order.shipping) : 'Free'}</td></tr>
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" style="padding:16px 44px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${navy};">
                <tr>
                    <td style="padding:18px 22px;font-family:Arial,Helvetica,sans-serif;">
                        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9d98bd;">${isCod ? 'Collect on delivery' : 'Order total'}</div>
                        <div style="margin-top:4px;font-size:13px;color:#ffffff;">${isCod ? 'Cash on delivery' : e(ucfirst(String(order.payment_method ?? '')))}</div>
                    </td>
                    <td align="right" style="padding:18px 22px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#ffffff;white-space:nowrap;">${money(order.total)}</td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td class="tz-pad" align="center" style="padding:28px 44px 34px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#8a86a3;">
            Confirm the order with the customer, then update its status in the admin panel.
        </td>
    </tr>

    <tr>
        <td align="center" style="background:${navy};padding:18px 24px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9d98bd;">
            ${e(appName)} &nbsp;·&nbsp; Staff notification
        </td>
    </tr>

</table>

</td></tr>
</table>
</body>
</html>
`;
}

export function contactHtml(brand: string, data: { name: string; email: string; subject: string; message: string }): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Contact Message - ${e(brand)}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f5f2; color: #333; padding: 20px; font-size: 16px; margin: 0; }
        .container { max-width: 600px; background: #fff; border-radius: 12px; padding: 30px; margin: auto; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); }
        .header { background: #111; color: #fff; text-align: center; padding: 22px; border-radius: 10px 10px 0 0; margin: -30px -30px 30px -30px; }
        .header h2 { margin: 0; font-size: 22px; letter-spacing: 0.4px; color: #fff; }
        .header p { margin: 8px 0 0; font-size: 12px; opacity: 0.85; }
        .section-title { color: #111; font-size: 18px; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .info-block { margin-bottom: 22px; }
        .info-row { margin-bottom: 10px; line-height: 1.7; color: #444; }
        .label { display: inline-block; width: 100px; color: #666; font-weight: 600; }
        .message-box { background: #fcfaf8; border: 1px solid #eee3da; border-radius: 10px; padding: 18px; color: #444; line-height: 1.8; }
        .footer { margin-top: 34px; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 14px; text-align: center; line-height: 1.7; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>${e(brand)}</h2>
            <p>New Contact Form Message</p>
        </div>

        <h3 class="section-title">New Contact Message</h3>

        <div class="info-block">
            <div class="info-row"><span class="label">Full Name:</span> ${e(data.name)}</div>
            <div class="info-row"><span class="label">Email:</span> ${e(data.email)}</div>
            <div class="info-row"><span class="label">Subject:</span> ${e(data.subject)}</div>
        </div>

        <div class="info-block">
            <div class="info-row" style="margin-bottom:8px; color:#666; font-weight:600;">Message:</div>
            <div class="message-box">
                ${e(data.message)}
            </div>
        </div>

        <div class="footer">
            This message was sent via the contact form on the <strong>${e(brand)}</strong> website.<br>
            Please review and respond as needed.
        </div>
    </div>
</body>
</html>
`;
}

export function passwordResetHtml(brand: string, customer: { full_name: string; email: string }, resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset your ${e(brand)} password</title>
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; background-color:#f8f5f2; color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                    style="background:#ffffff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.05); overflow:hidden;">
                    <tr>
                        <td style="background:#161426; padding:24px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:26px; letter-spacing:4px;">${e(brand)}</h1>
                            <p style="margin:6px 0 0; color:#d6d3d1; font-size:14px;">Streetwear · Made for Your Style</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <h2 style="margin-top:0; color:#111111;">Hello ${e(customer.full_name)},</h2>
                            <p style="font-size:16px; line-height:1.7; color:#444;">
                                We received a request to reset the password for your ${e(brand)} account
                                (<strong>${e(customer.email)}</strong>). Tap the button below to choose a new one.
                            </p>
                            <div style="text-align:center; margin:32px 0;">
                                <a href="${e(resetUrl)}"
                                   style="background:#161426; color:#ffffff; padding:14px 28px; text-decoration:none; font-weight:600; display:inline-block; letter-spacing:1px;">
                                    Choose a new password
                                </a>
                            </div>
                            <p style="font-size:14px; line-height:1.7; color:#6b7280;">
                                This link works for 60 minutes. If you did not ask for a new password, you can ignore this email; your password stays the same.
                            </p>
                            <p style="font-size:13px; line-height:1.6; color:#9ca3af; word-break:break-all;">
                                Button not working? Copy this link into your browser:<br>${e(resetUrl)}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f3ede8; text-align:center; padding:18px; font-size:13px; color:#6b7280;">
                            © ${new Date().getUTCFullYear()} ${e(brand)}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

export function customerWelcomeHtml(brand: string, customer: { full_name: string; email: string }, loginUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to ${e(brand)}</title>
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Arial, sans-serif; background-color:#f8f5f2; color:#1f2937;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                    style="background:#ffffff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.05); overflow:hidden;">

                    <!-- HEADER -->
                    <tr>
                        <td style="background:#111111; padding:24px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:26px;">
                                ${e(brand)}
                            </h1>
                            <p style="margin:6px 0 0; color:#d6d3d1; font-size:14px;">
                                Streetwear · Made for Your Style
                            </p>
                        </td>
                    </tr>

                    <!-- BODY -->
                    <tr>
                        <td style="padding:32px;">
                            <h2 style="margin-top:0; color:#111111;">
                                Hello ${e(customer.full_name)} ✨
                            </h2>

                            <p style="font-size:16px; line-height:1.7; color:#444;">
                                Welcome to <strong>${e(brand)}</strong>.
                                Your account has been successfully created, and we’re delighted to have you with us.
                            </p>

                            <p style="font-size:16px; line-height:1.7; color:#444;">
                                Discover baggy jeans, oversized tees, button-down shirts, football jerseys and zip-up hoodies, with cash on delivery across Pakistan.
                            </p>

                            <hr style="border:none; border-top:1px solid #e7e5e4; margin:28px 0;">

                            <p style="font-size:16px; line-height:1.7; color:#444;">
                                <strong>Signing in:</strong><br>
                                Use your email <strong>${e(customer.email)}</strong> and the password you chose.
                                Forgot it? Tap “Forgot password?” on the sign-in page and we will email you a reset link.
                            </p>

                            <div style="text-align:center; margin:32px 0;">
                                <a href="${e(loginUrl)}"
                                   style="background:#111111; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:999px; font-weight:600; display:inline-block;">
                                    Login to Your Account
                                </a>
                            </div>

                            <p style="font-size:14px; color:#6b7280;">
                                If you did not create this account, simply reply to this email and our team will assist you.
                            </p>

                            <p style="margin-top:26px; font-size:16px; color:#444; line-height:1.7;">
                                Warm regards,<br>
                                <strong>${e(brand)} Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background:#f3ede8; text-align:center; padding:18px; font-size:13px; color:#6b7280;">
                            © ${new Date().getUTCFullYear()} ${e(brand)}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

export function newsletterWelcomeHtml(p: { brand: string; appUrl: string; shopUrl: string; unsubscribeUrl: string; supportEmail: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Welcome to ${e(p.brand)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;background:#f8f5f2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5f2;">
        <tr>
            <td align="center" style="padding:30px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                    style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.06);">

                    <tr>
                        <td align="center" style="background:#111;color:#fff;padding:28px;">
                            <div style="font-size:22px;letter-spacing:.5px;font-weight:700;">
                                ${e(p.brand)}
                            </div>
                            <div style="font-size:12px;opacity:.85;margin-top:6px;">
                                Streetwear · Made for Your Style
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0;">
                            <img src="${e(p.appUrl + '/images/newsletter.jpg')}"
                                 alt="Welcome to ${e(p.brand)}"
                                 width="100%"
                                 style="display:block;width:100%;max-height:260px;object-fit:cover;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:28px 28px 10px 28px;
                                   font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                                   color:#222;">
                            <h1 style="margin:0 0 10px 0;font-size:22px;line-height:1.35;">
                                Welcome to ${e(p.brand)} ✨
                            </h1>

                            <p style="margin:0 0 12px 0;font-size:15px;line-height:1.7;color:#444;">
                                Thank you for joining us. You’ll be among the first to hear about new arrivals,
                                restocks and special offers.
                            </p>

                            <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#444;">
                                We’re delighted to have you with us. Expect new drops in denim, tees, shirts,
                                jerseys and hoodies, straight to your inbox.
                            </p>

                            <div style="text-align:center;margin:22px 0 8px;">
                                <a href="${e(p.shopUrl)}"
                                   style="background:#111;color:#fff;text-decoration:none;
                                          padding:12px 22px;border-radius:999px;
                                          font-size:14px;display:inline-block;">
                                    Shop New Arrivals
                                </a>
                            </div>

                            <hr style="border:none;height:1px;background:#eee;margin:24px 0;">

                            <p style="margin:0 0 8px 0;font-size:13px;color:#666;">
                                If this wasn’t you, simply ignore this email.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:18px 28px 28px 28px;
                                   font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                                   color:#777;font-size:12px;">
                            <div style="opacity:.9;">
                                © ${new Date().getUTCFullYear()} ${e(p.brand)}. All rights reserved.
                            </div>

                            <div style="margin-top:6px;">
                                <a href="${e(p.appUrl)}" style="color:#777;text-decoration:none;">Website</a> •
                                <a href="${e(p.shopUrl)}" style="color:#777;text-decoration:none;">Shop</a> •
                                <a href="mailto:${e(p.supportEmail)}"
                                   style="color:#777;text-decoration:none;">Support</a>
                            </div>

                            <div style="margin-top:10px;color:#999;font-size:11px;line-height:1.6;">
                                You’re receiving this email because you subscribed to our newsletter.
                                If you no longer wish to receive updates,
                                <a href="${e(p.unsubscribeUrl)}" style="color:#555;text-decoration:underline;">
                                    unsubscribe here
                                </a>.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

export function newsletterWelcomeText(p: { brand: string; shopUrl: string }): string {
  return `Welcome to the ${p.brand} community!

Thank you for subscribing. You’ll be the first to hear about new arrivals, restocks and special offers.

Shop New Arrivals: ${p.shopUrl}

If this wasn’t you, please ignore this email. You can unsubscribe anytime.

© ${new Date().getUTCFullYear()} ${p.brand}. All rights reserved.
`;
}

/**
 * Laravel's default ResetPassword notification (notifications::email in the default
 * mail theme), sent to admins from the admin "forgot password" page.
 */
export function adminPasswordResetHtml(appName: string, appUrl: string, resetUrl: string): string {

  const font = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;";
  const p = (t: string) => `<p style="box-sizing: border-box; ${font} font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;">${t}</p>`;
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>${e(appName)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
</head>
<body style="box-sizing: border-box; ${font} -webkit-text-size-adjust: none; background-color: #ffffff; color: #718096; height: 100%; line-height: 1.4; margin: 0; padding: 0; width: 100% !important;">
<table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; ${font} background-color: #edf2f7; margin: 0; padding: 0; width: 100%;">
<tr><td align="center" style="box-sizing: border-box; ${font}">
<table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; ${font} margin: 0; padding: 0; width: 100%;">
<tr><td class="header" style="box-sizing: border-box; ${font} padding: 25px 0; text-align: center;">
<a href="${e(appUrl)}" style="box-sizing: border-box; ${font} color: #3d4852; font-size: 19px; font-weight: bold; text-decoration: none; display: inline-block;">${e(appName)}</a>
</td></tr>
<tr><td class="body" width="100%" cellpadding="0" cellspacing="0" style="box-sizing: border-box; ${font} background-color: #edf2f7; border-bottom: 1px solid #edf2f7; border-top: 1px solid #edf2f7; margin: 0; padding: 0; width: 100%; border: hidden !important;">
<table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; ${font} background-color: #ffffff; border-color: #e8e5ef; border-radius: 2px; border-width: 1px; box-shadow: 0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0, 150, 0.015); margin: 0 auto; padding: 0; width: 570px;">
<tr><td class="content-cell" style="box-sizing: border-box; ${font} max-width: 100vw; padding: 32px;">
<h1 style="box-sizing: border-box; ${font} color: #3d4852; font-size: 18px; font-weight: bold; margin-top: 0; text-align: left;">Hello!</h1>
${p('You are receiving this email because we received a password reset request for your account.')}
<table class="action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; ${font} margin: 30px auto; padding: 0; text-align: center; width: 100%;">
<tr><td align="center" style="box-sizing: border-box; ${font}">
<a href="${e(resetUrl)}" class="button button-primary" target="_blank" rel="noopener" style="box-sizing: border-box; ${font} -webkit-text-size-adjust: none; border-radius: 4px; color: #fff; display: inline-block; overflow: hidden; text-decoration: none; background-color: #2d3748; border-bottom: 8px solid #2d3748; border-left: 18px solid #2d3748; border-right: 18px solid #2d3748; border-top: 8px solid #2d3748;">Reset Password</a>
</td></tr>
</table>
${p('This password reset link will expire in 60 minutes.')}
${p('If you did not request a password reset, no further action is required.')}
${p(`Regards,<br>\n${e(appName)}`)}
<table class="subcopy" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; ${font} border-top: 1px solid #e8e5ef; margin-top: 25px; padding-top: 25px;">
<tr><td style="box-sizing: border-box; ${font}">
<p style="box-sizing: border-box; ${font} line-height: 1.5em; margin-top: 0; text-align: left; font-size: 14px;">If you're having trouble clicking the "Reset Password" button, copy and paste the URL below
into your web browser: <span class="break-all" style="box-sizing: border-box; ${font} word-break: break-all;"><a href="${e(resetUrl)}" style="box-sizing: border-box; ${font} color: #3869d4;">${e(resetUrl)}</a></span></p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="box-sizing: border-box; ${font}">
<table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; ${font} margin: 0 auto; padding: 0; text-align: center; width: 570px;">
<tr><td class="content-cell" align="center" style="box-sizing: border-box; ${font} max-width: 100vw; padding: 32px;">
<p style="box-sizing: border-box; ${font} line-height: 1.5em; margin-top: 0; color: #b0adc5; font-size: 12px; text-align: center;">© ${new Date().getUTCFullYear()} ${e(appName)}. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function adminPasswordResetText(appName: string, resetUrl: string): string {
  return `Hello!

You are receiving this email because we received a password reset request for your account.

Reset Password: ${resetUrl}

This password reset link will expire in 60 minutes.

If you did not request a password reset, no further action is required.

Regards,
${appName}

If you're having trouble clicking the "Reset Password" button, copy and paste the URL below
into your web browser: ${resetUrl}
`;
}
