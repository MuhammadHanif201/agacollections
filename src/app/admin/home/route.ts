import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { dashboardData } from '@/services/admin/dashboard';
import view from '@/admin-views/index';

export const dynamic = 'force-dynamic';

/** HomeController::index */
export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.home', view, await dashboardData()));
