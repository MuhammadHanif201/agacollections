import { adminLogout } from '@/lib/admin/auth-flow';
import { guestAction } from '@/lib/admin/http';

export const POST = guestAction(() => adminLogout('/admin/login'));
