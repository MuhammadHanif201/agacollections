import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { couponEditData } from '@/services/admin/content';
import view from '@/admin-views/coupon/edit';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, params }) => {
  const data = /^\d+$/.test(params.id) ? await couponEditData(Number(params.id)) : null;
  return data ? renderAdmin(req, admin, 'admin.coupon.edit', view, data) : notFound(req);
});
