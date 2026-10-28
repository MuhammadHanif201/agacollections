'use client';

import { useEffect } from 'react';

/** login.blade.php script: sign in ↔ register toggle, +92 phone binding, button lock on submit */
export default function AuthInteractions() {
  useEffect(() => {
    const loginPanel = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    const toggles = Array.from(document.querySelectorAll('.toggle-auth'));
    const onToggle = () => {
      if (!loginPanel || !registerPanel) return;
      const showLogin = loginPanel.classList.contains('is-hidden');
      loginPanel.classList.toggle('is-hidden', !showLogin);
      registerPanel.classList.toggle('is-hidden', showLogin);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    toggles.forEach((b) => b.addEventListener('click', onToggle));

    const local = document.getElementById('reg_local') as HTMLInputElement | null;
    const hidden = document.getElementById('reg_phone_full') as HTMLInputElement | null;
    const onPhone = () => {
      if (!local || !hidden) return;
      local.value = local.value.replace(/\D/g, '').slice(0, 10);
      hidden.value = local.value ? '+92' + local.value : '';
      local.classList.toggle('is-error', local.value.length > 0 && (local.value.length !== 10 || local.value[0] !== '3'));
    };
    if (local && hidden) {
      // Pre-fill from old() value
      if (hidden.value && hidden.value.startsWith('+92')) local.value = hidden.value.replace('+92', '');
      local.addEventListener('input', onPhone);
    }

    const lockBtn = (btn: HTMLElement | null) => {
      if (!btn) return;
      setTimeout(() => { (btn as HTMLButtonElement).disabled = true; }, 0);
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Please wait…';
    };
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const onLogin = () => lockBtn(document.getElementById('loginSubmitBtn'));
    const onRegister = (e: Event) => {
      if (!local) return;
      const val = local.value.replace(/\D/g, '');
      if (val.length !== 10 || val[0] !== '3') {
        e.preventDefault();
        local.classList.add('is-error');
        local.focus();
        return;
      }
      if (hidden) hidden.value = '+92' + val;
      lockBtn(document.getElementById('regSubmitBtn'));
    };
    loginForm?.addEventListener('submit', onLogin);
    registerForm?.addEventListener('submit', onRegister);

    return () => {
      toggles.forEach((b) => b.removeEventListener('click', onToggle));
      local?.removeEventListener('input', onPhone);
      loginForm?.removeEventListener('submit', onLogin);
      registerForm?.removeEventListener('submit', onRegister);
    };
  }, []);
  return null;
}
