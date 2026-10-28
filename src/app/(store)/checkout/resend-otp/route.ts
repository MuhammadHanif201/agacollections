import { json } from '@/lib/route';

/** No checkout code is pending (orders are placed without one) */
export function POST() {
  return json({ status: 'error', message: 'Session expired. Please go back and try again.' }, 400);
}
