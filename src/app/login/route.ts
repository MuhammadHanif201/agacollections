// Auth::routes(): the default /login page (guests are sent here by the "auth" middleware)
import { getCurrentAdmin } from '@/lib/admin/auth';
import { defaultLogin, showLogin } from '@/lib/admin/auth-flow';
import { guestAction, redirect } from '@/lib/admin/http';
import { connectDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await connectDb();
  if (await getCurrentAdmin()) return redirect('/home'); // the "guest" middleware
  return showLogin(req, 'login');
}
export const POST = guestAction(({ req, input }) => defaultLogin(req, input));
