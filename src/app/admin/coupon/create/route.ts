import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import view from '@/admin-views/coupon/create';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.coupon.create', view));
