import { adminAction, back, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Review } from '@/models/content';
import { destroyReview } from '@/services/admin/content';

/** ReviewController::destroy */
export const POST = adminAction({
  DELETE: async ({ req, admin, input, params }) => {
    const before = /^\d+$/.test(params.id) ? await Review.findById(Number(params.id)).lean() : null;
    if (!before) return notFound(req);
    const who = { req, adminId: admin._id };
    void validate; void validationFailed; void flash; void redirect; void back; void input; void who;

    await destroyReview(before, who);
    return back(req, { success: 'Review deleted.' });
  },
});
