// Laravel's pagination::bootstrap-4 view (markup kept as is, aria-disabled on <li> included)
/* eslint-disable jsx-a11y/role-supports-aria-props */
import { Fragment } from 'react';
import { paginationElements } from '@/services/shop';
import StoreLink from './StoreLink';

type Query = Record<string, string | string[] | undefined>;

/** Arr::query(array_merge($query, ['page' => n])) — keeps the other parameters in order */
export function pageUrl(path: string, query: Query, page: number): string {
  const params = new URLSearchParams();
  let placed = false;
  for (const [k, v] of Object.entries(query)) {
    if (k === 'page') { params.append('page', String(page)); placed = true; continue; }
    if (Array.isArray(v)) v.forEach((x) => params.append(k, x));
    else if (v !== undefined) params.append(k, v);
  }
  if (!placed) params.append('page', String(page));
  return `${path}?${params.toString().replace(/\+/g, '%20')}`;
}

export default function Pagination({ path, query, current, last }: { path: string; query: Query; current: number; last: number }) {
  if (last <= 1) return null;
  const elements = paginationElements(current, last);
  return (
    <nav>
      <ul className="pagination">
        {current <= 1 ? (
          <li className="page-item disabled" aria-disabled="true" aria-label="« Previous">
            <span className="page-link" aria-hidden="true">&lsaquo;</span>
          </li>
        ) : (
          <li className="page-item">
            <StoreLink className="page-link" href={pageUrl(path, query, current - 1)} rel="prev" aria-label="« Previous">&lsaquo;</StoreLink>
          </li>
        )}

        {elements.map((el, i) => (
          <Fragment key={i}>
            {el === '...' ? (
              <li className="page-item disabled" aria-disabled="true"><span className="page-link">...</span></li>
            ) : (
              el.map((p) =>
                p === current ? (
                  <li className="page-item active" aria-current="page" key={p}><span className="page-link">{p}</span></li>
                ) : (
                  <li className="page-item" key={p}><StoreLink className="page-link" href={pageUrl(path, query, p)}>{p}</StoreLink></li>
                ),
              )
            )}
          </Fragment>
        ))}

        {current < last ? (
          <li className="page-item">
            <StoreLink className="page-link" href={pageUrl(path, query, current + 1)} rel="next" aria-label="Next »">&rsaquo;</StoreLink>
          </li>
        ) : (
          <li className="page-item disabled" aria-disabled="true" aria-label="Next »">
            <span className="page-link" aria-hidden="true">&rsaquo;</span>
          </li>
        )}
      </ul>
    </nav>
  );
}
