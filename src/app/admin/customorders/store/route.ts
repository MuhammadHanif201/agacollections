import { adminAction, back, flash, putErrors, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { storeCustomOrder, storeRules } from '@/services/admin/customorders';

/** AdminCustomOrderController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, storeRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const r = await storeCustomOrder(input, req, admin._id);
    if (r.errors) return validationFailed(req, r.errors, input);
    if (r.error) { await putErrors({}, input); return back(req, { error: r.error }); }
    await flash({ success: `Order #${r.id} created successfully.` });
    return redirect('/admin/customorders');
  },
});
