import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { adminsIndexData } from '@/services/admin/settings';
import view from '@/admin-views/admins/index';

export const dynamic = 'force-dynamic';

/** ProfileController::adminsIndex */
export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.admins.index', view, await adminsIndexData()));
