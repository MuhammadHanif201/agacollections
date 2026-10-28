'use client';

import { useEffect } from 'react';
import { getSwal } from './client-utils';

/**
 * checkout.blade.php script: Pakistani phone input (+92), shipping by city with the
 * free-shipping rule, the submit spinner, and Meta Pixel InitiateCheckout / AddPaymentInfo.
 */
export default function CheckoutInteractions(p: {
  shippingMode: string;
  rates: Record<string, number>;
  cityZones: Record<string, string[]>;
  freeShipEnabled: boolean;
  freeShipThreshold: number;
  subtotal: number;
  discount: number;
  customerPhone: string;
  pixel: { value: string; num_items: number; content_ids: string[] };
}) {
  useEffect(() => {
    const form = document.getElementById('checkoutForm') as HTMLFormElement | null;
    const phoneLocal = document.getElementById('co_phone_local') as HTMLInputElement | null;
    const phoneHidden = document.getElementById('co_phone_full') as HTMLInputElement | null;
    const city = document.getElementById('co_city') as HTMLInputElement | null;
    const shippingField = document.getElementById('shipping_amount') as HTMLInputElement | null;
    const shippingDisplay = document.getElementById('shipping_display');
    const totalDisplay = document.getElementById('total_display');
    if (!form || !phoneLocal || !phoneHidden) return;
    const toNum = (v: unknown) => parseFloat(String(v ?? 0)) || 0;

    // Digits only; drop a pasted +92/92 prefix; at most 11 so a leading 0 still fits
    const sanitizeDisplay = (raw: string) => {
      let digits = String(raw || '').replace(/\D/g, '');
      if (digits.length >= 12 && digits.indexOf('92') === 0) digits = digits.slice(2);
      if (digits.length > 11) digits = digits.slice(0, 11);
      return digits;
    };
    // Submitted phone: without the leading 0 it must be exactly 10 digits
    const buildPhone = () => {
      let digits = String(phoneLocal.value || '').replace(/\D/g, '');
      if (digits.charAt(0) === '0') digits = digits.slice(1);
      phoneHidden.value = digits.length === 10 ? '+92' + digits : '';
    };
    const onPhoneInput = () => { phoneLocal.value = sanitizeDisplay(phoneLocal.value); buildPhone(); };
    phoneLocal.addEventListener('input', onPhoneInput);
    phoneLocal.addEventListener('blur', buildPhone);
    buildPhone();

    // Signed-in customer: fill in the saved number
    if (p.customerPhone) {
      let digits = String(p.customerPhone).replace(/\D/g, '');
      if (digits.length >= 12 && digits.indexOf('92') === 0) digits = digits.slice(2);
      if (digits.charAt(0) === '0') digits = digits.slice(1);
      if (digits.length === 10) { phoneLocal.value = digits; buildPhone(); }
    }

    const zoneFor = (c: string) => {
      for (const [zone, cities] of Object.entries(p.cityZones)) if (cities.includes(c.trim())) return zone;
      return 'rest_of_pakistan';
    };
    const pkr = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const updateShipping = () => {
      let ship = p.shippingMode === 'flat'
        ? toNum(p.rates.rest_of_pakistan)
        : toNum(p.rates[zoneFor(city?.value || '')] ?? p.rates.rest_of_pakistan ?? 0);
      const afterCoupon = Math.max(0, p.subtotal - p.discount);
      if (p.freeShipEnabled && p.freeShipThreshold > 0 && afterCoupon >= p.freeShipThreshold) ship = 0;
      if (shippingField) shippingField.value = String(ship);
      if (shippingDisplay) shippingDisplay.textContent = ship > 0 ? `PKR ${pkr(ship)}` : 'Free';
      if (totalDisplay) totalDisplay.textContent = `PKR ${pkr(toNum(p.subtotal - p.discount + ship))}`;
    };
    city?.addEventListener('input', updateShipping);
    city?.addEventListener('change', updateShipping);
    updateShipping();

    // Meta Pixel
    const ckData = { value: Number(p.pixel.value), currency: 'PKR', num_items: p.pixel.num_items, content_ids: p.pixel.content_ids, content_type: 'product' };
    if (window.fbq) window.fbq('track', 'InitiateCheckout', ckData);
    let apiSent = false;
    const addPaymentInfo = () => {
      if (apiSent || !window.fbq) return;
      apiSent = true;
      window.fbq('track', 'AddPaymentInfo', { value: ckData.value, currency: 'PKR' });
    };
    const radios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="payment_method"]'));
    radios.forEach((r) => r.addEventListener('change', addPaymentInfo));

    const onSubmit = (e: SubmitEvent) => {
      buildPhone();
      if (!phoneHidden.value) {
        e.preventDefault();
        void getSwal().then((Swal) => Swal.fire({ icon: 'warning', title: 'Invalid phone number', text: 'Please enter a valid 10-digit Pakistani mobile number (e.g. 03001234567).' }));
        phoneLocal.focus();
        return;
      }
      addPaymentInfo();
      const btn = document.getElementById('placeOrderBtn') as HTMLButtonElement | null;
      const spinner = document.getElementById('placeOrderSpinner');
      const icon = document.getElementById('placeOrderIcon');
      const text = document.getElementById('placeOrderText');
      // Disable after the browser has captured the submission
      setTimeout(() => { if (btn) btn.disabled = true; }, 0);
      if (spinner) spinner.style.display = 'inline-block';
      if (icon) icon.style.display = 'none';
      if (text) text.textContent = 'Placing Order…';
    };
    form.addEventListener('submit', onSubmit);

    return () => {
      phoneLocal.removeEventListener('input', onPhoneInput);
      phoneLocal.removeEventListener('blur', buildPhone);
      city?.removeEventListener('input', updateShipping);
      city?.removeEventListener('change', updateShipping);
      radios.forEach((r) => r.removeEventListener('change', addPaymentInfo));
      form.removeEventListener('submit', onSubmit);
    };
  }, [p.shippingMode, p.rates, p.cityZones, p.freeShipEnabled, p.freeShipThreshold, p.subtotal, p.discount, p.customerPhone, p.pixel]);

  return null;
}
