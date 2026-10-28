import { adminLogin, showLogin } from '@/lib/admin/auth-flow';
import { guestAction } from '@/lib/admin/http';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) => showLogin(req, 'admin.login');
export const POST = guestAction(({ req, input }) => adminLogin(req, input));
