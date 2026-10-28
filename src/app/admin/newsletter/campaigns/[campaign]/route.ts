import { adminAction, adminPage, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { carbonize } from '@/lib/admin/php';
import { validate } from '@/lib/admin/validate';
import { campaignById, campaignRules, updateCampaign } from '@/services/admin/newsletter';
import view from '@/admin-views/newsletter/campaigns/show';

export const dynamic = 'force-dynamic';

const find = (id: string) => (/^\d+$/.test(id) ? campaignById(Number(id)) : null);

/** NewsletterCampaignController::show */
export const GET = adminPage(async ({ req, admin, params }) => {
  const c = await find(params.campaign);
  return c ? renderAdmin(req, admin, 'admin.newsletter.campaigns.show', view, { campaign: carbonize(c) }) : notFound(req);
});

/** NewsletterCampaignController::update (PUT) */
export const POST = adminAction({
  PUT: async ({ req, admin, input, params }) => {
    const before = await find(params.campaign);
    if (!before) return notFound(req);
    if (before.status === 'sent') {
      await flash({ error: 'This campaign has already been sent and cannot be edited.' });
      return redirect('/admin/newsletter/campaigns');
    }
    const errors = await validate(input, campaignRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await updateCampaign(before, input, { req, adminId: admin._id });
    await flash({ success: 'Campaign updated successfully.' });
    return redirect('/admin/newsletter/campaigns');
  },
});
