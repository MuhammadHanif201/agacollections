import { str } from '@/lib/admin/form';
import { adminAction, jsonResponse } from '@/lib/admin/http';
import { updateOrderStatus } from '@/services/admin/orders';

/** HomeController::updateStatus */
export const POST = adminAction({
  POST: async ({ req, admin, input, params }) => {
    const r = await updateOrderStatus(Number(params.order), str(input, 'status') ?? '', req, admin._id);
    return jsonResponse(r.body, r.status);
  },
});
