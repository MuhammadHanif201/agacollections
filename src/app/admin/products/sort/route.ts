import { list } from '@/lib/admin/form';
import { adminAction, jsonResponse } from '@/lib/admin/http';
import { sortProducts } from '@/services/admin/products';

/** ProductController::sort */
export const POST = adminAction({
  POST: async ({ input }) => {
    await sortProducts(list(input, 'order'));
    return jsonResponse({ status: 'success' });
  },
});
