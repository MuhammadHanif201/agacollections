/** "58% OFF" beside a product's price when it is on sale (sale_price is the old price). Styles: .zq-off */
export default function OffBadge({ now, was }: { now: number | null | undefined; was: number | null | undefined }) {
  const n = Number(now) || 0;
  const w = Number(was) || 0;
  const pct = w > n && n > 0 ? Math.round(100 - (n / w) * 100) : 0;
  return pct >= 1 ? <span className="zq-off">{pct}% OFF</span> : null;
}
