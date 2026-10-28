import { sendResetLink, showForgot } from '@/lib/admin/auth-flow';
import { guestAction } from '@/lib/admin/http';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) => showForgot(req);
export const POST = guestAction(({ req, input }) => sendResetLink(req, input));
