import { adminPage } from '@/lib/admin/http';
import { subscribersCsv } from '@/services/admin/newsletter';

export const dynamic = 'force-dynamic';

/** NewsletterAdminController::export */
export const GET = adminPage(async () => new Response(await subscribersCsv(), {
  headers: { 'content-type': 'text/csv; charset=UTF-8', 'content-disposition': 'attachment; filename="newsletter_subscribers.csv"' },
}));
