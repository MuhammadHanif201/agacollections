'use client';

import { useEffect } from 'react';

/** Purchase fires once per order (eventID de-duplication plus a localStorage guard) */
export default function PurchasePixel({ orderId, value }: { orderId: number; value: string }) {
  useEffect(() => {
    try {
      const oid = `order_${orderId}`;
      if (!localStorage.getItem('dc_purchase_' + oid)) {
        if (window.fbq) window.fbq('track', 'Purchase', { value: Number(value), currency: 'PKR', content_type: 'product' }, { eventID: oid });
        try { localStorage.setItem('dc_purchase_' + oid, '1'); } catch { /* storage blocked */ }
      }
    } catch { /* ignore */ }
  }, [orderId, value]);
  return null;
}
