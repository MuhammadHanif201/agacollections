'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { loadSwiper } from '@/lib/swiper-lite';

/** The card photo slider: window.initProductSwipers() from the product-card partial.
 *  Only the first photo loads with the page; the card's other photos (rendered with data-src, see ProductCard) load
 *  when the shopper points at the card, touches it or changes slide, so a page of cards no longer downloads every photo. */
export default function ProductImageSwiper({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const loadRest = () => {
      el.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((img) => {
        if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute('data-srcset'); }
        img.src = img.dataset.src ?? '';
        img.removeAttribute('data-src');
      });
    };
    el.addEventListener('pointerenter', loadRest, { once: true });
    el.addEventListener('touchstart', loadRest, { once: true, passive: true });
    el.addEventListener('focusin', loadRest, { once: true });

    let instance: { destroy: (a?: boolean, b?: boolean) => void } | null = null;
    let cancelled = false;
    loadSwiper().then((Swiper) => {
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
        on: { slideChange: loadRest },
      });
    });
    return () => {
      cancelled = true;
      el.removeEventListener('pointerenter', loadRest);
      el.removeEventListener('touchstart', loadRest);
      el.removeEventListener('focusin', loadRest);
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
