import { adminAction, back, flash, notFound, putErrors, redirect, validationFailed } from '@/lib/admin/http';
import { Product } from '@/models/Product';
import { updateProduct, validateProduct } from '@/services/admin/products';

/** ProductController::update */
export const POST = adminAction({
  POST: async ({ req, admin, input, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || !(await Product.exists({ _id: id }))) return notFound(req);
    const errors = await validateProduct(input, id);
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const r = await updateProduct(id, input, req, admin._id);
    if (!r.ok) { await putErrors({}, input); return back(req, { error: 'message' in r ? r.message : 'Something went wrong.' }); }
    await flash({ success: 'Product updated successfully.' });
    return redirect('/admin/products');
  },
});
