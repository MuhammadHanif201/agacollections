'use client';

import { useState, useSyncExternalStore } from 'react';

const VOTED_KEY = 'zq-review-useful';
const readVoted = (): number[] => {
  try { return JSON.parse(localStorage.getItem(VOTED_KEY) ?? '[]') as number[]; } catch { return []; }
};
const subscribe = (cb: () => void) => { window.addEventListener('storage', cb); return () => window.removeEventListener('storage', cb); };

/** "Useful (n)" and "Share" under a review */
export default function ReviewActions({ productId, reviewId, helpful }: { productId: number; reviewId: number; helpful: number }) {
  const [count, setCount] = useState(helpful);
  const [tapped, setTapped] = useState(false);
  const [copied, setCopied] = useState(false);
  // tapped before, in this browser (false while rendering on the server)
  const stored = useSyncExternalStore(subscribe, () => readVoted().includes(reviewId), () => false);
  const voted = tapped || stored;

  const useful = async () => {
    if (voted) return;
    setTapped(true);
    setCount((c) => c + 1);
    try {
      localStorage.setItem(VOTED_KEY, JSON.stringify([...readVoted(), reviewId].slice(-200)));
    } catch { /* private mode */ }
    try {
      const res = await fetch(`/product/${productId}/review/${reviewId}/helpful`, { method: 'POST', headers: { Accept: 'application/json' } });
      const data = (await res.json().catch(() => ({}))) as { helpful?: number };
      if (res.ok && typeof data.helpful === 'number') setCount(data.helpful);
    } catch { /* keep the optimistic count */ }
  };

  const share = async () => {
    const url = `${location.origin}${location.pathname}#review-${reviewId}`;
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return; } catch { /* cancelled: fall back to copy */ }
    }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="zq-rv-actions">
      <button type="button" className={voted ? 'is-on' : ''} onClick={useful} aria-pressed={voted}>
        <i className={voted ? 'ri-thumb-up-fill' : 'ri-thumb-up-line'}></i> Useful <span>({count})</span>
      </button>
      <button type="button" onClick={share}>
        <i className={copied ? 'ri-check-line' : 'ri-share-forward-line'}></i> {copied ? 'Link copied' : 'Share'}
      </button>
    </div>
  );
}
