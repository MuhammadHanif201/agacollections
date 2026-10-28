import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { customerShowData } from '@/services/admin/orders';
import view from '@/admin-views/customers/show';

export const dynamic = 'force-dynamic';

/** HomeController::customerShow */
export const GET = adminPage(async ({ req, admin, params }) => {
  const data = /^\d+$/.test(params.id) ? await customerShowData(Number(params.id)) : null;
  return data ? renderAdmin(req, admin, 'admin.customers.show', view, data) : notFound(req);
});
