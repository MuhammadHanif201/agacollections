import { adminAction, back, errorPage, flash, notFound, putErrors, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Order } from '@/models/Order';
import { updateCustomOrder, updateRules } from '@/services/admin/customorders';

/** AdminCustomOrderController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input, params }) => {
    const id = Number(params.order);
    const order = Number.isInteger(id) ? await Order.findById(id).select('status').lean() : null;
    if (!order) return notFound(req);
    if (order.status !== 'pending') return errorPage(req, 403);
    const errors = await validate(input, updateRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const r = await updateCustomOrder(id, input, req, admin._id);
    if (r.errors) return validationFailed(req, r.errors, input);
    if (r.error) { await putErrors({}, input); return back(req, { error: r.error }); }
    await flash({ success: 'Order updated successfully.' });
    return redirect(`/admin/customorders/${id}/edit`);
  },
});
