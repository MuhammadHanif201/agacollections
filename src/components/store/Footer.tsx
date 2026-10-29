// clientside/zayqora/layout/footer.blade.php
import { env } from '@/lib/env';
import { isProfileUrl, waLink } from '@/lib/format';
import type { CompanySettingDoc, PolicyDoc } from '@/models/content';
import { emailList, type MenuCategory } from '@/services/settings';
import BackToTop from './BackToTop';
import NewsletterForm from './NewsletterForm';
import StoreLink from './StoreLink';

const SOCIAL_ICONS: Record<string, string> = {
  facebook: 'ri-facebook-fill',
  instagram: 'ri-instagram-fill',
  twitter: 'ri-twitter-x-fill',
  linkedin: 'ri-linkedin-fill',
  youtube: 'ri-youtube-fill',
  tiktok: 'ri-tiktok-fill',
  snapchat: 'ri-snapchat-fill',
  pinterest: 'ri-pinterest-fill',
};

const ucfirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Footer({
  company,
  menuCategories,
  footerPolicies,
  newsletterNotice,
}: {
  company: CompanySettingDoc | null;
  menuCategories: MenuCategory[];
  footerPolicies: PolicyDoc[];
  newsletterNotice: { ok: boolean; text: string } | null;
}) {
  const firstWa = company?.whatsapps?.[0] ?? null;
  const waNumber = firstWa ? firstWa.replace(/\D+/g, '') : null;
  const emails = [...new Set(emailList(company))];
  const phones = company?.phones ?? [];
  const whatsapps = company?.whatsapps ?? [];
  const socials = Array.isArray(company?.social_links) ? company!.social_links : [];

  return (
    <>
      {/* popup area start */}
      <div className="overlay"></div>

      <div className="product-popup">
        <div className="view-background">
          <div className="row">
            <div className="col-xl-5 col-lg-5 col-md-5">
              <div className="quickview">
                <div className="quickview__thumb">
                  <img id="quickViewImage" src="/images/placeholder.png" alt="Product image" loading="lazy" />
                </div>
              </div>
            </div>
            <div className="col-xl-7 col-lg-7 col-md-7">
              <div className="viewcontent">
                <div className="viewcontent__header">
                  <h2 id="quickViewName"></h2>
                  <button type="button" className="view_close product-p-close"><i className="fal fa-times-circle"></i></button>
                </div>
                <div className="viewcontent__rating">
                  <i className="fal fa-star ratingcolor"></i>
                  <i className="fal fa-star ratingcolor"></i>
                  <i className="fal fa-star ratingcolor"></i>
                  <i className="fal fa-star"></i>
                </div>
                <div className="viewcontent__price"><h3 id="quickViewPrice"></h3></div>
                <div className="viewcontent__stock"><h3 id="quickViewStock"></h3></div>
                <div className="viewcontent__details"><p id="quickViewDescription"></p></div>
                <div className="viewcontent__action">
                  <form id="addToCartForm">
                    <input type="hidden" id="quickViewProductId" name="product_id" />
                    <input type="hidden" id="quickViewVariantId" name="variant_id" />
                    <label htmlFor="quickViewQuantity">Qty</label>
                    <input type="number" name="quantity" id="quickViewQuantity" defaultValue={1} min={1} className="form-control d-inline-block w-auto mx-2" />
                    <button type="submit" className="btn btn-dark">Add to Cart</button>
                  </form>
                </div>
                <div className="viewcontent__footer">
                  <ul>
                    <li>Category:</li>
                    <li>SKU:</li>
                  </ul>
                  <ul>
                    <li id="quickViewCategory"></li>
                    <li id="quickViewSKU"></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* popup area end */}

      {waNumber && (
        <StoreLink href={waLink(waNumber)} target="_blank" rel="noopener noreferrer" className="whatsapp-float" aria-label="Chat on WhatsApp">
          <i className="fab fa-whatsapp"></i>
        </StoreLink>
      )}

      <footer className="dc-footer pt-2" aria-label="Site footer">
        <div className="dc-footer__nl">
          <div className="container">
            <div className="row align-items-center gy-3">
              <div className="col-lg-5">
                <p className="dc-footer__nl-eyebrow">Newsletter</p>
                <p className="dc-footer__nl-heading">Stay updated with new arrivals</p>
              </div>
              <div className="col-lg-7">
                <NewsletterForm btnClass="btn" inputClass="form-control" notice={newsletterNotice} />
              </div>
            </div>
          </div>
        </div>

        <hr className="dc-footer__gold-rule" />

        <div className="container dc-footer__cols">
          <div className="row gy-4 gy-lg-0">
            <div className="col-lg-4 col-md-6 dc-footer__brand">
              {company && (
                <>
                  <StoreLink href="/" className="d-inline-flex align-items-center mb-2" aria-label="AGA Collections — Home"
                    style={{ fontFamily: "var(--body-font,'Arimo',sans-serif)", fontWeight: 600, fontSize: '1.2rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', lineHeight: 1, whiteSpace: 'nowrap', gap: '0.7em' }}>
                    <img src="/clientside/company_logo/monogram-terracotta.png" alt="" width={36} height={30} style={{ height: '1.9em', width: 'auto' }} />
                    <span>AGA Collections</span>
                  </StoreLink>
                  <p className="dc-footer__tagline">&ldquo;Made for Your Style.&rdquo;</p>
                  {company.description && <p className="dc-footer__desc">{company.description}</p>}
                </>
              )}

              {socials.length > 0 && (
                <div className="dc-footer__social-row">
                  {socials.map((social, i) => {
                    const pl = String(social.platform ?? '').toLowerCase();
                    const ic = SOCIAL_ICONS[pl] ?? 'ri-global-line';
                    return env.socialLinksEnabled && isProfileUrl(social.url) ? (
                      <StoreLink key={i} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={ucfirst(pl)} className={`dc-footer__social-link dc-footer__social-link--${pl}`}>
                        <i className={ic}></i>
                      </StoreLink>
                    ) : (
                      // Links switched off until the real accounts are ready (SOCIAL_LINKS_ENABLED=true turns them on)
                      <span key={i} role="img" aria-label={ucfirst(pl)} className={`dc-footer__social-link dc-footer__social-link--${pl}`} style={{ cursor: 'default' }}>
                        <i className={ic} aria-hidden="true"></i>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="col-lg-2 col-6 dc-footer-links-col">
              <p className="dc-footer__col-title">Collections</p>
              <ul className="list-unstyled mb-0">
                {menuCategories.slice(0, 6).map((child) => (
                  <li key={child._id}><StoreLink href={`/shop/${child.slug ?? ''}`} className="dc-footer__nav-link">{child.title}</StoreLink></li>
                ))}
              </ul>
            </div>

            <div className="col-lg-2 col-6 dc-footer-links-col">
              <p className="dc-footer__col-title">Quick Links</p>
              <ul className="list-unstyled mb-0">
                <li><StoreLink href="/shop" className="dc-footer__nav-link">Shop All</StoreLink></li>
                <li><StoreLink href="/about-us" className="dc-footer__nav-link">About Us</StoreLink></li>
                <li><StoreLink href="/contact-us" className="dc-footer__nav-link">Contact</StoreLink></li>
                <li><StoreLink href="/policies" className="dc-footer__nav-link">Our Policies</StoreLink></li>
                {footerPolicies.map((fp) => (
                  <li key={fp._id}><StoreLink href={`/policies#${fp.key}`} className="dc-footer__nav-link">{fp.title_en}</StoreLink></li>
                ))}
              </ul>
            </div>

            <div className="col-lg-4 col-md-6">
              <p className="dc-footer__col-title">Get in Touch</p>

              <div className="dc-footer__ci">
                <i className="ri-map-pin-2-line dc-footer__ci-icon"></i>
                <span className="dc-footer__ci-text">{company?.address || 'Gulberg 2, Lahore, Pakistan'}</span>
              </div>

              {emails.length > 0 ? emails.map((email) => (
                <div className="dc-footer__ci" key={email}>
                  <i className="ri-mail-line dc-footer__ci-icon"></i>
                  <span className="dc-footer__ci-text"><StoreLink href={`mailto:${email}`}>{email}</StoreLink></span>
                </div>
              )) : (
                <div className="dc-footer__ci">
                  <i className="ri-mail-line dc-footer__ci-icon"></i>
                  <span className="dc-footer__ci-text"><StoreLink href="mailto:agacollectionsofficial@gmail.com">agacollectionsofficial@gmail.com</StoreLink></span>
                </div>
              )}

              {phones.length > 0 ? phones.map((phone, i) => (
                <div className="dc-footer__ci" key={i}>
                  <i className="ri-phone-line dc-footer__ci-icon"></i>
                  <span className="dc-footer__ci-text">
                    <StoreLink href={`tel:${phone.replace(/\D/g, '')}`}>
                      <span dir="ltr" style={{ unicodeBidi: 'plaintext' }}>{phone}</span>
                    </StoreLink>
                  </span>
                </div>
              )) : (
                <div className="dc-footer__ci">
                  <i className="ri-phone-line dc-footer__ci-icon"></i>
                  <span className="dc-footer__ci-text"><StoreLink href="tel:03089367692">0308-9367692</StoreLink></span>
                </div>
              )}

              {whatsapps.length > 0 ? whatsapps.map((wa, i) => (
                <div className="dc-footer__ci" key={i}>
                  <i className="ri-whatsapp-line dc-footer__ci-icon wa"></i>
                  <span className="dc-footer__ci-text">
                    <StoreLink href={waLink(wa)} target="_blank" rel="noopener noreferrer">
                      <span dir="ltr" style={{ unicodeBidi: 'plaintext' }}>{wa}</span>
                    </StoreLink>
                  </span>
                </div>
              )) : (
                <div className="dc-footer__ci">
                  <i className="ri-whatsapp-line dc-footer__ci-icon wa"></i>
                  <span className="dc-footer__ci-text"><StoreLink href={waLink('923089367692')} target="_blank" rel="noopener noreferrer">0308-9367692</StoreLink></span>
                </div>
              )}

              <p className="dc-footer__col-title mt-4">Payment</p>
              <div className="dc-footer__cod">
                <i className="ri-secure-payment-line"></i>
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="dc-footer__bottom">
            <div className="d-flex justify-content-center">
              <p className="dc-footer__bottom-copy" style={{ textAlign: 'center' }}>
                &copy; {new Date().getUTCFullYear()}{' '}
                <StoreLink href="/" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>AGA Collections</StoreLink>
                {' '}&mdash; All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <BackToTop />
    </>
  );
}
