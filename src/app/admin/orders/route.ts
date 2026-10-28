import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { orderIndexData } from '@/services/admin/orders';
import view from '@/admin-views/orders/index';

export const dynamic = 'force-dynamic';

/** HomeController::orderIndex */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.orders.index', view, await orderIndexData(url)));
