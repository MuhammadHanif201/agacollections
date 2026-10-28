'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CardProduct } from '@/types/catalog';
import ProductCard from './ProductCard';
import { useStore } from './StoreProvider';
import StoreLink from './StoreLink';
import { useNavKey } from './useNavKey';

type View = 'default' | 'loading' | 'results' | 'empty';

/** Premium search overlay with live results (header.blade.php) */
export default function SearchOverlay({
  categories,
  showCategories,
  children,
}: {
  categories: { title: string; slug: string }[];
  showCategories: boolean;
  children: ReactNode; // the "New Arrivals" cards, rendered on the server
}) {
  const { searchOpen, openSearch, closeSearch } = useStore();
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>('default');
  const [results, setResults] = useState<CardProduct[]>([]);
  const [shownQuery, setShownQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  // Following a suggestion or a result opens another page without a reload: close the overlay
  const navKey = useNavKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- closeSearch only sets state; run on navigation, not when its identity changes
  useEffect(() => { closeSearch(); }, [navKey]);

  // Every .trigger-search button on the page opens the overlay
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.trigger-search')) openSearch();
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    document.addEventListener('click', onClick);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [openSearch, closeSearch]);

  useEffect(() => {
    document.body.style.overflow = searchOpen ? 'hidden' : '';
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 360);
    return () => clearTimeout(t);
  }, [searchOpen]);

  const onInput = (value: string) => {
    setQ(value);
    const query = value.trim();
    if (timer.current) clearTimeout(timer.current);
    if (query.length === 0) { setView('default'); return; }
    timer.current = setTimeout(async () => {
      const mySeq = ++seq.current;
      setView('loading');
      try {
        const res = await fetch('/shop/ajax-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ search: query }),
        });
        const data = (await res.json()) as { products: CardProduct[] };
        if (mySeq !== seq.current) return;
        if (!data.products.length) { setShownQuery(query); setView('empty'); return; }
        setResults(data.products);
        setShownQuery(query);
        setView('results');
      } catch {
        if (mySeq === seq.current) setView('default');
      }
    }, 320);
  };

  const total = results.length;

  return (
    <div id="dcSearchOverlay" role="dialog" aria-modal="true" aria-label="Search products" className={searchOpen ? 'is-open' : undefined}>
      <div className="dc-so-backdrop" id="dcSearchBackdrop" onClick={closeSearch}></div>

      <div className="dc-so-panel">
        <div className="dc-so-topbar">
          <span className="dc-so-topbar-brand">AGA Collections &mdash; Search</span>
          <button className="dc-so-close" id="dcSearchClose" aria-label="Close search" onClick={closeSearch}>
            <i className="ri-close-line"></i>
            <span>Close</span>
            <span className="dc-esc-key">ESC</span>
          </button>
        </div>

        <div className="dc-so-input-zone">
          <form id="dcSearchForm" method="GET" action="/shop">
            <div className="dc-so-input-row" id="dcSearchInputRow">
              <i className="ri-search-line dc-so-input-icon" aria-hidden="true"></i>
              <label htmlFor="dcSearchInput" className="visually-hidden">Search products by name</label>
              <input
                ref={inputRef}
                type="text"
                name="search"
                id="dcSearchInput"
                placeholder="Search by product name..."
                autoComplete="off"
                spellCheck={false}
                value={q}
                onChange={(e) => onInput(e.target.value)}
              />
              <button
                type="button"
                className={`dc-so-clear-btn${q.trim().length > 0 ? ' is-visible' : ''}`}
                id="dcSearchClear"
                aria-label="Clear search"
                onClick={() => { setQ(''); setView('default'); inputRef.current?.focus(); }}
              >
                <i className="ri-close-circle-line"></i>
              </button>
              <button type="submit" className="dc-so-submit-btn" aria-label="Search">
                <span>Search</span>
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </form>
        </div>

        <div className="dc-so-body">
          <div className="dc-so-body-inner">
            <div id="dcSearchDefault" style={view === 'default' ? undefined : { display: 'none' }}>
              {showCategories && (
                <>
                  <p className="dc-so-label">Browse Categories</p>
                  <div className="dc-so-tags">
                    <StoreLink href="/shop" className="dc-so-tag">
                      <i className="ri-store-line"></i> Shop All
                    </StoreLink>
                    {categories.map((cat) => (
                      <StoreLink href={`/shop/${cat.slug}`} className="dc-so-tag" key={cat.slug}>
                        <i className="ri-price-tag-3-line"></i> {cat.title}
                      </StoreLink>
                    ))}
                  </div>
                </>
              )}

              <p className="dc-so-label">New Arrivals</p>
              <div className="dc-so-grid">{children}</div>
            </div>

            <div id="dcSearchResults" style={view === 'results' ? undefined : { display: 'none' }}>
              <p className="dc-so-status" id="dcSearchStatus">
                {view === 'results' && (
                  <><strong>{total}</strong> result{total !== 1 ? 's' : ''} for &ldquo;<span className="dc-cnt">{shownQuery}</span>&rdquo;</>
                )}
              </p>
              <div className="dc-so-grid" id="dcSearchGrid">
                {view === 'results' && results.map((p) => <div key={p.id}><ProductCard product={p} /></div>)}
              </div>
              <div className="text-center">
                <StoreLink
                  href={`/shop?search=${encodeURIComponent(shownQuery)}`}
                  id="dcSearchSeeAll"
                  className="dc-so-see-all"
                  style={{ display: total > 8 ? 'inline-flex' : 'none' }}
                >
                  See All Results <i className="ri-arrow-right-line"></i>
                </StoreLink>
              </div>
            </div>

            <div id="dcSearchLoading" style={view === 'loading' ? undefined : { display: 'none' }}>
              <div className="dc-so-loader"><div className="dc-so-spinner"></div></div>
            </div>

            <div id="dcSearchEmpty" style={view === 'empty' ? undefined : { display: 'none' }}>
              <div className="dc-so-empty">
                <i className="ri-search-2-line"></i>
                <p>No products found for &ldquo;<span id="dcSearchEmptyTerm">{shownQuery}</span>&rdquo;</p>
                <small>Try different keywords or browse the categories above</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
