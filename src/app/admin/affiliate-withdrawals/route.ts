import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { withdrawalIndexData } from '@/services/admin/affiliates';
import view from '@/admin-views/affiliate_withdrawals/index';

export const dynamic = 'force-dynamic';

/** AdminAffiliateController::withdrawalsIndex */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.affiliate-withdrawals.index', view, await withdrawalIndexData(url)));
