import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { customOrderCreateData } from '@/services/admin/customorders';
import view from '@/admin-views/customorders/create';

export const dynamic = 'force-dynamic';

/** AdminCustomOrderController::create */
export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.customorders.create', view, await customOrderCreateData()));
