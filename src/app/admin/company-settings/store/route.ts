import { adminAction, flash, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { settingStoreRules, storeSetting } from '@/services/admin/settings';

/** CompanySettingController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, settingStoreRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storeSetting(input, { req, adminId: admin._id });
    await flash({ success: 'Settings created successfully.' });
    return redirect('/admin/company-settings');
  },
});
