import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { auditsData } from '@/services/admin/orders';
import view from '@/admin-views/audits/index';

export const dynamic = 'force-dynamic';

/** HomeController::audits */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.audits.audits', view, await auditsData(url)));
