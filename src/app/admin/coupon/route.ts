import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { couponIndexData } from '@/services/admin/content';
import view from '@/admin-views/coupon/index';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.coupon.index', view, await couponIndexData()));
