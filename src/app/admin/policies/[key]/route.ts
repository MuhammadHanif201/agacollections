import { adminAction, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { destroyPolicy, policyByKey, updatePolicy } from '@/services/admin/content';

export const POST = adminAction({
  /** PolicyController::update */
  POST: async ({ req, admin, input, params }) => {
    const before = await policyByKey(params.key);
    if (!before) return notFound(req);
    const errors = await validate(input, { status: 'required|in:published,draft', title_en: 'required|string|max:255', content_en: 'nullable|string' });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await updatePolicy(before, input, { req, adminId: admin._id });
    await flash({ success: 'Policy updated successfully.' });
    return redirect('/admin/policies');
  },
  /** PolicyController::destroy */
  DELETE: async ({ req, admin, params }) => {
    const before = await policyByKey(params.key);
    if (!before) return notFound(req);
    await destroyPolicy(before, { req, adminId: admin._id });
    await flash({ success: 'Policy deleted.' });
    return redirect('/admin/policies');
  },
});
