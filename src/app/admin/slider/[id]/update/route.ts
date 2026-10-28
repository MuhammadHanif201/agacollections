import { adminAction, back, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Slider } from '@/models/content';
import { updateSlider } from '@/services/admin/content';
import { updateRules } from '../../rules';

/** SliderController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input, params }) => {
    const before = /^\d+$/.test(params.id) ? await Slider.findById(Number(params.id)).lean() : null;
    if (!before) return notFound(req);
    const who = { req, adminId: admin._id };
    void validate; void validationFailed; void flash; void redirect; void back; void input; void who;

    const errors = await validate(input, updateRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await updateSlider(before, input, who);
    await flash({ success: 'Slider updated successfully.' });
    return redirect('/admin/slider');
  },
});
