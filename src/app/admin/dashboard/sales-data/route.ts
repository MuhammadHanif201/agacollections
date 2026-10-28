import { adminPage, jsonResponse } from '@/lib/admin/http';
import { salesData } from '@/services/admin/dashboard';

export const dynamic = 'force-dynamic';

/** HomeController::getSalesData */
export const GET = adminPage(async ({ url }) => jsonResponse(await salesData(url.searchParams.get('type') ?? 'weekly')));
