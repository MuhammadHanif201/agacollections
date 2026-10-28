import { adminAction, flash, notFound, redirect, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Category } from '@/models/Category';
import { destroyCategory, updateCategory } from '@/services/admin/content';

const find = (id: string) => (/^\d+$/.test(id) ? Category.findById(Number(id)).lean() : null);

export const POST = adminAction({
  /** CategoryController::update */
  POST: async ({ req, admin, input, params }) => {
    const before = await find(params.id);
    if (!before) return notFound(req);
    const errors = await validate(input, {
      title: 'required|string|max:255',
      image: 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp',
      banner: 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp',
    });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    await updateCategory(before, input, { req, adminId: admin._id });
    await flash({ success: 'Category updated successfully.' });
    return redirect('/admin/category');
  },
  /** CategoryController::destroy */
  DELETE: async ({ req, admin, params }) => {
    const before = await find(params.id);
    if (!before) return notFound(req);
    await destroyCategory(before, { req, adminId: admin._id });
    await flash({ success: 'Category deleted successfully.' });
    return redirect('/admin/category');
  },
});
