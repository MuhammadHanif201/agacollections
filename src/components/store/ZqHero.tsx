// partials/zq-hero.blade.php — one hero design and height for home, shop, category and policies.
import { Fragment } from 'react';
import HeroVideo from './HeroVideo';
import StoreLink from './StoreLink';

export interface Crumb { label: string; url?: string }

export default function ZqHero({
  image,
  imageMobile,
  position = 'center',
  crumbs = [],
  eyebrow,
  title = '',
  subtitle,
  cta,
  video,
  poster,
  tall = false,
  tone,
  plain = false,
  plainAlt,
}: {
  plain?: boolean; // show the image as a full banner (its own text), no overlay
  plainAlt?: string;
  image?: string | null;
  imageMobile?: string | null;
  position?: string;
  crumbs?: Crumb[];
  eyebrow?: string | null;
  title?: string;
  subtitle?: string | null;
  cta?: { label: string; url: string } | null;
  video?: string | null;
  poster?: string | null;
  tall?: boolean;
  tone?: 'navy';
}) {
  const navy = tone === 'navy';
  const posterSrc = poster ?? image ?? undefined;

  // A designed banner that already carries its own headline: show it whole, with no veil or text on top
  if (plain && image) {
    return (
      <section className="zq-banner" aria-label={title}>
        <picture>
          {imageMobile && <source media="(max-width: 767px)" srcSet={imageMobile} />}
          <img src={image} alt={plainAlt ?? title} width={1920} height={1080} fetchPriority="high" decoding="async" />
        </picture>
        <h1 className="visually-hidden">{title}</h1>
      </section>
    );
  }

  return (
    <section className={`zq-hero${navy ? ' zq-hero--navy' : ''}${tall ? ' zq-hero--tall' : ''}${video ? ' zq-hero--video' : ''}`} aria-label={title}>
      {image && (
        <picture>
          {imageMobile && <source media="(max-width: 767px)" srcSet={imageMobile} />}
          <img className="zq-hero-img" src={image} alt="" fetchPriority="high" decoding="async" style={{ objectPosition: position }} />
        </picture>
      )}
      {video && <HeroVideo src={video} poster={posterSrc} />}
      <div className="zq-hero-veil" aria-hidden="true"></div>

      <div className="zq-hero-inner">
        {crumbs.length > 0 && (
          <nav className="zq-hero-crumbs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <Fragment key={i}>
                {c.url ? <StoreLink href={c.url}>{c.label}</StoreLink> : <span aria-current="page">{c.label}</span>}
                {i < crumbs.length - 1 && <i aria-hidden="true">/</i>}
              </Fragment>
            ))}
          </nav>
        )}

        {eyebrow && <p className="zq-hero-eyebrow">{eyebrow}</p>}

        <h1 className="zq-hero-title">{title}</h1>

        {subtitle && <p className="zq-hero-sub">{subtitle}</p>}

        {cta && <StoreLink href={cta.url} className="zq-hero-btn">{cta.label}</StoreLink>}
      </div>
      {tall && <StoreLink className="zq-hero-scroll" href="#zqAfterHero" aria-label="Scroll down"><span></span></StoreLink>}
    </section>
  );
}
