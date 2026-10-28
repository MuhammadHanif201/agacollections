'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** The card photo slider: window.initProductSwipers() from the product-card partial. */
export default function ProductImageSwiper({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let instance: { destroy: (a?: boolean, b?: boolean) => void } | null = null;
    let cancelled = false;
    import('swiper/bundle').then(({ default: Swiper }) => {
      if (cancelled || !el) return;
      instance = new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        speed: 350,
        grabCursor: true,
        watchOverflow: true,
        navigation: {
          nextEl: el.querySelector('.swiper-button-next'),
          prevEl: el.querySelector('.swiper-button-prev'),
        },
      });
    });
    return () => {
      cancelled = true;
      instance?.destroy(true, true);
    };
  }, []);

  return (
    <div ref={ref} className="swiper product-img-swiper overflow-hidden position-relative" style={{ background: 'var(--dc-cream)' }}>
      <div className="swiper-wrapper">{children}</div>
      <div className="swiper-button-prev"></div>
      <div className="swiper-button-next"></div>
    </div>
  );
}
