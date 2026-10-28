import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { productEditData } from '@/services/admin/products';
import view from '@/admin-views/products/edit';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, params }) => {
  const data = /^\d+$/.test(params.id) ? await productEditData(Number(params.id)) : null;
  return data ? renderAdmin(req, admin, 'admin.products.edit', view, data) : notFound(req);
});
