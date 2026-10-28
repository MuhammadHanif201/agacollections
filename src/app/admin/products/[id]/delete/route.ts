import { adminAction, flash, notFound, redirect } from '@/lib/admin/http';
import { destroyProduct } from '@/services/admin/products';

/** ProductController::destroy (DELETE via _method) */
export const POST = adminAction({
  DELETE: async ({ req, admin, params }) => {
    const id = Number(params.id);
    const r = Number.isInteger(id) ? await destroyProduct(id, req, admin._id) : { notFound: true as const };
    if ('notFound' in r) return notFound(req);
    if ('blocked' in r) { await flash({ error: r.blocked }); return redirect(`/admin/products/${id}/edit`); }
    await flash({ success: 'Product deleted.' });
    return redirect('/admin/products');
  },
});
