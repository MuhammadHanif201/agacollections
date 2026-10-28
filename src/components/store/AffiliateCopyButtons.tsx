'use client';

import { useEffect } from 'react';

/** dashboard.blade.php script: Copy buttons and the withdrawal confirm() */
export default function AffiliateCopyButtons() {
  useEffect(() => {
    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.aff-copy-btn'));
    const onCopy = (e: Event) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const input = document.querySelector<HTMLInputElement>(btn.getAttribute('data-copy') ?? '');
      if (!input) return;
      input.select();
      input.setSelectionRange(0, 99999);
      const done = () => {
        btn.classList.add('is-copied');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.classList.remove('is-copied'); btn.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(input.value).then(done, done);
      else { try { document.execCommand('copy'); } catch { /* ignore */ } done(); }
    };
    btns.forEach((b) => b.addEventListener('click', onCopy));

    const form = document.querySelector<HTMLFormElement>('form[data-confirm]');
    const onSubmit = (e: SubmitEvent) => { if (!window.confirm(form?.dataset.confirm ?? '')) e.preventDefault(); };
    form?.addEventListener('submit', onSubmit);

    return () => {
      btns.forEach((b) => b.removeEventListener('click', onCopy));
      form?.removeEventListener('submit', onSubmit);
    };
  }, []);
  return null;
}
