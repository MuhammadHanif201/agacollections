import { adminAction, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { User } from '@/models/User';
import { updateAdmin, validateAdmin } from '@/services/admin/settings';

/** ProfileController::updateAdmin */
export const POST = adminAction({
  POST: async ({ req, admin, input, params }) => {
    const id = Number(params.id);
    const errors = await validateAdmin(input, Number.isInteger(id) ? id : null);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const before = Number.isInteger(id) ? await User.findById(id).lean() : null;
    if (!before) return notFound(req);
    await updateAdmin(before, input, { req, adminId: admin._id });
    await flash({ success: 'Admin user updated successfully!' });
    return redirect('/admin/admins');
  },
});
