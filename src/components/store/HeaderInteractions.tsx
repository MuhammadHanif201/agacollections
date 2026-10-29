'use client';

import { useEffect } from 'react';
import { useNavKey } from './useNavKey';

/**
 * The header's inline script: side drawer open/close (button, overlay, Esc), the sticky
 * header shadow and the announcement marquee speed. It works on the server-rendered
 * markup by id, exactly as before. The header stays mounted while the visitor moves
 * between pages, so it binds again after every navigation to pick up the new page's
 * .sticky-header and [data-dc-reveal] elements.
 */
export default function HeaderInteractions() {
  const navKey = useNavKey();
  useEffect(() => {
    const btn = document.getElementById('dcMenuBtn');
    const drawer = document.getElementById('dcSideDrawer');
    const overlay = document.getElementById('dcDrawerOverlay');
    const closeBtn = document.getElementById('dcDrawerClose');
    if (!drawer || !overlay) return;

    // Arriving on another page leaves the menu closed, as the full page load used to
    if (drawer.classList.contains('is-open')) {
      drawer.classList.remove('is-open'); overlay.classList.remove('is-open'); document.body.style.overflow = '';
      drawer.setAttribute('aria-hidden', 'true'); btn?.setAttribute('aria-expanded', 'false');
    }

    const openDrawer = () => {
      drawer.classList.add('is-open'); overlay.classList.add('is-open'); document.body.style.overflow = 'hidden';
      drawer.setAttribute('aria-hidden', 'false'); btn?.setAttribute('aria-expanded', 'true');
      setTimeout(() => closeBtn?.focus({ preventScroll: true }), 60);
    };
    const closeDrawer = () => {
      drawer.classList.remove('is-open'); overlay.classList.remove('is-open'); document.body.style.overflow = '';
      drawer.setAttribute('aria-hidden', 'true');
      if (btn) { btn.setAttribute('aria-expanded', 'false'); btn.focus({ preventScroll: true }); }
    };
    // Opening search from the menu closes the menu first
    const searchBtns = Array.from(drawer.querySelectorAll('.trigger-search'));
    searchBtns.forEach((el) => el.addEventListener('click', closeDrawer));
    // A link in the menu to the page already open does not change the route
    const onDrawerLink = (e: Event) => { if ((e.target as Element).closest('a[href]')) closeDrawer(); };
    drawer.addEventListener('click', onDrawerLink);
    btn?.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer(); };
    document.addEventListener('keydown', onKey);

    // Sticky shadow on non-overlay pages
    const header = document.getElementById('dcHeader');
    const isOverlay = header?.classList.contains('dc-overlay');
    const onScroll = () => { header?.classList.toggle('is-sticky', !isOverlay && window.scrollY > 10); };
    if (header) { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); }

    // .sticky-header shadow (footer script)
    const sticky = Array.from(document.querySelectorAll('.sticky-header'));
    const onStickyScroll = () => sticky.forEach((el) => el.classList.toggle('is-sticky', window.scrollY > 10));
    if (sticky.length) window.addEventListener('scroll', onStickyScroll, { passive: true });

    // Announcement marquee: duration from content width (~70px/s, never faster than 20s)
    const annTrack = document.querySelector<HTMLElement>('#rotating-headlines .dc-ann-track');
    let ro: ResizeObserver | null = null;
    if (annTrack) {
      const tune = () => {
        const onePass = annTrack.scrollWidth / 2;
        annTrack.style.animationDuration = Math.max(20, onePass / 70).toFixed(1) + 's';
      };
      tune();
      if (window.ResizeObserver) { ro = new ResizeObserver(tune); ro.observe(annTrack); }
    }

    // Sections the CSS fallback already showed (slow start) stay shown; the observer takes over from here
    if (!document.documentElement.classList.contains('dc-hydrated')) {
      document.querySelectorAll<HTMLElement>('[data-dc-reveal]').forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) > 0.01) el.classList.add('is-visible');
      });
      document.documentElement.classList.add('dc-hydrated');
    }

    // Scroll-reveal for [data-dc-reveal]
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          const delay = el.dataset.dcDelay ? parseFloat(el.dataset.dcDelay) * 1000 : 0;
          setTimeout(() => el.classList.add('is-visible'), delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-dc-reveal]').forEach((el) => io.observe(el));

    return () => {
      searchBtns.forEach((el) => el.removeEventListener('click', closeDrawer));
      drawer.removeEventListener('click', onDrawerLink);
      btn?.removeEventListener('click', openDrawer);
      closeBtn?.removeEventListener('click', closeDrawer);
      overlay.removeEventListener('click', closeDrawer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onStickyScroll);
      ro?.disconnect();
      io.disconnect();
    };
  }, [navKey]);

  return null;
}
