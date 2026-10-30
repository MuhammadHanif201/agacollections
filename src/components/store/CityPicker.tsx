'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';

// The browser's own <datalist> popup cannot be sized or styled (on phones it covered the
// whole screen), so the city suggestions are drawn here. The input keeps its id and name:
// the checkout script listens to its input/change events to update the delivery charge.

const LIST: CSSProperties = {
  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1050,
  margin: 0, padding: '4px 0', listStyle: 'none',
  background: '#fff', border: '1px solid #e6e1da', borderRadius: 8,
  boxShadow: '0 10px 30px rgba(22,20,38,.12)',
  maxHeight: 'min(600px, 60vh)', overflowY: 'auto', overscrollBehavior: 'contain',
};
const ITEM: CSSProperties = { padding: '11px 14px', cursor: 'pointer', fontSize: '.9rem', color: '#1a1a1a' };

export default function CityPicker({ cities, defaultValue, ...input }: {
  cities: string[];
  defaultValue?: string;
  id: string;
  name: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const picking = useRef(false);
  const [query, setQuery] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = `${input.id}-list`;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    const starts = cities.filter((c) => c.toLowerCase().startsWith(q));
    return [...starts, ...cities.filter((c) => !starts.includes(c) && c.toLowerCase().includes(q))];
  }, [cities, query]);

  const pick = (city: string) => {
    const el = ref.current;
    if (!el) return;
    el.value = city;
    setQuery(city);
    setOpen(false);
    // Let the checkout script recalculate delivery, as when the visitor types (without
    // our own onInput reopening the list)
    picking.current = true;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    picking.current = false;
  };

  const show = open && matches.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={ref}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        defaultValue={defaultValue}
        {...input}
        onFocus={() => setOpen(true)}
        onInput={(e) => { if (picking.current) return; setQuery(e.currentTarget.value); setActive(0); setOpen(true); }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, matches.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter' && show) { e.preventDefault(); pick(matches[active]); }
          else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {show && (
        <ul id={listId} role="listbox" style={LIST}>
          {matches.map((city, i) => (
            <li
              key={city}
              role="option"
              aria-selected={i === active}
              style={{ ...ITEM, background: i === active ? '#f5f0eb' : undefined }}
              // mousedown, not click: the input's blur would close the list before a click lands
              onMouseDown={(e) => { e.preventDefault(); pick(city); }}
              onMouseEnter={() => setActive(i)}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
