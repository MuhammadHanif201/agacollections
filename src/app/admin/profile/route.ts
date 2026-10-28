import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import view from '@/admin-views/profile/edit';

export const dynamic = 'force-dynamic';

/** ProfileController::profile */
export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.adminprofile', view));
