import { redirect } from 'next/navigation';
import { getCurrentCustomer } from '@/lib/auth';
import { takeFormState } from '@/lib/form-state';
import { buildMetadata } from '@/lib/seo';
import AuthPage from '@/components/store/AuthPage';

export async function generateMetadata() {
  return buildMetadata({ page: 'login' });
}

export default async function LoginPage() {
  if (await getCurrentCustomer()) redirect('/customer/dashboard');
  return <AuthPage mode="login" form={await takeFormState()} />;
}
