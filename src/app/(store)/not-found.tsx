import type { Metadata } from 'next';
import ErrorView, { ERRORS } from '@/components/store/ErrorView';
import { getCompanySetting } from '@/services/settings';

export const metadata: Metadata = {
  description: ERRORS['404'].message,
  robots: 'noindex, nofollow',
};

export default async function NotFound() {
  // errors/_error-layout: "<title> | <store name>"
  const name = (await getCompanySetting())?.name ?? 'AGA Collections';
  return (
    <>
      <title>{`Page not found | ${name}`}</title>
      <ErrorView {...ERRORS['404']} />
    </>
  );
}
