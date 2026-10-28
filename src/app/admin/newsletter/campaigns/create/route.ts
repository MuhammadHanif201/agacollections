import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import view from '@/admin-views/newsletter/campaigns/create';

export const dynamic = 'force-dynamic';

/** NewsletterCampaignController::create */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.newsletter.campaigns.create', view, {
  prefill: { subject: url.searchParams.get('subject'), body_html: url.searchParams.get('html'), product_id: url.searchParams.get('product_id') },
  statuses: ['draft', 'sent'],
}));
