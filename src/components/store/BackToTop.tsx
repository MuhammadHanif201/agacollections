'use client';

import { useEffect, useState } from 'react';

/** Shown only after the visitor has scrolled down a good way, so it doesn't sit over the top of the page. */
export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`dc-back-top${show ? ' is-visible' : ''}`} title="Back to top" aria-label="Back to top" tabIndex={show ? 0 : -1}>
      <i className="ri-arrow-up-line"></i>
    </button>
  );
}
