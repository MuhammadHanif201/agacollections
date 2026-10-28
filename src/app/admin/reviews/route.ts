import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { reviewIndexData } from '@/services/admin/content';
import view from '@/admin-views/reviews/index';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, url }) => { void url; return renderAdmin(req, admin, 'admin.reviews.index', view, await reviewIndexData(url)); });
