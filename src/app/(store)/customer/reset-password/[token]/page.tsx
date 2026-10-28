import { takeFormState } from '@/lib/form-state';
import { buildMetadata } from '@/lib/seo';
import AuthPage from '@/components/store/AuthPage';

export async function generateMetadata() {
  return buildMetadata({ page: 'login' });
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, q] = await Promise.all([params, searchParams]);
  return <AuthPage mode="reset" form={await takeFormState()} token={decodeURIComponent(token)} email={typeof q.email === 'string' ? q.email : ''} />;
}
