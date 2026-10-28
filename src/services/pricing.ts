import type { CompanySettingDoc } from '@/models/content';
import type { CartLine } from '@/models/Session';

export const cartSubtotal = (cart: Record<string, CartLine> | undefined) =>
  Object.values(cart ?? {}).reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);

export const cartCount = (cart: Record<string, CartLine> | undefined) =>
  Object.values(cart ?? {}).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

// Delivery zones used when shipping_mode is not "flat"
export const CITY_ZONES: Record<string, string[]> = {
  karachi: ['Karachi'],
  lahore: ['Lahore'],
  islamabad: ['Islamabad', 'Rawalpindi'],
  other_major: [
    'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan',
    'Sukkur', 'Larkana', 'Rahim Yar Khan', 'Sheikhupura', 'Jhang',
    'Dera Ghazi Khan', 'Gujrat', 'Kasur', 'Okara', 'Sahiwal',
    'Chiniot', 'Khanewal', 'Mianwali', 'Attock', 'Nowshera', 'Charsadda', 'Swat',
  ],
  remote: ['Muzaffarabad', 'Mirpur', 'Gilgit'],
};

/** Shipping for a city before the free-shipping rule. Flat mode uses one rate for everywhere. */
export function shippingForCity(setting: CompanySettingDoc | null, city: string): number {
  const rates = (setting?.shipping_charges ?? {}) as Record<string, number>;
  if ((setting?.shipping_mode ?? 'flat') === 'flat') return Number(rates.rest_of_pakistan ?? 0);
  let zone = 'rest_of_pakistan';
  for (const [key, cities] of Object.entries(CITY_ZONES)) {
    if (cities.includes(city)) { zone = key; break; }
  }
  return Number(rates[zone] ?? rates.rest_of_pakistan ?? 0);
}

/** Free shipping applies after coupons, when switched on and the threshold is met */
export function applyFreeShipping(setting: CompanySettingDoc | null, afterCoupon: number, shipping: number): number {
  const enabled = Boolean(setting?.free_shipping_enabled);
  const threshold = Number(setting?.free_shipping_threshold ?? 0);
  return enabled && threshold > 0 && afterCoupon >= threshold ? 0 : shipping;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
