'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getSwal, postJson, useStore } from './StoreProvider';
import { showLimit } from './client-utils';
import { clearFlash, readFlash } from './flash-cookie';

/**
 * cart.blade.php script: quantity stepper and Remove. The cart is re-rendered in place
 * (router.refresh) so totals, coupon and free-shipping bar update without a page reload.
 */
export default function CartPageInteractions() {
  const { refreshCartCount } = useStore();
  const router = useRouter();
  const [updating, startTransition] = useTransition();

  // Dim the cart and block clicks while it updates (instead of the full-screen overlay)
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.cart-page');
    if (!page) return;
    page.style.transition = 'opacity 150ms';
    page.style.opacity = updating ? '.55' : '';
    page.style.pointerEvents = updating ? 'none' : '';
  }, [updating]);

  useEffect(() => {
    const quantityInput = (key: string) => document.querySelector<HTMLInputElement>(`.quantity-input[data-key="${CSS.escape(key)}"]`);

    // A coupon that stopped applying is reported in the flash cookie, as on a page load
    const showFlash = async () => {
      const f = readFlash();
      if (!f || f.type !== 'error') return;
      clearFlash();
      const Swal = await getSwal();
      void Swal.fire({ title: 'Error!', text: f.text, icon: 'error', confirmButtonText: 'OK', timer: 5000, timerProgressBar: true });
    };

    const updateCartQuantity = (key: string, quantity: number) => {
      const input = quantityInput(key);
      if (!(quantity >= 1)) {
        if (input) input.value = input.defaultValue;
        void getSwal().then((Swal) => Swal.fire({ icon: 'warning', title: 'Minimum Quantity', text: 'You must add at least 1 item.' }));
        return;
      }
      startTransition(async () => {
        try {
          const { data } = await postJson<{ status?: string; message?: string; limit?: boolean }>('/cart/update', { key, quantity });
          if (data.status === 'success') {
            void refreshCartCount();
            void showFlash();
            router.refresh();
            return;
          }
          // Nothing changed in the bag: put the number back
          if (input) input.value = input.defaultValue;
          if (data.limit) void showLimit(data.message);
          else void getSwal().then((Swal) => Swal.fire({ icon: 'error', title: 'Oops…', text: data.message || 'Update failed.' }));
        } catch {
          if (input) input.value = input.defaultValue;
          void getSwal().then((Swal) => Swal.fire({ icon: 'error', title: 'Oops…', text: 'Update failed.' }));
        }
      });
    };

    const removeCartItem = (key: string) => {
      startTransition(async () => {
        try {
          const { data } = await postJson<{ status?: string }>('/cart/remove', { key });
          if (data.status !== 'removed') return;
          const row = document.getElementById(`cart-item-${key}`);
          if (row) { row.style.transition = 'opacity 300ms'; row.style.opacity = '0'; }
          void refreshCartCount();
          void showFlash();
          router.refresh();
        } catch { /* ignore */ }
      });
    };

    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.classList?.contains('quantity-input')) updateCartQuantity(t.dataset.key ?? '', parseInt(t.value, 10));
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
        updateCartQuantity(key, n);
      } else if (dec) {
        const key = dec.dataset.key ?? '';
        const input = quantityInput(key);
        if (!input) return;
        const cur = parseInt(input.value, 10);
        if (cur > 1) { input.value = String(cur - 1); updateCartQuantity(key, cur - 1); }
      } else if (rem) {
        removeCartItem(rem.dataset.removeKey ?? '');
      }
    };
    document.addEventListener('change', onChange);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('change', onChange);
      document.removeEventListener('click', onClick);
    };
  }, [refreshCartCount, router]);

  return null;
}
