import { adminAction, back, flash, putErrors, redirect, validationFailed } from '@/lib/admin/http';
import { storeProduct, validateProduct } from '@/services/admin/products';

/** ProductController::store */
export const POST = adminAction({
  POST: async ({ req, admin, input }) => {
    const errors = await validateProduct(input, null);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const r = await storeProduct(input, req, admin._id);
    if (!r.ok) { await putErrors({}, input); return back(req, { error: r.message }); }
    await flash({ success: 'Product added successfully.' });
    return redirect('/admin/products');
  },
});
