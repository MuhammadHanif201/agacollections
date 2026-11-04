'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

// A single row of cards that scrolls sideways, with left/right arrows on wider screens
export default function RowScroller({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // one card per click
  const go = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: 'smooth' });
  };

  return (
    <div className="zq-rs">
      <button type="button" className="zq-rs-btn zq-rs-prev" aria-label="Previous" onClick={() => go(-1)} disabled={edge.start}>
        <i className="ri-arrow-left-s-line"></i>
      </button>
      <div className="zq-rs-track" ref={track}>{children}</div>
      <button type="button" className="zq-rs-btn zq-rs-next" aria-label="Next" onClick={() => go(1)} disabled={edge.end}>
        <i className="ri-arrow-right-s-line"></i>
      </button>
    </div>
  );
}
