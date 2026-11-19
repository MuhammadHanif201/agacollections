'use client';

import { useEffect, useRef } from 'react';

/**
 * <video autoplay muted loop playsinline>. React leaves the `muted` attribute out of
 * server HTML, and browsers only autoplay muted video, so it is set here.
 * Phones (max-width 767px) get `srcMobile`/`posterMobile` when given (a tall video fits the tall phone hero).
 */
export default function HeroVideo({ src, poster, srcMobile, posterMobile }: { src: string; poster?: string; srcMobile?: string; posterMobile?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (srcMobile && window.matchMedia('(max-width: 767px)').matches) {
      if (posterMobile) v.poster = posterMobile;
      v.src = srcMobile; // the src attribute takes over from the <source> below
      v.load();
    }
    v.muted = true;
    v.play().catch(() => {});
  }, [srcMobile, posterMobile]);
  return (
    <video ref={ref} className="zq-hero-video" autoPlay muted loop playsInline preload="metadata" poster={poster} aria-hidden="true">
      <source src={src} type="video/mp4" />
    </video>
  );
}
