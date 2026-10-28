import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { affiliateIndexData } from '@/services/admin/affiliates';
import view from '@/admin-views/affiliates/index';

export const dynamic = 'force-dynamic';

/** AdminAffiliateController::index */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.affiliates.index', view, await affiliateIndexData(url)));
