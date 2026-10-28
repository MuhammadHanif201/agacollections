import { adminAction, flash, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Coupon } from '@/models/content';
import { CI } from '@/models/Customer';
import { storeCoupon } from '@/services/admin/content';

/** CouponController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, {
      code: ['required', 'string', { name: 'unique', test: async (v) => !(await Coupon.findOne({ code: String(v) }).collation(CI).lean()) }],
      discount: 'required|numeric|min:0',
      type: 'required|in:fixed,percentage',
      max_uses: 'nullable|integer|min:1',
      valid_until: 'nullable|date|after:now',
    });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storeCoupon(input, { req, adminId: admin._id });
    await flash({ success: 'Coupon added successfully!' });
    return redirect('/admin/coupon');
  },
});
