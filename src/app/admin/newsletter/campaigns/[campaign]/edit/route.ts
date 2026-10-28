import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { carbonize } from '@/lib/admin/php';
import { campaignById } from '@/services/admin/newsletter';
import view from '@/admin-views/newsletter/campaigns/edit';

export const dynamic = 'force-dynamic';

/** NewsletterCampaignController::edit */
export const GET = adminPage(async ({ req, admin, params }) => {
  const c = /^\d+$/.test(params.campaign) ? await campaignById(Number(params.campaign)) : null;
  return c ? renderAdmin(req, admin, 'admin.newsletter.campaigns.edit', view, { campaign: carbonize(c) }) : notFound(req);
});
