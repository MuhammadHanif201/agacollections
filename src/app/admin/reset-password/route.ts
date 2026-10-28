import { resetPassword } from '@/lib/admin/auth-flow';
import { guestAction } from '@/lib/admin/http';

export const POST = guestAction(({ req, input }) => resetPassword(req, input));
