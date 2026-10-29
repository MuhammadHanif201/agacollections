import type { Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { getCurrentCustomer } from '@/lib/auth';
import { env } from '@/lib/env';
import { peekFlash } from '@/lib/flash';
import { getSession } from '@/lib/session';
import CookieConsent from '@/components/store/CookieConsent';
import FlashMessages from '@/components/store/FlashMessages';
import Footer from '@/components/store/Footer';
import Header from '@/components/store/Header';
import { LayoutStyles } from '@/components/store/LegacyStyles';
import PageFrame from '@/components/store/PageFrame';
import PixelPageView from '@/components/store/PixelPageView';
import StoreProvider from '@/components/store/StoreProvider';
import { wishlistIds } from '@/services/catalog';
import { cartCount } from '@/services/pricing';
import { getCompanySetting, getFooterPolicies, getMenuCategories } from '@/services/settings';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#161426',
};

// Every page shows the visitor's bag count and sign-in state
export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [company, menuCategories, footerPolicies, customer, session] = await Promise.all([
    getCompanySetting(),
    getMenuCategories(),
    getFooterPolicies(),
    getCurrentCustomer(),
    getSession(),
  ]);
  const cart = session.data.cart ?? {};
  const [wishlist, flash] = await Promise.all([wishlistIds(customer?._id), peekFlash()]);
  const newsletterNotice = flash && (flash.type === 'newsletter_success' || flash.type === 'newsletter_error')
    ? { ok: flash.type === 'newsletter_success', text: flash.text }
    : null;

  // The stylesheets set scroll-behavior: smooth; data-scroll-behavior keeps route changes from animating the jump to the top
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth">
      <head>
        <meta name="google-site-verification" content="Z_-YrkQkSPqhVSDAc26pOrKID2LeAV0ZS7Fp3BcQ-hQ" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <LayoutStyles productCardRatio={env.productCardImageRatio || undefined} />
      </head>
      <body>
        <StoreProvider initialCartCount={cartCount(cart)} initialWishlist={wishlist} isLoggedIn={Boolean(customer)}>
          <Header company={company} menuCategories={menuCategories} loggedIn={Boolean(customer)} cart={cart} />
          <main className="flex-grow-1"><PageFrame>{children}</PageFrame></main>
          <Footer company={company} menuCategories={menuCategories} footerPolicies={footerPolicies} newsletterNotice={newsletterNotice} />
          <FlashMessages />
          <CookieConsent />
          {env.metaPixelId && <PixelPageView />}
        </StoreProvider>

        {/* Microsoft Clarity: only when CLARITY_ID is set (use AGA Collections's own project) */}
        {env.clarityId && (
          <Script id="clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", ${JSON.stringify(env.clarityId)});`}
          </Script>
        )}
        {/* Meta (Facebook) Pixel: only when META_PIXEL_ID is set */}
        {env.metaPixelId && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', ${JSON.stringify(env.metaPixelId)});fbq('track', 'PageView');`}
            </Script>
            <noscript>
              <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${encodeURIComponent(env.metaPixelId)}&ev=PageView&noscript=1`} />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
