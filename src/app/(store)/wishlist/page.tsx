// clientauth/dashboard/wishlist.blade.php
import { connectDb } from '@/lib/db';
import { numberFormat } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { buildMetadata } from '@/lib/seo';
import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import AccountShell from '@/components/store/AccountShell';
import { PageStyles } from '@/components/store/LegacyStyles';
import { Wishlist } from '@/models/content';
import { Product } from '@/models/Product';

export async function generateMetadata() {
  return buildMetadata({ page: 'wishlist' });
}

export default async function WishlistPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect('/customer/login/wishlist');
  await connectDb();
  const saved = await Wishlist.find({ user_id: customer._id }).sort({ _id: 1 }).lean();
  // Only products still on sale: drafts and deleted products drop out of the list
  const products = await Product.find({ _id: { $in: saved.map((i) => i.product_id) }, status: 'active' }).lean();
  const byId = new Map(products.map((p) => [p._id, p]));
  const items = saved.filter((i) => byId.has(i.product_id));

  return (
    <>
      <PageStyles pushed={['clientauth__dashboard__customer-sidebar.1', 'clientauth__dashboard__wishlist.1']} />
      <AccountShell customer={customer} active="wishlist">
        <div className="db-col-main">
          <div className="db-ph">
            <span className="db-ph-ey">Account</span>
            <h1>My Wishlist
              {items.length > 0 && (
                <>{' '}<span style={{ fontFamily: "'Inter',sans-serif", fontSize: '.85rem', fontStyle: 'normal', fontWeight: 400, color: 'var(--dc-muted)', marginLeft: 8 }}>({items.length})</span></>
              )}
            </h1>
          </div>

          {items.length === 0 ? (
            <div className="db-card">
              <div className="db-empty">
                <i className="ri-heart-line"></i>
                <div className="db-empty-title">Your wishlist is empty</div>
                <p>Save items you love by tapping the heart icon on any product.</p>
                <a href="/" className="db-btn db-btn-dark" style={{ marginTop: 16, display: 'inline-flex' }}>
                  <i className="ri-store-line"></i> Browse Collection
                </a>
              </div>
            </div>
          ) : (
            <div className="dbw-grid">
              {items.map((item) => {
                const product = byId.get(item.product_id);
                const primary = product?.images.find((i) => i.is_primary);
                const price = product?.price ?? 0;
                const hasSale = Boolean(product?.sale_price && product.sale_price > Number(product.price));
                const href = `/product/${product?.slug ?? product?._id ?? ''}`;
                return (
                  <div className="dbw-card" key={item._id}>
                    <a href={href} className="dbw-img-wrap">
                      {primary ? <img src={mediaUrl(primary.image_path)} alt={product?.name} className="dbw-img" /> : <div className="dbw-img-placeholder"><i className="ri-image-line"></i></div>}
                      {hasSale && <span className="dbw-sale-badge">Sale</span>}
                    </a>
                    <div className="dbw-body">
                      <a href={href} className="dbw-name">{product?.name ?? 'Product'}</a>
                      <div className="dbw-price">
                        <span className="dbw-price-main">PKR {numberFormat(price ?? 0, 2)}</span>
                        {hasSale && <span className="dbw-price-was">PKR {numberFormat(product!.sale_price, 2)}</span>}
                      </div>
                      <div className="dbw-actions">
                        <a href={href} className="db-btn db-btn-dark db-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                          <i className="ri-eye-line"></i> View
                        </a>
                        <form action="/customer/wishlist/remove" method="POST">
                          <input type="hidden" name="product_id" value={item.product_id} />
                          <button type="submit" className="db-btn db-btn-danger db-btn-sm" title="Remove">
                            <i className="ri-heart-fill"></i>
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AccountShell>
    </>
  );
}
