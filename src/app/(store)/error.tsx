'use client';

import { useEffect } from 'react';
import ErrorView, { ERRORS } from '@/components/store/ErrorView';

export default function StoreError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorView {...ERRORS['500']} secondaryUrl={typeof window !== 'undefined' ? window.location.href : ''} />;
}
