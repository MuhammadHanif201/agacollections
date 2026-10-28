'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'dc_cookie_consent';

/** components/cookie-consent.blade.php — shown until accepted or declined (localStorage) */
export default function CookieConsent() {
  const [shown, setShown] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
    if (stored) return;
    // Small delay so the banner doesn't flash before page paint
    const t = setTimeout(() => setShown(true), 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = (choice: string) => {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch { /* storage blocked */ }
    setFading(true);
    setTimeout(() => setShown(false), 400);
  };

  return (
    <div
      id="dcCookieBanner"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        display: shown ? 'block' : 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
        background: '#1c1c1c', color: '#f5f0eb', padding: '1rem 1.5rem', boxShadow: '0 -4px 24px rgba(0,0,0,0.25)',
        ...(fading ? { transition: 'opacity 0.4s', opacity: 0 } : {}),
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6, flex: 1, minWidth: 220, color: 'rgba(255,255,255,0.78)' }}>
          We use cookies to improve your experience, analyse site traffic, and personalise content.
          By clicking <strong>Accept</strong> you consent to our use of cookies in accordance with
          our <a href="/policy/privacy" style={{ color: '#c42b3c', textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
          <button
            id="dcCookieDecline"
            onClick={() => dismiss('declined')}
            style={{ background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)', padding: '7px 20px', borderRadius: 999, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Decline
          </button>
          <button
            id="dcCookieAccept"
            onClick={() => dismiss('accepted')}
            style={{ background: '#c42b3c', border: '1.5px solid #c42b3c', color: '#fff', padding: '7px 20px', borderRadius: 999, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
