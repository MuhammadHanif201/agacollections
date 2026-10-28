import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { carbonize } from '@/lib/admin/php';
import { policyByKey } from '@/services/admin/content';
import view from '@/admin-views/policies/edit';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, params }) => {
  const row = await policyByKey(params.key);
  return row ? renderAdmin(req, admin, 'admin.policies.edit', view, { policy: carbonize(row) }) : notFound(req);
});
