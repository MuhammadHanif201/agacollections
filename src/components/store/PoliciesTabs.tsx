'use client';

import { useEffect } from 'react';

/** policies.blade.php script: tabs, sidebar links and #key deep links */
export default function PoliciesTabs() {
  useEffect(() => {
    const tabBtns = Array.from(document.querySelectorAll<HTMLElement>('.policies-tab-btn'));
    const panels = Array.from(document.querySelectorAll<HTMLElement>('.policy-panel'));
    const sideLinks = Array.from(document.querySelectorAll<HTMLElement>('.sidebar-link'));
    const wrapTop = () => (document.querySelector<HTMLElement>('.policies-wrap')?.offsetTop ?? 0) - 20;

    const activate = (key: string) => {
      tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.key === key));
      panels.forEach((p) => p.classList.toggle('active', p.id === 'panel-' + key));
      sideLinks.forEach((l) => l.classList.toggle('active', l.dataset.key === key));
      history.replaceState(null, '', '#' + key);
    };
    const onTab = (e: Event) => activate((e.currentTarget as HTMLElement).dataset.key ?? '');
    const onSide = (e: Event) => {
      e.preventDefault();
      activate((e.currentTarget as HTMLElement).dataset.key ?? '');
      window.scrollTo({ top: wrapTop(), behavior: 'smooth' });
    };
    tabBtns.forEach((b) => b.addEventListener('click', onTab));
    sideLinks.forEach((l) => l.addEventListener('click', onSide));

    const fromHash = () => {
      const hash = decodeURIComponent(location.hash.slice(1));
      if (hash && document.getElementById('panel-' + hash)) {
        activate(hash);
        window.scrollTo({ top: wrapTop(), behavior: 'smooth' });
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => {
      tabBtns.forEach((b) => b.removeEventListener('click', onTab));
      sideLinks.forEach((l) => l.removeEventListener('click', onSide));
      window.removeEventListener('hashchange', fromHash);
    };
  }, []);
  return null;
}
