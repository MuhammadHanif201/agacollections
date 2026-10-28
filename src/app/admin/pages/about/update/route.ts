import { adminAction, back, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { aboutRow, updateAbout } from '@/services/admin/content';

const img = 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072';

/** AboutController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, {
      title: 'required|string|max:255', content: 'nullable|string',
      image: img, image2: img, gallery_image1: img, gallery_image2: img, gallery_image3: img, gallery_image4: img,
      brand_subtitle: 'nullable|string|max:255', brand_title: 'nullable|string|max:255', brand_body1: 'nullable|string', brand_body2: 'nullable|string',
      brand_cta: 'nullable|string|max:255',
      brand_stat1_value: 'nullable|string|max:50', brand_stat1_label: 'nullable|string|max:100',
      brand_stat2_value: 'nullable|string|max:50', brand_stat2_label: 'nullable|string|max:100',
      brand_stat3_value: 'nullable|string|max:50', brand_stat3_label: 'nullable|string|max:100',
      brand_stat4_value: 'nullable|string|max:50', brand_stat4_label: 'nullable|string|max:100',
    });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const who = { req, adminId: admin._id };
    await updateAbout(await aboutRow(who), input, who);
    return back(req, { success: 'About page updated successfully.' });
  },
});
