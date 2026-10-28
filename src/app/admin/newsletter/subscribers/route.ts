import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { subscriberIndexData } from '@/services/admin/newsletter';
import view from '@/admin-views/newsletter/index';

export const dynamic = 'force-dynamic';

/** NewsletterAdminController::index */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.newsletter.subscribers.index', view, await subscriberIndexData(url)));
