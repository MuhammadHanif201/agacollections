// errors/_error-layout.blade.php
import type { CSSProperties } from 'react';
import { mediaUrl } from '@/lib/media';
import { PageStyles } from './LegacyStyles';
import StoreLink from './StoreLink';

export interface ErrorViewProps {
  code: string;
  title: string;
  message: string;
  primaryUrl?: string;
  primaryLabel?: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
}

export const ERRORS: Record<string, ErrorViewProps> = {
  '403': { code: '403', title: 'Access denied', message: 'You do not have permission to access this page.', secondaryLabel: 'Go Back' },
  '404': {
    code: '404',
    title: 'Page not found',
    message: 'The page you are looking for could not be found. It may have been moved, deleted, or the link may be incorrect.',
    secondaryUrl: '/shop',
    secondaryLabel: 'Continue Shopping',
  },
  '419': { code: '419', title: 'Session expired', message: 'Your session has expired. Please refresh the page and try again.', primaryLabel: 'Refresh Page', secondaryUrl: '/', secondaryLabel: 'Back to Home' },
  '429': { code: '429', title: 'Too many requests', message: 'You have made too many requests in a short time. Please wait a moment and try again.' },
  '500': { code: '500', title: 'Something went wrong', message: 'We’re sorry, an unexpected error occurred while processing your request. Please try again in a moment.' },
  '503': { code: '503', title: 'Service unavailable', message: 'The service is temporarily unavailable. Please check back again shortly.' },
};

export default function ErrorView(p: ErrorViewProps) {
  return (
    <>
      <PageStyles pushed={['errors___error-layout.1']} />
      <div className="container my-4 my-md-5" data-err="" style={{ '--zq-error-photo': `url('${mediaUrl('banners/zq-shop.jpg')}')` } as CSSProperties}>
        <div className="error-hero">
          <div className="error-card text-center">
            <div className="mb-3 text-center">
              <span className="error-code">{p.code}</span>
            </div>
            <div className="text-center">
              <h1 className="error-title">{p.title}</h1>
              <p className="error-text">
                {p.message}
              </p>
              <div className="error-actions">
                <StoreLink href={p.primaryUrl ?? '/'} className="error-btn-primary">{p.primaryLabel ?? 'Back to Home'}</StoreLink>
                <StoreLink href={p.secondaryUrl ?? ''} className="error-btn-secondary">{p.secondaryLabel ?? 'Try Again'}</StoreLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
