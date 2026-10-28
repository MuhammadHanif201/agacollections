'use client';

/** The sort <select> that submits its form on change */
export default function SortSelect({ value }: { value: string }) {
  return (
    <select
      className="dc-sort-select"
      name="sort"
      id="dcSortSelect"
      defaultValue={value}
      onChange={(e) => e.currentTarget.form?.submit()}
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
