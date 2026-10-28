import type { Metadata } from 'next';
import StoreLayout from './(store)/layout';
import ErrorView, { ERRORS } from '@/components/store/ErrorView';
import { getCompanySetting } from '@/services/settings';

// URLs that match no route (the store and admin areas have separate root layouts)
export const metadata: Metadata = {
  description: ERRORS['404'].message,
  robots: 'noindex, nofollow',
};

export default async function GlobalNotFound() {
  const name = (await getCompanySetting())?.name ?? 'AGA Collections';
  return (
    <StoreLayout>
      <title>{`Page not found | ${name}`}</title>
      <ErrorView {...ERRORS['404']} />
    </StoreLayout>
  );
}
