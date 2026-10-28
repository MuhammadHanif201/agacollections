import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { carbonize } from '@/lib/admin/php';
import { aboutRow } from '@/services/admin/content';
import view from '@/admin-views/about/edit';

export const dynamic = 'force-dynamic';

/** AboutController::edit */
export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.pages.about.edit', view, { about: carbonize(await aboutRow({ req, adminId: admin._id })) }));
