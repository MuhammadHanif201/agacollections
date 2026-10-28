import { showReset } from '@/lib/admin/auth-flow';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  return showReset(req, decodeURIComponent((await params).token));
}
