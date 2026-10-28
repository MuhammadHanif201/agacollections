// Port of resources/views/emails/order-status-update.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, asset, url, now, number_format, empty, ucfirst, max, json_decode, entries, foreach } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { order, product, variant, variantDetails, variantImage } = d;

  return {
    title: html``,
    styles: html``,
    content: html`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Update - ${companySetting?.name}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f8f5f2;
            color: #333;
            margin: 0;
            padding: 30px;
        }

        .email-container {
            max-width: 700px;
            margin: auto;
            background-color: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        .header {
            background-color: #111111;
            color: #fff;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 0.3px;
        }

        .header p {
            margin: 8px 0 0;
            font-size: 13px;
            color: rgba(255,255,255,0.8);
        }

        .content {
            padding: 30px;
        }

        .content h2 {
            color: #111;
            margin-top: 0;
            margin-bottom: 14px;
        }

        .content p {
            font-size: 15px;
            line-height: 1.7;
            color: #444;
        }

        .summary {
            margin: 22px 0;
            background: #fcfaf8;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #eee3da;
        }

        .summary li {
            margin-bottom: 10px;
            color: #444;
            line-height: 1.7;
        }

        .product-list {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .product-list th,
        .product-list td {
            padding: 12px;
            border: 1px solid #eee3da;
            text-align: left;
            font-size: 14px;
            vertical-align: top;
        }

        .product-list th {
            background-color: #f8f5f2;
            color: #111;
        }

        .product-image {
            width: 60px;
            height: auto;
        }

        .footer {
            background: #f8f5f2;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #888;
            line-height: 1.7;
            border-top: 1px solid #eee;
        }

        .status-badge {
            display: inline-block;
            padding: 7px 14px;
            border-radius: 999px;
            background-color: #111111;
            color: white;
            font-weight: bold;
            font-size: 13px;
            letter-spacing: 0.2px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Order Update - ${companySetting?.name}</h1>
            <p>Streetwear · Made for Your Style</p>
        </div>

        <div class="content">
            <h2>Hello ${order?.contact_name},</h2>

            <p>
                We wanted to let you know that your order <strong>#${order?.id}</strong> has been updated.
            </p>

            <p>
                Current Status: <span class="status-badge">${ucfirst(order?.status)}</span>
            </p>

            <div class="summary">
                <ul style="list-style: none; padding-left: 0; margin: 0;">
                    <li><strong>Total:</strong> PKR ${number_format(order?.total, 2)}</li>
                    <li><strong>Placed on:</strong> ${order?.created_at?.timezone('Asia/Karachi')?.format('d M Y, h:i A')}</li>
                    <li>
                        <strong>Payment Method:</strong>
                            Cash On Delivery (COD)
                    </li>
                </ul>
            </div>

            <h4 style="margin-bottom: 10px; color:#111;">Products in Your Order</h4>

            <table width="100%" cellpadding="10" cellspacing="0" border="1"
                   style="border-collapse: collapse; font-size: 14px;">
                <thead style="background-color: #f8f5f2;">
                    <tr>
                        <th>Image</th>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Quantity</th>
                        <th>Price (PKR)</th>
                    </tr>
                </thead>
                <tbody>
                    ${foreach(order?.items, (item, loop) => { let product = item?.product;
let variant = item?.variant ? json_decode(item?.variant, true) : null;
let variantDetails = variant?.['option_values'] ?? [];
let variantImage = variant?.['primary_image'] ?? null;
 return html`                                                <tr>
                            <td align="center">
                                <img src="${url(asset('storage/'  +  (variantImage || (product?.primaryImage?.image_path ?? 'placeholder.jpg'))))}"
                                     alt="Product Image"
                                     width="60"
                                     height="60"
                                     style="border-radius: 6px;">
                            </td>
                            <td>${product?.name ?? '-'}</td>
                            <td>
                                ${(!empty(variantDetails)) ? html`                                    ${foreach(entries(variantDetails), ([key, value], loop) => html`                                        <strong>${ucfirst(key)}:</strong> ${value}<br>
                                    `)}                                ` : html`                                    -
                                `}                            </td>
                            <td>${item?.quantity}</td>
                            <td>${number_format(item?.price, 2)}</td>
                        </tr>
                    `; })}                </tbody>
            </table>

            <p style="margin-top: 28px;">
                If you have any questions, feel free to reply to this email.
                Thank you for shopping with us.
            </p>

            <p style="margin-top: 18px;">
                Warm regards,<br>
                <strong>${companySetting?.name} Team</strong>
            </p>
        </div>

        <div class="footer">
            &copy; ${now()?.year} ${companySetting?.name}. All rights reserved.
        </div>
    </div>
</body>
</html>
`,
    scripts: html``,
  };
}
