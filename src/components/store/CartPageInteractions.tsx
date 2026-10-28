'use client';

import { useEffect } from 'react';
import { getSwal, postJson, useStore } from './StoreProvider';

/** cart.blade.php script: quantity stepper and Remove (the page reloads to recalculate totals) */
export default function CartPageInteractions() {
  const { refreshCartCount } = useStore();

  useEffect(() => {
    const overlay = document.getElementById('cart-loading-overlay');
    const showSpinner = () => { if (overlay) overlay.style.display = 'flex'; };
    const hideSpinner = () => { if (overlay) overlay.style.display = 'none'; };

    const updateCartQuantity = async (key: string, quantity: number) => {
      const Swal = await getSwal();
      if (!(quantity >= 1)) {
        Swal.fire({ icon: 'warning', title: 'Minimum Quantity', text: 'You must add at least 1 item.' });
        return;
      }
      showSpinner();
      try {
        const { data } = await postJson<{ status?: string; message?: string }>('/cart/update', { key, quantity });
        if (data.status === 'success') {
          location.reload();
        } else {
          Swal.fire({ icon: 'error', title: 'Oops…', text: data.message || 'Update failed.' });
          setTimeout(() => location.reload(), 2000);
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'Oops…', text: 'Update failed.' });
      } finally {
        hideSpinner();
      }
    };

    const removeCartItem = async (key: string) => {
      try {
        const { data } = await postJson<{ status?: string }>('/cart/remove', { key });
        if (data.status !== 'removed') return;
        void refreshCartCount();
        const row = document.getElementById(`cart-item-${key}`);
        if (row) {
          row.style.transition = 'opacity 300ms';
          row.style.opacity = '0';
        }
        // Reload so subtotal and total are recalculated (same as the + / − buttons)
        setTimeout(() => location.reload(), 300);
      } catch { /* ignore */ }
    };

    const quantityInput = (key: string) => document.querySelector<HTMLInputElement>(`.quantity-input[data-key="${CSS.escape(key)}"]`);

    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.classList?.contains('quantity-input')) void updateCartQuantity(t.dataset.key ?? '', parseInt(t.value, 10));
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const inc = t.closest<HTMLElement>('.btn-increase');
      const dec = t.closest<HTMLElement>('.btn-decrease');
      const rem = t.closest<HTMLElement>('[data-remove-key]');
      if (inc) {
        const key = inc.dataset.key ?? '';
        const input = quantityInput(key);
        if (!input) return;
        const n = parseInt(input.value, 10) + 1;
        input.value = String(n);
        void updateCartQuantity(key, n);
      } else if (dec) {
        const key = dec.dataset.key ?? '';
        const input = quantityInput(key);
        if (!input) return;
        const cur = parseInt(input.value, 10);
        if (cur > 1) { input.value = String(cur - 1); void updateCartQuantity(key, cur - 1); }
      } else if (rem) {
        void removeCartItem(rem.dataset.removeKey ?? '');
      }
    };
    document.addEventListener('change', onChange);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('change', onChange);
      document.removeEventListener('click', onClick);
    };
  }, [refreshCartCount]);

  return null;
}
