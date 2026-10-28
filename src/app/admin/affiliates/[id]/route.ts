import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { affiliateShowData } from '@/services/admin/affiliates';
import view from '@/admin-views/affiliates/show';

export const dynamic = 'force-dynamic';

/** AdminAffiliateController::show */
export const GET = adminPage(async ({ req, admin, params }) => {
  const data = /^\d+$/.test(params.id) ? await affiliateShowData(Number(params.id)) : null;
  return data ? renderAdmin(req, admin, 'admin.affiliates.show', view, data) : notFound(req);
});
