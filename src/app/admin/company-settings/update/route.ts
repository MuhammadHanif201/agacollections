import { adminAction, back, flash, putErrors, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { settingRow, settingUpdateRules, updateSetting } from '@/services/admin/settings';

/** CompanySettingController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const before = await settingRow();
    const errors = await validate(input, settingUpdateRules);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    if (!before) throw new Error('Attempt to assign property on null');
    const problem = await updateSetting(before, input, { req, adminId: admin._id });
    if (problem) { await putErrors({}, input); return back(req, { error: problem }); }
    await flash({ success: 'Company settings updated successfully.' });
    return redirect('/admin/company-settings');
  },
});
