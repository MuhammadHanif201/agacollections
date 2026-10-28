import { adminAction, adminPage, flash, redirect, validationFailed } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { validate } from '@/lib/admin/validate';
import { campaignIndexData, campaignRules, storeCampaign } from '@/services/admin/newsletter';
import view from '@/admin-views/newsletter/campaigns/index';

export const dynamic = 'force-dynamic';

/** NewsletterCampaignController::index */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.newsletter.campaigns.index', view, await campaignIndexData(url)));

/** NewsletterCampaignController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, campaignRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storeCampaign(input, { req, adminId: admin._id });
    await flash({ success: 'Campaign saved as draft.' });
    return redirect('/admin/newsletter/campaigns');
  },
});
