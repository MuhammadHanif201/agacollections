import { adminAction, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Coupon } from '@/models/content';
import { updateCoupon } from '@/services/admin/content';

/** CouponController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input, params }) => {
    const errors = await validate(input, {
      code: 'required|string|max:50',
      discount: 'required|numeric|min:0',
      type: 'required|in:fixed,percentage',
      max_uses: 'nullable|integer|min:1',
      valid_until: 'nullable|date',
    });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const before = /^\d+$/.test(params.id) ? await Coupon.findById(Number(params.id)).lean() : null;
    if (!before) return notFound(req);
    await updateCoupon(before, input, { req, adminId: admin._id });
    await flash({ success: 'Coupon updated successfully.' });
    return redirect('/admin/coupon');
  },
});
