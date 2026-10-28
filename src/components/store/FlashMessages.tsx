'use client';

import { useEffect } from 'react';
import { clearFlash, readFlash } from './flash-cookie';
import { getSwal } from './client-utils';

/** The footer's session('success') / session('error') / $errors SweetAlerts */
export default function FlashMessages({ suppressErrors = false }: { suppressErrors?: boolean }) {
  useEffect(() => {
    const f = readFlash();
    if (!f) return;
    clearFlash();
    // Newsletter messages are shown inside the footer form (rendered on the server)
    if (f.type === 'newsletter_success' || f.type === 'newsletter_error') return;
    getSwal().then((Swal) => {
      if (f.type === 'success') {
        Swal.fire({ title: 'Success!', text: f.text, icon: 'success', confirmButtonText: 'OK', timer: 3000, timerProgressBar: true, toast: true, position: 'top-end', showConfirmButton: false });
      } else if (f.type === 'error') {
        Swal.fire({ title: 'Error!', text: f.text, icon: 'error', confirmButtonText: 'OK', timer: 5000, timerProgressBar: true, showConfirmButton: true });
      } else if (f.type === 'errors' && !suppressErrors) {
        const ul = document.createElement('ul');
        ul.className = 'text-left';
        for (const msg of f.list ?? [f.text]) {
          const li = document.createElement('li');
          li.textContent = msg;
          ul.appendChild(li);
        }
        Swal.fire({ title: 'Validation Error', html: ul, icon: 'error', confirmButtonText: 'OK', width: '600px' });
      }
    });
  }, [suppressErrors]);
  return null;
}

/** Same alerts, for results returned straight to a form (no page change) */
export async function showResultAlert(kind: 'success' | 'error' | 'errors', text: string, list?: string[]) {
  const Swal = await getSwal();
  if (kind === 'success') {
    return Swal.fire({ title: 'Success!', text, icon: 'success', confirmButtonText: 'OK', timer: 3000, timerProgressBar: true, toast: true, position: 'top-end', showConfirmButton: false });
  }
  if (kind === 'error') {
    return Swal.fire({ title: 'Error!', text, icon: 'error', confirmButtonText: 'OK', timer: 5000, timerProgressBar: true, showConfirmButton: true });
  }
  const ul = document.createElement('ul');
  ul.className = 'text-left';
  for (const msg of list ?? [text]) {
    const li = document.createElement('li');
    li.textContent = msg;
    ul.appendChild(li);
  }
  return Swal.fire({ title: 'Validation Error', html: ul, icon: 'error', confirmButtonText: 'OK', width: '600px' });
}
