import { adminPage } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { productIndexData } from '@/services/admin/products';
import view from '@/admin-views/products/index';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.products.index', view, await productIndexData(url)));
