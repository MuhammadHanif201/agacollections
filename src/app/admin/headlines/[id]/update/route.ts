import { adminAction, back, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Headline } from '@/models/content';
import { headlineRules, updateHeadline } from '@/services/admin/content';

/** HeadlineController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input, params }) => {
    const before = /^\d+$/.test(params.id) ? await Headline.findById(Number(params.id)).lean() : null;
    if (!before) return notFound(req);
    const who = { req, adminId: admin._id };
    void validate; void validationFailed; void flash; void redirect; void back; void input; void who;

    const errors = await validate(input, headlineRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await updateHeadline(before, input, who);
    await flash({ success: 'Headline updated.' });
    return redirect('/admin/headlines');
  },
});
