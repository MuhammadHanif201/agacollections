import { adminPage, errorPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { customOrderEditData } from '@/services/admin/customorders';
import view from '@/admin-views/customorders/edit';

export const dynamic = 'force-dynamic';

/** AdminCustomOrderController::edit (only pending orders) */
export const GET = adminPage(async ({ req, admin, params }) => {
  const data = /^\d+$/.test(params.order) ? await customOrderEditData(Number(params.order)) : null;
  if (!data) return notFound(req);
  if (data === 'forbidden') return errorPage(req, 403);
  return renderAdmin(req, admin, 'admin.customorders.edit', view, data);
});
