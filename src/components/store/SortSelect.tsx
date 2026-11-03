'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The sort <select>: on change it opens its form's URL (sort + kept filters) with client-side
 * navigation, so the products change without a full page load. The form still works
 * without JavaScript.
 */
export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const [loading, startTransition] = useTransition();

  // Dim the products and show a spinner while the sorted list loads (rounded.css .zq-loading)
  useEffect(() => {
    document.getElementById('dcProductGrid')?.classList.toggle('zq-loading', loading);
  }, [loading]);

  return (
    <select
      className="dc-sort-select"
      name="sort"
      id="dcSortSelect"
      defaultValue={value}
      onChange={(e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        const params = new URLSearchParams();
        new FormData(form).forEach((v, k) => { if (typeof v === 'string' && !(k === 'sort' && v === '')) params.append(k, v); });
        const qs = params.toString();
        startTransition(() => router.push(form.getAttribute('action') + (qs ? '?' + qs : ''), { scroll: false }));
      }}
      aria-label="Sort products"
    >
      <option value="">Default</option>
      <option value="latest">Latest</option>
      <option value="price_low_high">Price: Low → High</option>
      <option value="price_high_low">Price: High → Low</option>
      <option value="rating">Top Rated</option>
    </select>
  );
}
