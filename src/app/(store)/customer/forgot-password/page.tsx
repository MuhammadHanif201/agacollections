import { takeFormState } from '@/lib/form-state';
import { buildMetadata } from '@/lib/seo';
import AuthPage from '@/components/store/AuthPage';

export async function generateMetadata() {
  return buildMetadata({ page: 'login' });
}

export default async function ForgotPasswordPage() {
  return <AuthPage mode="forgot" form={await takeFormState()} />;
}
