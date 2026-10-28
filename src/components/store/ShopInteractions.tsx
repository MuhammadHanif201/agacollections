'use client';

import { useEffect } from 'react';

/** shop.blade.php script: grid column toggle, mobile filter drawer, single-photo arrows, Pixel Search */
export default function ShopInteractions({ search }: { search: string | null }) {
  useEffect(() => {
    const grid = document.getElementById('dcProductGrid');
    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.dc-grid-btn'));
    const onGrid = function (this: HTMLButtonElement) {
      const cols = this.getAttribute('data-cols');
      btns.forEach((b) => b.classList.remove('is-active'));
      this.classList.add('is-active');
      if (!grid) return;
      grid.classList.remove('cols-2', 'cols-3', 'cols-4');
      grid.classList.add('cols-' + cols);
      // Let the new column widths paint, then resize the photo sliders
      requestAnimationFrame(() => requestAnimationFrame(() => {
        grid.querySelectorAll('.product-img-swiper').forEach((el) => {
          const sw = (el as HTMLElement & { swiper?: { update(): void; navigation?: { update(): void } } }).swiper;
          if (sw) { sw.update(); sw.navigation?.update(); }
        });
      }));
    };
    btns.forEach((b) => b.addEventListener('click', onGrid));

    // Hide prev/next on products with a single photo
    document.querySelectorAll('.product-img-swiper').forEach((el) => {
      if (el.querySelectorAll('.swiper-slide').length <= 1) {
        el.querySelectorAll<HTMLElement>('.swiper-button-prev, .swiper-button-next').forEach((b) => { b.style.display = 'none'; });
      }
    });

    const fab = document.getElementById('dcFilterFab');
    const overlay = document.getElementById('dcShopDrawerOverlay');
    const drawer = document.getElementById('dcShopDrawer');
    const closeBtn = document.getElementById('dcShopDrawerClose');
    const open = () => {
      overlay?.classList.add('is-open'); drawer?.classList.add('is-open');
      overlay?.removeAttribute('aria-hidden'); document.body.style.overflow = 'hidden';
    };
    const close = () => {
      overlay?.classList.remove('is-open'); drawer?.classList.remove('is-open');
      overlay?.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && drawer?.classList.contains('is-open')) close(); };
    fab?.addEventListener('click', open);
    overlay?.addEventListener('click', close);
    closeBtn?.addEventListener('click', close);
    document.addEventListener('keydown', onKey);

    if (search && window.fbq) window.fbq('track', 'Search', { search_string: search });

    return () => {
      btns.forEach((b) => b.removeEventListener('click', onGrid));
      fab?.removeEventListener('click', open);
      overlay?.removeEventListener('click', close);
      closeBtn?.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [search]);
  return null;
}
