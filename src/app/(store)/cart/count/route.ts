import { json } from '@/lib/route';
import { getSession } from '@/lib/session';
import { cartCount } from '@/services/pricing';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  return json({ count: cartCount(s.data.cart) });
}
