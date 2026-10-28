import { adminPage, redirect } from '@/lib/admin/http';
import { renderAdmin, settingModel } from '@/lib/admin/layout';
import { settingRow } from '@/services/admin/settings';
import view from '@/admin-views/company_settings/edit';

export const dynamic = 'force-dynamic';

/** CompanySettingController::edit */
export const GET = adminPage(async ({ req, admin }) => {
  const s = await settingRow();
  return s ? renderAdmin(req, admin, 'admin.company-settings.edit', view, { setting: settingModel(s) }) : redirect('/admin/company-settings/create');
});
