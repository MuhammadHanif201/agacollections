'use client';

import { useStore } from './StoreProvider';

export default function CartBadge({ id }: { id: string }) {
  const { cartCount } = useStore();
  return (
    <span id={id} className="dc-cart-badge" style={cartCount < 1 ? { display: 'none' } : undefined}>
      {cartCount}
    </span>
  );
}
