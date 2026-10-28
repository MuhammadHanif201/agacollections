import { adminAction, flash, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Policy } from '@/models/content';
import { storePolicy } from '@/services/admin/content';

/** PolicyController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, {
      key: ['required', 'string', 'max:100', { name: 'unique', test: async (v) => !(await Policy.exists({ key: String(v) })) }, 'alpha_dash'],
      title_en: 'required|string|max:255',
      content_en: 'nullable|string',
      status: 'required|in:published,draft',
    });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storePolicy(input, { req, adminId: admin._id });
    await flash({ success: 'Policy created successfully.' });
    return redirect('/admin/policies');
  },
});
