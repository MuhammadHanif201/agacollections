'use client';
// Announcement bar: the active headlines from Admin › Headlines, one at a time; the brand line when there are none.

import { useEffect, useState } from 'react';
import StoreLink from './StoreLink';

export type Headline = { message: string; link: string | null; bg: string; color: string };

const TEXT_STYLE = { margin: 0, fontFamily: "'Arimo',Arial,sans-serif", fontSize: 9, letterSpacing: '0.26em', textTransform: 'uppercase', lineHeight: 1 } as const;

export default function HeadlineBar({ headlines }: { headlines: Headline[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (headlines.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % headlines.length), 4000);
    return () => clearInterval(t);
  }, [headlines.length]);

  if (!headlines.length) {
    return (
      <div id="rotating-headlines" style={{ background: '#161426', padding: '0.55em 1em', textAlign: 'center' }}>
        <p style={{ ...TEXT_STYLE, color: '#ffffff' }}>
          AGA Collections — Cash on Delivery<span className="zq-ann-more"> Across Pakistan</span>
        </p>
      </div>
    );
  }
  const h = headlines[i] ?? headlines[0];
  return (
    <div id="rotating-headlines" style={{ background: h.bg, padding: '0.55em 1em', textAlign: 'center', transition: 'background .3s' }} aria-live="polite">
      <p style={{ ...TEXT_STYLE, color: h.color }} key={i}>
        {h.link ? <StoreLink href={h.link} style={{ color: 'inherit', textDecoration: 'none' }}>{h.message}</StoreLink> : h.message}
      </p>
    </div>
  );
}
