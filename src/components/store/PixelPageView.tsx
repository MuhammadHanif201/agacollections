'use client';

import { useEffect, useRef } from 'react';
import { useNavKey } from './useNavKey';

/**
 * The Meta Pixel snippet reports one PageView per document load. Client-side navigation
 * does not load a new document, so report the later pages here (the first is the snippet's).
 */
export default function PixelPageView() {
  const navKey = useNavKey();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.fbq?.('track', 'PageView');
  }, [navKey]);
  return null;
}
