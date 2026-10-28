import { adminAction, adminPage, flash, redirect, validationFailed } from '@/lib/admin/http';
import { renderAdmin } from '@/lib/admin/layout';
import { validate } from '@/lib/admin/validate';
import { categoryIndexData, storeCategory } from '@/services/admin/content';
import view from '@/admin-views/category/index';

export const dynamic = 'force-dynamic';

/** CategoryController::index */
export const GET = adminPage(async ({ req, admin, url }) => renderAdmin(req, admin, 'admin.category.index', view, await categoryIndexData(url)));

/** CategoryController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validate(input, {
      title: 'required|string|max:255',
      image: 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp',
      banner: 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp',
    });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await storeCategory(input, { req, adminId: admin._id });
    await flash({ success: 'Category created successfully.' });
    return redirect('/admin/category');
  },
});
