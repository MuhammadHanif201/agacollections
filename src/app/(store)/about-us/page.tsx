// clientside/zayqora/about.blade.php
import { connectDb } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { buildMetadata } from '@/lib/seo';
import { PageStyles } from '@/components/store/LegacyStyles';
import ZqHero from '@/components/store/ZqHero';
import { AboutSection } from '@/models/content';
import { nextId } from '@/models/Counter';
import { getCompanySetting } from '@/services/settings';

export async function generateMetadata() {
  const s = await getCompanySetting();
  const brand = s?.name ?? 'AGA Collections';
  return buildMetadata({
    page: 'about',
    metaDesc: `The story behind ${brand}, a Lahore streetwear label making baggy jeans, oversized tees, button-down shirts, football jerseys and zip-up hoodies.`,
  });
}

/** AboutSection::firstOrCreate([]) */
async function getAbout() {
  await connectDb();
  const found = await AboutSection.findOne().sort({ _id: 1 }).lean();
  if (found) return found;
  const created = await AboutSection.create({ _id: await nextId('about_sections') });
  return created.toObject();
}

const DEFAULT_IMG = '/clientside/abaya/assets/img/about/';

export default async function AboutPage() {
  const about = await getAbout();
  const heroTitle = about.title ?? 'Made for Your Style';
  const brandSub = about.brand_subtitle ?? 'Our Story';
  const brandTitle = about.brand_title ?? 'AGA Collections';
  const brandBody1 = about.brand_body1 ?? '';
  const brandBody2 = about.brand_body2 ?? '';
  const brandCta = about.brand_cta ?? 'Shop the Collection';
  const stats = [
    [about.brand_stat1_value ?? 'COD', about.brand_stat1_label ?? 'Cash on Delivery'],
    [about.brand_stat2_value ?? 'PAK', about.brand_stat2_label ?? 'Nationwide Delivery'],
    [about.brand_stat3_value ?? '2–4', about.brand_stat3_label ?? 'Working Days to Major Cities'],
    [about.brand_stat4_value ?? '5', about.brand_stat4_label ?? 'Collections'],
  ];
  const img1 = about.image ? mediaUrl(about.image) : DEFAULT_IMG + 'image1-about.jpg';
  const img2 = about.image2 ? mediaUrl(about.image2) : DEFAULT_IMG + 'image2-about.jpg';

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__partials__zq-hero.1', 'clientside__zayqora__about.1']} />

      <ZqHero
        image={img1}
        position="center 12%"
        crumbs={[{ label: 'Home', url: '/' }, { label: 'Our Story' }]}
        eyebrow="AGA Collections — Pakistan"
        title={heroTitle}
        subtitle="Baggy denim, oversized tees and relaxed shirts, crafted with care and delivered to your door."
        cta={{ label: 'Shop the Collection', url: '/shop' }}
      />

      <div className="ab-trust">
        <div className="container">
          <div className="ab-trust-grid">
            <div className="ab-trust-item">
              <i className="ri-t-shirt-2-line"></i>
              <div>
                <strong>Streetwear Essentials</strong>
                <span>Jeans, tees, shirts, jerseys and hoodies</span>
              </div>
            </div>
            <div className="ab-trust-sep"></div>
            <div className="ab-trust-item">
              <i className="ri-map-pin-2-line"></i>
              <div>
                <strong>Based in Lahore</strong>
                <span>Gulberg, Lahore, Pakistan</span>
              </div>
            </div>
            <div className="ab-trust-sep"></div>
            <div className="ab-trust-item">
              <i className="ri-truck-line"></i>
              <div>
                <strong>Nationwide COD</strong>
                <span>Pay on delivery, anywhere in Pakistan</span>
              </div>
            </div>
            <div className="ab-trust-sep"></div>
            <div className="ab-trust-item">
              <i className="ri-whatsapp-line"></i>
              <div>
                <strong>Help on WhatsApp</strong>
                <span>Sizing and order questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="ab-story" id="ab-story">
        <div className="container">
          <div className="ab-story-wrap">
            <div className="ab-story-media">
              <div className="ab-story-img-a">
                <img src={img1} alt="AGA Collections streetwear story" loading="lazy" />
              </div>
              <div className="ab-story-img-b">
                <img src={img2} alt="AGA Collections outfit details" loading="lazy" />
              </div>
              <div className="ab-story-badge">
                <div className="ab-story-badge-inner">
                  <span>Based in</span>
                  <strong>Lahore</strong>
                  <span>Pakistan</span>
                </div>
              </div>
              <div className="ab-story-decor-line"></div>
            </div>

            <div className="ab-story-text">
              <span className="ab-section-label">{brandSub}</span>
              <h2 className="ab-section-title">{brandTitle}</h2>
              <div className="ab-divider"></div>
              {brandBody1 && <p className="ab-body-lead">{brandBody1}</p>}
              {brandBody2 && <p className="ab-body">{brandBody2}</p>}
              <div className="ab-story-cta-row">
                <a href="/shop" className="ab-btn ab-btn-dark">
                  {brandCta} <i className="ri-arrow-right-line"></i>
                </a>
                <a href="/contact-us" className="ab-btn ab-btn-ghost-dark">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ab-promise">
        <div className="container">
          <div className="ab-promise-hd">
            <span className="ab-section-label" style={{ textAlign: 'center', display: 'block' }}>Why Choose Us</span>
            <h2 className="ab-section-title" style={{ textAlign: 'center' }}>The AGA Collections Promise</h2>
            <div className="ab-divider" style={{ justifyContent: 'center' }}></div>
          </div>
          <div className="ab-promise-grid">
            <div className="ab-promise-card">
              <div className="ab-promise-icon-wrap"><i className="ri-file-list-3-fill"></i></div>
              <h3>Clear Product Details</h3>
              <p>Every product page lists the fit, fabric, wash or print and the sizes in stock, so you know exactly what you are ordering.</p>
              <div className="ab-promise-foot"><span>No Guesswork</span><i className="ri-checkbox-circle-line"></i></div>
            </div>
            <div className="ab-promise-card ab-promise-card--featured">
              <div className="ab-promise-icon-wrap"><i className="ri-map-pin-2-fill"></i></div>
              <h3>Delivered to Your Door</h3>
              <p>We ship to every city and town in Pakistan with Cash on Delivery. Pay only when your order arrives safely.</p>
              <div className="ab-promise-foot"><span>Nationwide COD</span><i className="ri-checkbox-circle-line"></i></div>
            </div>
            <div className="ab-promise-card">
              <div className="ab-promise-icon-wrap"><i className="ri-heart-fill"></i></div>
              <h3>Help Before You Order</h3>
              <p>Not sure about your size? Message us on WhatsApp with your usual size and we will help you choose.</p>
              <div className="ab-promise-foot"><span>WhatsApp Support</span><i className="ri-checkbox-circle-line"></i></div>
            </div>
          </div>
        </div>
      </section>

      <section className="ab-stats">
        <div className="ab-stats-grid">
          {stats.map(([val, lbl], i) => (
            <div className="ab-stat" key={i}>
              <div className={`ab-stat-num${i === 3 ? ' ab-stat-stars' : ''}`}>{val}</div>
              <div className="ab-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {about.content && (
        <section className="ab-content">
          <div className="container">
            <div className="ab-content-inner">
              <span className="ab-section-label" style={{ display: 'block', marginBottom: '.5rem' }}>In Detail</span>
              <div className="ab-content-divider"></div>
              <div className="ab-rich" dangerouslySetInnerHTML={{ __html: about.content }} />
            </div>
          </div>
        </section>
      )}

      <section className="ab-cta">
        <div className="ab-cta-bg"></div>
        <div className="container ab-cta-inner">
          <div className="ab-cta-text">
            <span className="ab-eyebrow">{brandSub}</span>
            <h2 className="ab-cta-title">Begin Your<br /><em>AGA Collections Journey</em></h2>
          </div>
          <div className="ab-cta-actions">
            <a href="/shop" className="ab-btn ab-btn-gold ab-btn-lg">
              {brandCta} <i className="ri-arrow-right-line"></i>
            </a>
            <a href="/contact-us" className="ab-btn ab-btn-outline">
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
