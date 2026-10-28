'use client';

import { useEffect } from 'react';

/** A page's own [data-dc-reveal] observer (the homepage used a lower threshold than the layout) */
export default function ScrollReveal({ threshold }: { threshold: number }) {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          const delay = el.dataset.dcDelay ? parseFloat(el.dataset.dcDelay) * 1000 : 0;
          setTimeout(() => el.classList.add('is-visible'), delay);
          io.unobserve(el);
        }
      });
    }, { threshold });
    document.querySelectorAll('[data-dc-reveal]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [threshold]);
  return null;
}
