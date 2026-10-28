import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { policyIndexData } from '@/services/admin/content';
import view from '@/admin-views/policies/index';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, url }) => { void url; return renderAdmin(req, admin, 'admin.policies.index', view, await policyIndexData()); });
