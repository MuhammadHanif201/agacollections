import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { customOrderIndexData } from '@/services/admin/customorders';
import view from '@/admin-views/customorders/index';

export const dynamic = 'force-dynamic';

/** AdminCustomOrderController::index */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.customorders.index', view, await customOrderIndexData(url)));
