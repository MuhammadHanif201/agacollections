import { adminAction, back, notFound } from '@/lib/admin/http';
import { campaignById, sendCampaign } from '@/services/admin/newsletter';

/** NewsletterCampaignController::send */
export const POST = adminAction({
  POST: async ({ req, admin, params, url }) => {
    const c = /^\d+$/.test(params.campaign) ? await campaignById(Number(params.campaign)) : null;
    if (!c) return notFound(req);
    return back(req, await sendCampaign(c, url.origin, { req, adminId: admin._id }));
  },
});
