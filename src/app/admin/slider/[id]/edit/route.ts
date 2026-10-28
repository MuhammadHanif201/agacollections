import { adminPage, notFound } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { carbonize } from '@/lib/admin/php';
import { Slider } from '@/models/content';
import view from '@/admin-views/slider/edit';

export const dynamic = 'force-dynamic';

export const GET = adminPage(async ({ req, admin, params }) => {
  const row = /^\d+$/.test(params.id) ? await Slider.findById(Number(params.id)).lean() : null;
  return row ? renderAdmin(req, admin, 'admin.slider.edit', view, { slider: carbonize(row) }) : notFound(req);
});
