'use client';

import { Fragment, type ReactNode } from 'react';
import { useNavKey } from './useNavKey';

/**
 * The storefront pages were written for full page loads: their scripts bind to the markup
 * once and set classes by hand (drawers, galleries, filters). With client-side navigation
 * the header and footer stay mounted, so the page itself is remounted on every navigation
 * (like template.tsx, but also when only the query changes). The page then starts from
 * fresh markup and its scripts run again, exactly as after a reload.
 */
export default function PageFrame({ children }: { children: ReactNode }) {
  return <Fragment key={useNavKey()}>{children}</Fragment>;
}
