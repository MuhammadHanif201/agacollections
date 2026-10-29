// AGA Collections premium header, side drawer, search overlay and (hidden) mini-cart:
// same markup as clientside/zayqora/layout/header.blade.php.
import { connectDb } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { numberFormat, plural, strTitle, waLink } from '@/lib/format';
import { Product } from '@/models/Product';
import type { CompanySettingDoc } from '@/models/content';
import type { CartLine } from '@/models/Session';
import { getActiveHeadlines, type MenuCategory } from '@/services/settings';
import { toCards } from '@/services/catalog';
import { cartSubtotal } from '@/services/pricing';
import CartBadge from './CartBadge';
import HeadlineBar from './HeadlineBar';
import HeaderInteractions from './HeaderInteractions';
import ProductCard from './ProductCard';
import SearchOverlay from './SearchOverlay';
import CartSidebarItems from './CartSidebarItems';
import StoreLink from './StoreLink';

const NEW_ARRIVAL = 'Home Page - New Arrival';

export default async function Header({
  company,
  menuCategories,
  loggedIn,
  cart,
}: {
  company: CompanySettingDoc | null;
  menuCategories: MenuCategory[];
  loggedIn: boolean;
  cart: Record<string, CartLine>;
}) {
  await connectDb();
  const latest = await Product.find({ status: 'active' }).sort({ created_at: -1, _id: 1 }).limit(4).lean();
  const latestCards = await toCards(latest);
  const headlines = (await getActiveHeadlines())
    .filter((h) => h.message_en?.trim())
    .map((h) => ({ message: h.message_en.trim(), link: h.link_url || null, bg: h.bg_color || '#161426', color: h.text_color || '#ffffff' }));

  const wa = (company?.whatsapps?.[0] ?? '').replace(/\D+/g, '');
  const phone = company?.phones?.[0] ?? null;
  const cats = menuCategories.filter((c) => c.title !== NEW_ARRIVAL);
  const feat = cats.find((c) => !!c.banner) ?? null;
  const brand = company?.name ?? 'AGA Collections';
  const total = cartSubtotal(cart);

  let navCount = 0;
  const navCats = menuCategories.filter((c) => {
    if (c.title !== NEW_ARRIVAL && navCount < 4) { navCount++; return true; }
    return false;
  });

  return (
    <>
      {/* ── Announcement Bar: Admin › Headlines, else the brand line ── */}
      <HeadlineBar headlines={headlines} />

      {/* ── Main Header ── */}
      <header className="zq-header" id="dcHeader">
        <div className="zq-header-inner">
          <div className="zq-header-left">
            <button type="button" className="dc-hbtn dc-menu-btn" id="dcMenuBtn" aria-label="Open menu" aria-controls="dcSideDrawer" aria-expanded="false">
              <div className="dc-menu-lines">
                <span className="ln-a"></span>
                <span className="ln-b"></span>
                <span className="ln-c"></span>
              </div>
            </button>

            <div className="dc-hdr-sep d-none d-md-block"></div>

            <button type="button" className="dc-search-trigger trigger-search" aria-label="Search">
              <i className="ri-search-line"></i>
              <span>Search</span>
            </button>
          </div>

          <div className="zq-header-logo">
            <StoreLink href="/" aria-label="AGA Collections — Home" className="dc-brand-wordmark">
              <span>AGA Collections</span>
            </StoreLink>
          </div>

          <div className="zq-header-right">
            {loggedIn ? (
              <>
                <StoreLink href="/customer/dashboard" className="dc-hbtn dc-hbtn-stack d-none d-md-flex" title="Account" aria-label="My Account">
                  <i className="ri-user-3-line"></i>
                  <span className="dc-icon-label">Account</span>
                </StoreLink>
                <StoreLink href="/customer/dashboard" className="dc-hbtn d-flex d-md-none" title="Account" aria-label="My Account">
                  <i className="ri-user-3-line"></i>
                </StoreLink>
              </>
            ) : (
              <>
                <StoreLink href="/customer/login" className="dc-hbtn dc-hbtn-stack d-none d-md-flex" title="Login" aria-label="Login">
                  <i className="ri-user-3-line"></i>
                  <span className="dc-icon-label">Login</span>
                </StoreLink>
                <StoreLink href="/customer/login" className="dc-hbtn d-flex d-md-none" title="Login" aria-label="Login">
                  <i className="ri-user-3-line"></i>
                </StoreLink>
              </>
            )}
            <StoreLink href="/wishlist" className="dc-hbtn dc-hbtn-stack d-none d-md-flex" title="Wishlist" aria-label="Wishlist">
              <i className="ri-heart-line"></i>
              <span className="dc-icon-label">Wishlist</span>
            </StoreLink>
            <StoreLink href="/cart" className="dc-hbtn dc-hbtn-stack d-none d-md-flex" title="Cart" aria-label="Cart">
              <i className="ri-shopping-bag-line"></i>
              <span className="dc-icon-label">Cart</span>
              <CartBadge id="cart-count" />
            </StoreLink>
            <StoreLink href="/cart" className="dc-hbtn d-flex d-md-none" title="Cart" aria-label="Cart">
              <i className="ri-shopping-bag-line"></i>
              <CartBadge id="cart-count-mobile" />
            </StoreLink>
          </div>
        </div>

        {menuCategories.length > 0 && (
          <nav className="dc-nav-strip" aria-label="Main navigation">
            <div className="dc-nav-item">
              <StoreLink href="/shop">
                Shop All
              </StoreLink>
            </div>
            {navCats.map((cat) => (
              <div className="dc-nav-item" key={cat._id}>
                <StoreLink href={`/shop/${cat.slug ?? ''}`}>{cat.title}</StoreLink>
              </div>
            ))}
            <div className="dc-nav-item">
              <StoreLink href="/shop">Collections</StoreLink>
              <div className="dc-nav-dropdown">
                {cats.map((cat) => (
                  <StoreLink href={`/shop/${cat.slug ?? ''}`} key={cat._id}>
                    {cat.image && <img src={mediaUrl(cat.image)} alt={cat.title} loading="lazy" />}
                    {cat.title}
                  </StoreLink>
                ))}
              </div>
            </div>
            <div className="dc-nav-item">
              <StoreLink href="/about-us">Our Story</StoreLink>
            </div>
            <div className="dc-nav-item">
              <StoreLink href="/contact-us">Contact</StoreLink>
            </div>
          </nav>
        )}

        <div className="dc-mobile-search">
          <button type="button" className="dc-mobile-search-pill trigger-search" aria-label="Search products">
            <i className="ri-search-line" aria-hidden="true"></i>
            <span>Search products...</span>
          </button>
        </div>
      </header>

      {/* ── Side Drawer ── */}
      <div id="dcDrawerOverlay"></div>
      <aside id="dcSideDrawer" className="zqd" aria-label="Main menu" aria-hidden="true">
        <div className="zqd-top">
          <StoreLink href="/" className="zqd-brand" aria-label={`${brand} home`}>{brand}</StoreLink>
          <button type="button" className="zqd-close" id="dcDrawerClose" aria-label="Close menu"><i className="ri-close-line" aria-hidden="true"></i></button>
        </div>

        <button type="button" className="zqd-search trigger-search" aria-label="Search products">
          <i className="ri-search-line" aria-hidden="true"></i><span>Search products</span>
        </button>

        <nav className="zqd-nav" aria-label="Main">
          <StoreLink href="/shop" className="zqd-link"><span>Shop All</span><i className="ri-arrow-right-line" aria-hidden="true"></i></StoreLink>
          <details className="zqd-group" open>
            <summary className="zqd-link"><span>Collections</span><i className="zqd-plus" aria-hidden="true"></i></summary>
            <div className="zqd-sub">
              {cats.map((category) => (
                <StoreLink href={`/shop/${category.slug ?? ''}`} className="zqd-cat" key={category._id}>
                  <span className="zqd-cat-img">
                    {category.image && <img src={mediaUrl(category.image)} alt="" loading="lazy" width={48} height={60} />}
                  </span>
                  <span className="zqd-cat-t">{strTitle(category.title)}</span>
                  <span className="zqd-cat-n">{category.products_count} {plural('style', category.products_count)}</span>
                </StoreLink>
              ))}
            </div>
          </details>
          <StoreLink href="/about-us" className="zqd-link"><span>Our Story</span><i className="ri-arrow-right-line" aria-hidden="true"></i></StoreLink>
          <StoreLink href="/contact-us" className="zqd-link"><span>Contact</span><i className="ri-arrow-right-line" aria-hidden="true"></i></StoreLink>
        </nav>

        {feat && (
          <StoreLink href={`/shop/${feat.slug ?? ''}`} className="zqd-feature">
            <img src={mediaUrl(feat.banner)} alt="" loading="lazy" />
            <span className="zqd-feature-txt">
              <small>The edit</small>
              <strong>{strTitle(feat.title)}</strong>
              <em>Shop now <i className="ri-arrow-right-line" aria-hidden="true"></i></em>
            </span>
          </StoreLink>
        )}

        <div className="zqd-account">
          <StoreLink href="/wishlist"><i className="ri-heart-line" aria-hidden="true"></i>Wishlist</StoreLink>
          {loggedIn
            ? <StoreLink href="/customer/dashboard"><i className="ri-user-3-line" aria-hidden="true"></i>My account</StoreLink>
            : <StoreLink href="/customer/login"><i className="ri-user-3-line" aria-hidden="true"></i>Sign in</StoreLink>}
          <StoreLink href="/cart"><i className="ri-shopping-bag-line" aria-hidden="true"></i>Your bag</StoreLink>
          <StoreLink href="/policies"><i className="ri-file-list-3-line" aria-hidden="true"></i>Policies</StoreLink>
        </div>

        <div className="zqd-help">
          <p className="zqd-help-title">Need help with sizing or an order?</p>
          {wa && (
            <StoreLink href={waLink(wa)} target="_blank" rel="noopener noreferrer" className="zqd-wa">
              <i className="ri-whatsapp-line" aria-hidden="true"></i> Chat on WhatsApp
            </StoreLink>
          )}
          {phone && (
            <StoreLink href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="zqd-phone"><i className="ri-phone-line" aria-hidden="true"></i> {phone}</StoreLink>
          )}
          <p className="zqd-note"><i className="ri-hand-coin-line" aria-hidden="true"></i> Cash on delivery across Pakistan</p>
        </div>
      </aside>

      <HeaderInteractions />

      {/* Legacy #sideMenu shim for any existing JS that targets it */}
      <div id="sideMenu" className="d-none"></div>

      <SearchOverlay
        categories={menuCategories.slice(0, 8).filter((c) => c.title !== NEW_ARRIVAL).map((c) => ({ title: c.title, slug: c.slug ?? '' }))}
        showCategories={menuCategories.length > 0}
      >
        {latestCards.map((p) => (
          <div key={p.id}><ProductCard product={p} /></div>
        ))}
      </SearchOverlay>

      <div className="offcanvas-overlay"></div>
      <div className="cart__sidebar d-none">
        <div className="container">
          <div className="cart__content">
            <div className="cart-text" id="cart-items-container"><CartSidebarItems cart={cart} /></div>
            <div className="cart-icon"> <i className="fal fa-times"></i> </div>
            <div className="cart-bottom">
              <div className="cart-bottom__text" id="cart-subtotal-container">
                <div className="border-top pt-3">
                  <div className="d-flex justify-content-between mb-3"> <span className="fw-bold">Subtotal:</span> <span className="fw-bold text-primary">PKR {numberFormat(total, 2)}</span> </div>
                  <StoreLink href="/cart" className="btn btn-outline-dark w-100 mb-2">VIEW CART</StoreLink> <StoreLink href="/checkout" className="btn btn-dark w-100">CHECKOUT</StoreLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="cart-offcanvas-overlay"></div>
    </>
  );
}
