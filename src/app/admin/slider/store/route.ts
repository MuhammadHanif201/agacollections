import { adminAction, flash, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { storeSlider } from '@/services/admin/content';
import { storeRules } from '../rules';

/** SliderController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, storeRules(input));
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storeSlider(input, { req, adminId: admin._id });
    await flash({ success: 'Slider created successfully.' });
    return redirect('/admin/slider');
  },
});
