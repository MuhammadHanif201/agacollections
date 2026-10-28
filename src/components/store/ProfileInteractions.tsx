'use client';

import { useEffect } from 'react';

/** edit-profile.blade.php script: digits-only phone and the "Saving…" button */
export default function ProfileInteractions() {
  useEffect(() => {
    const phone = document.getElementById('phoneInput') as HTMLInputElement | null;
    const form = document.getElementById('profileForm');
    const onInput = () => {
      if (!phone) return;
      const pos = phone.selectionStart ?? 0;
      const cleaned = phone.value.replace(/\D/g, '');
      if (phone.value !== cleaned) {
        phone.value = cleaned;
        phone.setSelectionRange(pos - 1, pos - 1);
      }
    };
    const onSubmit = () => {
      const btn = document.getElementById('saveBtn') as HTMLButtonElement | null;
      if (!btn) return;
      setTimeout(() => { btn.disabled = true; }, 0);
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
    };
    phone?.addEventListener('input', onInput);
    form?.addEventListener('submit', onSubmit);
    return () => {
      phone?.removeEventListener('input', onInput);
      form?.removeEventListener('submit', onSubmit);
    };
  }, []);
  return null;
}
