import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { categoryEditData } from '@/services/admin/content';
import view from '@/admin-views/category/edit';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, params }) => {
  const data = /^\d+$/.test(params.id) ? await categoryEditData(Number(params.id)) : null;
  return data ? renderAdmin(req, admin, 'admin.category.edit', view, data) : notFound(req);
});
