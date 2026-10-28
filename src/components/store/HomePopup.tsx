'use client';

import { useEffect, useState } from 'react';
import StoreLink from './StoreLink';

/** The admin-configured homepage popup (index.blade.php) */
export default function HomePopup(p: {
  position: string;
  image: string | null;
  title: string | null;
  content: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  dismissible: boolean;
  showOncePerUser: boolean;
  delaySeconds: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = 'popup_seen';
    try { if (p.showOncePerUser && sessionStorage.getItem(key)) return; } catch { /* storage blocked */ }
    const t = setTimeout(() => {
      setOpen(true);
      try { if (p.showOncePerUser) sessionStorage.setItem(key, 'true'); } catch { /* storage blocked */ }
    }, (p.delaySeconds ?? 0) * 1000);
    return () => clearTimeout(t);
  }, [p.showOncePerUser, p.delaySeconds]);

  return (
    <div id="popupOverlay" className="popup-overlay" style={{ display: open ? 'flex' : 'none' }}>
      <div className={`popup-content ${p.position}`}>
        {p.image && <img src={p.image} alt="Popup" className="img-fluid mb-3" loading="lazy" />}
        {p.title && <h5 className="fw-bold mb-2">{p.title}</h5>}
        {p.content && <p className="mb-3">{p.content}</p>}
        {p.buttonText && p.buttonLink && (
          <StoreLink href={p.buttonLink} className="btn btn-primary mb-2" target="_blank" rel="noopener noreferrer">
            {p.buttonText}
          </StoreLink>
        )}
        {p.dismissible && (
          <button className="btn btn-sm btn-outline-secondary mt-2" id="closePopup" onClick={() => setOpen(false)}>Dismiss</button>
        )}
      </div>
    </div>
  );
}
