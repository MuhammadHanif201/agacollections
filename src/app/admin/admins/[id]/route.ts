import { adminAction, flash, notFound, redirect } from '@/lib/admin/http';
import { User } from '@/models/User';
import { deleteAdmin } from '@/services/admin/settings';

/** ProfileController::deleteAdmin */
export const POST = adminAction({
  DELETE: async ({ req, admin, params }) => {
    if (String(admin._id) === params.id) {
      await flash({ error: 'You cannot delete your own account.' });
      return redirect('/admin/admins');
    }
    const before = /^\d+$/.test(params.id) ? await User.findById(Number(params.id)).lean() : null;
    if (!before) return notFound(req);
    await deleteAdmin(before, { req, adminId: admin._id });
    await flash({ success: 'Admin user deleted successfully!' });
    return redirect('/admin/admins');
  },
});
