import { adminAction, flash, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { headlineRules, storeHeadline } from '@/services/admin/content';

/** HeadlineController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, headlineRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storeHeadline(input, { req, adminId: admin._id });
    await flash({ success: 'Headline created.' });
    return redirect('/admin/headlines');
  },
});
