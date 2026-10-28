import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { customerIndexData } from '@/services/admin/orders';
import view from '@/admin-views/customers/index';

export const dynamic = 'force-dynamic';

/** HomeController::customerIndex */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.customers.index', view, await customerIndexData(url)));
