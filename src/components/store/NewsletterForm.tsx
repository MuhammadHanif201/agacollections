'use client';

import { useRef, useState } from 'react';
import { getSwal } from './client-utils';

/** components/newsletter-form.blade.php (AJAX subscribe with SweetAlert toasts) */
export default function NewsletterForm({
  btnClass = '',
  inputClass = '',
  notice = null,
}: {
  btnClass?: string;
  inputClass?: string;
  /** session('newsletter_success' / 'newsletter_error'), e.g. after an unsubscribe link */
  notice?: { ok: boolean; text: string } | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.querySelector<HTMLInputElement>('input[name="email"]')!;
    if (!email.checkValidity()) { email.reportValidity(); return; }
    setBusy(true);
    const Swal = await getSwal();
    const toast = (title: string, text: string, icon: 'success' | 'info' | 'error') =>
      Swal.fire({ title, text, icon, toast: true, timer: 3000, position: 'top-end', showConfirmButton: false });
    try {
      const res = await fetch('/newsletter/subscribe', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const result = (await res.json()) as { status?: string; message?: string };
      if (res.ok && result.status === 'success') {
        toast('Subscribed!', result.message || 'You are now subscribed to our newsletter.', 'success');
        form.reset();
      } else if (res.ok && result.status === 'info') {
        toast('Already Subscribed!', result.message || 'You are already subscribed. Thank you.', 'info');
        form.reset();
      } else {
        toast('Try Again', result.message || 'Something went wrong.', 'error');
      }
    } catch {
      toast('Error', 'Server unreachable. Please try again.', 'error');
    }
    setBusy(false);
  };

  return (
    <form className={`newsletter-form${busy ? ' is-submitting' : ''}`} action="/newsletter/subscribe" method="POST" noValidate onSubmit={onSubmit} ref={formRef} aria-busy={busy || undefined}>
      <input type="text" name="company_name" className="d-none" tabIndex={-1} autoComplete="off" />{/* honeypot */}

      <label htmlFor="newsletter-email" className="visually-hidden">Enter your email address</label>
      <input
        type="email"
        name="email"
        id="newsletter-email"
        required
        placeholder="Enter your email address"
        autoComplete="off"
        readOnly={busy}
        className={`d-block w-100 mb-3 p-2 border h-auto text-start ${inputClass}`}
      />

      <button type="submit" className={`text-uppercase bg-black text-white py-2 px-4 ${btnClass}`} data-loading-label="Subscribing…" disabled={busy}>
        {busy ? <><span className="btn-spinner" aria-hidden="true"></span>Subscribing…</> : 'Subscribe'}
      </button>

      {notice && <div className={`alert ${notice.ok ? 'alert-success' : 'alert-danger'} mt-2 mb-0`}>{notice.text}</div>}
    </form>
  );
}
