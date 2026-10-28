import { list } from '@/lib/admin/form';
import { adminAction, jsonResponse } from '@/lib/admin/http';
import { sortCategories } from '@/services/admin/content';

/** CategoryController::sort */
export const POST = adminAction({
  POST: async ({ input }) => {
    await sortCategories(list(input, 'order'));
    return jsonResponse({ success: true });
  },
});
