'use client';

export default function BackToTop() {
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="dc-back-top" title="Back to top" aria-label="Back to top">
      <i className="ri-arrow-up-line"></i>
    </button>
  );
}
