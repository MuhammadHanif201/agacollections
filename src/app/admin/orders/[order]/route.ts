import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { orderShowData } from '@/services/admin/orders';
import view from '@/admin-views/orders/show';

export const dynamic = 'force-dynamic';

/** HomeController::showOrder */
export const GET = adminPage(async ({ req, admin, params }) => {
  const data = /^\d+$/.test(params.order) ? await orderShowData(Number(params.order)) : null;
  return data ? renderAdmin(req, admin, 'admin.orders.show', view, data) : notFound(req);
});
