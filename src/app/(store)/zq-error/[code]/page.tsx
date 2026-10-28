import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ErrorView, { ERRORS } from '@/components/store/ErrorView';
import { getCompanySetting } from '@/services/settings';

// The storefront error pages (errors/*.blade.php) for responses built in Route Handlers,
// such as the admin panel's 404 / 419 / 429 answers. Fetched internally, never linked.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const e = ERRORS[(await params).code];
  const name = (await getCompanySetting())?.name ?? 'AGA Collections';
  return { title: `${e?.title ?? 'Error'} | ${name}`, description: e?.message, robots: 'noindex, nofollow' };
}

export default async function ErrorPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ current?: string }> }) {
  const e = ERRORS[(await params).code];
  if (!e) notFound();
  const current = (await searchParams).current;
  const here = current && current.startsWith('/') && !current.startsWith('//') ? current : undefined;
  if (e.code === '419') return <ErrorView {...e} primaryUrl={here ?? e.primaryUrl} />;
  if (e.code === '429' || e.code === '403' || e.code === '500') return <ErrorView {...e} secondaryUrl={here ?? e.secondaryUrl} />;
  return <ErrorView {...e} />;
}
