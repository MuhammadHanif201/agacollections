import { adminAction, adminPage, back, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { validate } from '@/lib/admin/validate';
import { createDefaultPopup, popupModel, popupRow, updatePopup } from '@/services/admin/content';
import view from '@/admin-views/popup_settings/edit';

export const dynamic = 'force-dynamic';

/** PopupSettingController::edit */
export const GET = adminPage(async ({ req, admin }) => {
  const popup = await popupRow();
  if (!popup) {
    await createDefaultPopup({ req, adminId: admin._id });
    return redirect('/admin/popup-settings');
  }
  return renderAdmin(req, admin, 'admin.popup.edit', view, { popup: popupModel(popup) });
});

/** PopupSettingController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const before = await popupRow();
    if (!before) return notFound(req);
    const errors = await validate(input, { title: 'nullable|string|max:255' });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await updatePopup(before, input, { req, adminId: admin._id });
    return back(req, { success: 'Popup settings updated successfully.' });
  },
});
