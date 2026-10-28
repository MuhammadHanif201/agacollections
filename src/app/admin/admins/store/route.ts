import { adminAction, flash, redirect, validationFailed } from '@/lib/admin/http';
import { storeAdmin, validateAdmin } from '@/services/admin/settings';

/** ProfileController::adminSubmit */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validateAdmin(input, null);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storeAdmin(input, { req, adminId: admin._id });
    await flash({ success: 'New admin user created successfully!' });
    return redirect('/admin/admins');
  },
});
