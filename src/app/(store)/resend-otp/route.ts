import { json } from '@/lib/route';

/** No login code is pending (sign-in uses email and password) */
export function POST() {
  return json({ status: 'error', message: 'Session expired. Please login again.' });
}
