import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { productCreateData } from '@/services/admin/products';
import view from '@/admin-views/products/create';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin }) => renderAdmin(req, admin, 'admin.products.create', view, await productCreateData()));
