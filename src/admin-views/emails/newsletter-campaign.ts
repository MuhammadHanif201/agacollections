// Port of resources/views/emails/newsletter/campaign_html.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { campaign, unsubscribeUrl } = d;

  return {
    title: html``,
    styles: html``,
    content: html`<!doctype html>
<html>
<body style="font-family: Arial, Helvetica, sans-serif; line-height:1.6; color:#222; background:#ffffff; margin:0; padding:24px;">
    ${raw(campaign?.body_html ?? '<p>Discover the latest from our collection.</p>')}

    <hr style="margin:24px 0; border:none; border-top:1px solid #e5e5e5;">

    <p style="font-size:12px;color:#666;margin:0 0 4px;">
        You’re receiving this because you subscribed on our website.
    </p>

    <p style="font-size:12px;color:#666;margin:0;">
        If you no longer wish to receive these emails, you can
        <a href="${unsubscribeUrl ?? '#'}" style="color:#555;text-decoration:underline;">
            unsubscribe here
        </a>.
    </p>
</body>
</html>
`,
    scripts: html``,
  };
}
