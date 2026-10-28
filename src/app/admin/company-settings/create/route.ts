import { adminPage, redirect } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { settingRow } from '@/services/admin/settings';
import view from '@/admin-views/company_settings/create';

export const dynamic = 'force-dynamic';

/** CompanySettingController::create */
export const GET = adminPage(async ({ req, admin }) => ((await settingRow()) ? redirect('/admin/company-settings/edit') : renderAdmin(req, admin, 'admin.company-settings.create', view)));
