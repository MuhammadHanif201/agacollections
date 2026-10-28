import { str } from '@/lib/admin/form';
import { adminAction, back, notFound, validationFailed } from '@/lib/admin/http';
import { User } from '@/models/User';
import { updateProfile } from '@/services/admin/settings';

/** ProfileController::profileUpdate */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const id = Number(str(input, 'id'));
    const before = Number.isInteger(id) ? await User.findById(id).lean() : null;
    if (!before) return notFound(req);
    const errors = await updateProfile(before, input, { req, adminId: admin._id });
    if (errors) return validationFailed(req, errors, input);
    return back(req, { success: 'Profile updated successfully!' });
  },
});
