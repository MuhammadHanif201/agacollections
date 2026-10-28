import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { Headline } from '@/models/content';
import { headlineModel } from '@/services/admin/content';
import view from '@/admin-views/headlines/edit';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, params }) => {
  const row = /^\d+$/.test(params.id) ? await Headline.findById(Number(params.id)).lean() : null;
  return row ? renderAdmin(req, admin, 'admin.headlines.edit', view, { headline: headlineModel(row) }) : notFound(req);
});
