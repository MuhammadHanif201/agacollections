import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { headlineIndexData } from '@/services/admin/content';
import view from '@/admin-views/headlines/index';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, url }) => { void url; return renderAdmin(req, admin, 'admin.headlines.index', view, await headlineIndexData(url)); });
