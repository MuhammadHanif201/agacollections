import { NextResponse } from 'next/server';
import { recordAudit } from '@/lib/admin/audit';
import { connectDb } from '@/lib/db';
import { setFlash } from '@/lib/flash';
import { hasValidSignature } from '@/lib/signed-url';
import { NewsletterSubscriber } from '@/models/content';

/** NewsletterController::unsubscribe (signed link from the welcome email) */
export async function GET(req: Request, { params }: { params: Promise<{ subscriber: string }> }) {
  if (!hasValidSignature(req.url)) return new NextResponse('Invalid signature.', { status: 403 });
  const id = Number((await params).subscriber);
  await connectDb();
  const sub = Number.isInteger(id) ? await NewsletterSubscriber.findById(id).lean() : null;
  if (!sub) return new NextResponse('Not Found', { status: 404 });

  if (sub.status === 'unsubscribed') {
    await setFlash('newsletter_success', 'You were already unsubscribed from our newsletter.');
  } else {
    await NewsletterSubscriber.updateOne({ _id: id }, { $set: { status: 'unsubscribed' } });
    await recordAudit({ event: 'updated', type: 'App\\Models\\NewsletterSubscriber', id, old: { status: 'subscribed' }, new: { status: 'unsubscribed' } });
    await setFlash('newsletter_success', 'You have been unsubscribed. You will not receive our newsletter any more.');
  }
  return NextResponse.redirect(new URL('/', req.url), 303);
}
