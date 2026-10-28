import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import view from '@/admin-views/policies/create';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, url }) => { void url; return renderAdmin(req, admin, 'admin.policies.create', view); });
