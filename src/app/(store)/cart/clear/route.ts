import { json, rejectCrossSite } from '@/lib/route';
import { getWritableSession, saveSession } from '@/lib/session';

export async function POST(req: Request) {
  const bad = rejectCrossSite(req);
  if (bad) return bad;
  const s = await getWritableSession();
  delete s.data.cart;
  await saveSession(s);
  return json({ status: 'cleared' });
}
