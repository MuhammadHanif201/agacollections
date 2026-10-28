// clientside/zayqora/contact.blade.php
import { env } from '@/lib/env';
import { isProfileUrl } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { buildMetadata, JsonLd, type MetaOptions } from '@/lib/seo';
import ContactSection from '@/components/store/ContactSection';
import { PageStyles } from '@/components/store/LegacyStyles';
import ZqHero from '@/components/store/ZqHero';
import { getCompanySetting } from '@/services/settings';
import StoreLink from '@/components/store/StoreLink';

async function meta(): Promise<MetaOptions> {
  const s = await getCompanySetting();
  const brand = s?.name ?? 'AGA Collections';
  const phone = s?.phones?.[0] ?? null;
  return {
    page: 'contact',
    metaDesc: `Contact ${brand} for order support, sizing help, or any inquiries.` + (phone ? ` Reach us via WhatsApp ${phone} or our contact form.` : " We're here to help — reach us via WhatsApp or our contact form."),
  };
}

export async function generateMetadata() {
  return buildMetadata(await meta());
}

export default async function ContactPage() {
  const company = await getCompanySetting();
  const raw = company?.emails;
  const contactEmail = raw && !Array.isArray(raw) ? raw.contact ?? raw.default ?? null : null;
  const address = company?.address ?? 'Gulberg 2, Lahore, Pakistan';

  const info = (
    <div className="ct-info">
      <div className="ct-info-label">Contact Information</div>
      <div className="ct-info-heading">We&apos;d love to<br /><em>hear from you</em></div>
      <div className="ct-info-divider"></div>

      <div className="ct-info-row">
        <div className="ct-info-row-icon"><i className="ri-map-pin-2-line"></i></div>
        <div className="ct-info-row-body">
          <span className="ct-info-row-key">Location</span>
          <div className="ct-info-row-val">{address}</div>
        </div>
      </div>

      {contactEmail && (
        <div className="ct-info-row">
          <div className="ct-info-row-icon"><i className="ri-mail-line"></i></div>
          <div className="ct-info-row-body">
            <span className="ct-info-row-key">Email</span>
            <div className="ct-info-row-val">
              <StoreLink href={`mailto:${contactEmail}`}>{contactEmail}</StoreLink>
            </div>
          </div>
        </div>
      )}

      {(company?.phones ?? []).map((phone, i) => (
        <div className="ct-info-row" key={`p${i}`}>
          <div className="ct-info-row-icon"><i className="ri-phone-line"></i></div>
          <div className="ct-info-row-body">
            <span className="ct-info-row-key">Phone</span>
            <div className="ct-info-row-val">
              <StoreLink href={`tel:${phone}`}>{phone}</StoreLink>
            </div>
          </div>
        </div>
      ))}

      {(company?.whatsapps ?? []).map((wa, i) => (
        <div className="ct-info-row" key={`w${i}`}>
          <div className="ct-info-row-icon"><i className="ri-whatsapp-line"></i></div>
          <div className="ct-info-row-body">
            <span className="ct-info-row-key">WhatsApp</span>
            <div className="ct-info-row-val">
              <StoreLink href={`https://wa.me/${wa.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">{wa}</StoreLink>
            </div>
          </div>
        </div>
      ))}

      <div className="ct-info-hours">
        <div className="ct-info-hours-title">
          <i className="ri-time-line"></i> Business Hours
        </div>
        <div className="ct-info-hours-row"><span>Monday – Friday</span><span>10am – 7pm</span></div>
        <div className="ct-info-hours-row"><span>Saturday</span><span>11am – 5pm</span></div>
        <div className="ct-info-hours-row"><span>Sunday</span><span>Closed</span></div>
      </div>

      {(company?.social_links ?? []).length > 0 && (
        <div className="ct-socials">
          {company!.social_links.filter((l) => l.platform && l.url).map((link, i) => {
            const p = link.platform.toLowerCase();
            return env.socialLinksEnabled && isProfileUrl(link.url) ? (
              <StoreLink key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={`ct-social ct-social--${p}`} title={link.platform}>
                <i className={`fab fa-${p}`}></i>
              </StoreLink>
            ) : (
              <span key={i} className={`ct-social ct-social--${p}`} role="img" aria-label={link.platform.charAt(0).toUpperCase() + link.platform.slice(1)} style={{ cursor: 'default' }}>
                <i className={`fab fa-${p}`} aria-hidden="true"></i>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageStyles pushed={['clientside__zayqora__contact.1', 'clientside__zayqora__partials__zq-hero.1']} />
      <JsonLd {...await meta()} />

      <ZqHero
        image={mediaUrl('banners/zq-contact.jpg')}
        imageMobile={mediaUrl('banners/zq-contact-m.jpg')}
        crumbs={[{ label: 'Home', url: '/' }, { label: 'Contact' }]}
        eyebrow="AGA Collections — Pakistan"
        title="Get in Touch"
        subtitle="Have a question about an order, need styling advice, or want to reach our team? We're always here for you."
      />

      <ContactSection info={info} />

      <div className="ct-map-section">
        <div className="ct-map-bar">
          <div className="container">
            <div className="ct-map-bar-inner">
              <div className="ct-map-bar-left">
                <div className="ct-map-ping"></div>
                <div>
                  <div className="ct-map-city">Lahore, Pakistan</div>
                  <div className="ct-map-coords">31°31′N &nbsp;·&nbsp; 74°21′E</div>
                </div>
              </div>
              <StoreLink href="https://maps.google.com/?q=Gulberg+2,+Lahore,+Pakistan" target="_blank" rel="noopener noreferrer" className="ct-map-dir">
                <i className="ri-navigation-line"></i> Get Directions
              </StoreLink>
            </div>
          </div>
        </div>

        <div className="ct-map-wrap">
          <iframe src="https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1sGulberg+2,+Lahore,+Pakistan!6i13" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          <div className="ct-map-card">
            <div className="ct-map-card-tag">Our Location</div>
            <div className="ct-map-card-city">Lahore</div>
            <p className="ct-map-card-addr">{address}</p>
          </div>
        </div>
      </div>
    </>
  );
}
