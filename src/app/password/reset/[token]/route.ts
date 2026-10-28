import { redirect } from '@/lib/admin/http';

/** Old reset links go to the admin reset page */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const email = new URL(req.url).searchParams.get('email');
  const token = encodeURIComponent(decodeURIComponent((await params).token));
  return redirect(`/admin/reset-password/${token}${email ? `?email=${encodeURIComponent(email)}` : ''}`);
}
