import { adminAction, back, notFound } from '@/lib/admin/http';
import { Coupon } from '@/models/content';
import { destroyCoupon } from '@/services/admin/content';

/** CouponController::destroy */
export const POST = adminAction({
  DELETE: async ({ req, admin, params }) => {
    const before = /^\d+$/.test(params.id) ? await Coupon.findById(Number(params.id)).lean() : null;
    if (!before) return notFound(req);
    await destroyCoupon(before, { req, adminId: admin._id });
    return back(req, { success: 'Coupon deleted.' });
  },
});
