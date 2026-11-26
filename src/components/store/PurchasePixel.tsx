'use client';

import { useEffect } from 'react';

/** Purchase fires once per order (eventID de-duplication plus a localStorage guard). It names the products bought
 *  (product numbers, like the other events) so Meta can match purchases to products for retargeting and catalog ads. */
export default function PurchasePixel({ orderId, value, contentIds, numItems }: { orderId: number; value: string; contentIds: string[]; numItems: number }) {
  useEffect(() => {
    try {
      const oid = `order_${orderId}`;
      if (!localStorage.getItem('dc_purchase_' + oid)) {
        if (window.fbq) window.fbq('track', 'Purchase', { value: Number(value), currency: 'PKR', content_type: 'product', content_ids: contentIds, num_items: numItems }, { eventID: oid });
        try { localStorage.setItem('dc_purchase_' + oid, '1'); } catch { /* storage blocked */ }
      }
    } catch { /* ignore */ }
  }, [orderId, value, contentIds, numItems]);
  return null;
}
