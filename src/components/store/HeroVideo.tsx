'use client';

import { useEffect, useRef } from 'react';

/**
 * <video autoplay muted loop playsinline>. React leaves the `muted` attribute out of
 * server HTML, and browsers only autoplay muted video, so it is set here.
 */
export default function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);
  return (
    <video ref={ref} className="zq-hero-video" autoPlay muted loop playsInline preload="metadata" poster={poster} aria-hidden="true">
      <source src={src} type="video/mp4" />
    </video>
  );
}
