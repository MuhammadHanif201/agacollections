import { adminPage } from '@/lib/admin/http';
import { renderAdmin, settingModel } from '@/lib/admin/layout';
import { settingRow } from '@/services/admin/settings';
import view from '@/admin-views/company_settings/index';

export const dynamic = 'force-dynamic';

/** CompanySettingController::index */
export const GET = adminPage(async ({ req, admin }) => {
  const s = await settingRow();
  return renderAdmin(req, admin, 'admin.company-settings.index', view, { companySetting: s ? settingModel(s) : null });
});
