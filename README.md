# AGA Collections — Next.js

The AGA Collections shop (previously the Laravel app in the parent folder) rebuilt on
Next.js 16 (App Router, TypeScript) with MongoDB Atlas, deployable to Vercel.

- **Storefront:** home, shop and categories, product pages, bag, checkout (cash on
  delivery), thank-you page, customer accounts (sign in, sign up, forgot/reset password,
  dashboard, orders, profile, wishlist), reviews, newsletter, contact form, policies,
  about page, sitemap, robots.txt, Meta catalog feed, every storefront email.
- **Affiliate program:** info, apply, dashboard, withdrawals, `?ref=` tracking.
- **Admin panel (`/admin`):** sign in (email or username), forgot/reset password,
  dashboard, orders (filters, status changes with stock return and commissions), custom
  orders, customers, products (sizes, images, sorting), categories, reviews, coupons,
  newsletter subscribers (CSV export) and campaigns, announcement bar, popup, homepage
  sliders, about page, policies, store settings, admin users, profile, affiliates and
  withdrawals, and the audit log.

The pages use the original stylesheets and markup, so they look the same as the
Laravel site; see "How the design is kept" below.

## Stack

| | |
|---|---|
| Framework | Next.js 16.4 (App Router, Server Components, Route Handlers, Server Actions), React 19, TypeScript 5.9 |
| Database | MongoDB Atlas via Mongoose 9 |
| Validation | Zod 4 (Laravel's error messages) |
| Auth | Own session store in MongoDB (httpOnly cookie, rotated on sign-in), bcrypt passwords (existing Laravel `$2y$` hashes work), "remember me" token |
| Email | Nodemailer (any SMTP server) |
| Media | Vercel Blob (`@vercel/blob`) |
| UI | The original Bootstrap 5.3.0, Remix Icon, Font Awesome, Swiper 6.5.4 and SweetAlert2 11, unchanged CSS |

Tailwind CSS and next/image are deliberately not used: Tailwind's base reset would
change Bootstrap's look, and next/image would change the image markup the CSS targets.

## Run it locally

Requires Node.js 20.9+ (tested on Node 24).

```bash
cd web
npm install
cp .env.example .env.local     # then fill it in (see below)
```

A local database instead of Atlas (optional, a single-node replica set so transactions work):

```bash
npm run dev:db                 # leave running; MONGODB_URI=mongodb://127.0.0.1:27018/?replicaSet=testset
```

Load the shop data and start:

```bash
npm run import:mysql -- ../desiyvqw_desire.sql      # add --drop to replace existing data
npm run fix:storefront                               # category names, banners, spelling, old headlines
npm run fix:skus                                     # AC- product SKUs, one unique SKU per variant
cp -r ../storage/app/public public/storage           # local copy of uploads (or use Blob, below)
npm run dev                                          # http://localhost:3000
```

Production build: `npm run build && npm start`. Checks: `npm run lint`, `npm run typecheck`.

## MongoDB Atlas

1. Create a project and a cluster at https://cloud.mongodb.com (M0 is fine to start;
   M10+ for production traffic and backups). Pick a region near the Vercel region.
2. **Database Access** → add a database user with *Read and write to any database*
   (or only the `tashan` database). Use a generated password.
3. **Network Access** → allow `0.0.0.0/0` (Vercel functions have no fixed IPs), or use
   the Vercel ↔ Atlas integration, which manages this for you.
4. **Connect → Drivers** → copy the `mongodb+srv://…` string into `MONGODB_URI` and set
   `MONGODB_DB=tashan`.
5. Import the data: `npm run import:mysql -- ../desiyvqw_desire.sql`. Indexes are created
   by the import. Run it with the **newest** dump at cut-over: the dump in this repo
   ends on 18 Oct 2026 and predates three migrations (their columns are optional here).
6. `npm run fix:storefront` (`--dry-run` first prints the changes): applies what the Laravel
   admin set after the dump: category names and menu order (T-Shirts, Shirts, Baggy Jeans,
   Football Jerseys, Zip Hoodies; the T-shirts category moves from /shop/jersey to
   /shop/t-shirts, and the old URL redirects), the hero banners, the Shop All banner and the
   About page photos. It also switches off the old brand's two sale headlines and corrects
   spelling in 8 product names and their URLs (COFFE, MALASIYAN, WAHSED, NEAVY, JEAS, BALLON)
   and in size labels ("Sizs", "S’", "samll", a doubled Size group).
7. `npm run fix:skus` (`--dry-run` first): the dump's SKUs carry the old brand's prefix
   (`DC-…`) and its variant SKUs are the size alone (`DC-S` on 16 products). Afterwards every
   product has the store's prefix (`AC-69-OVE-TEE`) and every variant its own SKU
   (`AC-69-OVE-TEE-S`), as the admin product forms make them. Run it after step 6.

Checkout uses multi-document transactions; Atlas clusters support them out of the box.

## Media (Vercel Blob)

Uploaded files keep their Laravel paths (`products/…`, `banners/…`).

1. Vercel dashboard → Storage → create a Blob store (public) and copy its read/write token
   into `BLOB_READ_WRITE_TOKEN`.
2. `npm run upload:media -- ../storage/app/public` (`--dry-run` first lists what is
   missing). It prints the store URL: put it in `NEXT_PUBLIC_MEDIA_BASE_URL`.
3. The live server's `storage/app/public` is the complete copy. This repo's copy lacks:
   `logos/Ynn58RGxAhxS8SzatmtHZCllNbX0v5UEINvdFEti.png`,
   `favicon/zHtCYaaZ6anMyrddvRkFYznZs0Okj7K16LTcR2DZ.jpg` and
   `products/dusty-sand-washed-jean-additional-0-1783434463.jpg`.

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `APP_URL` | yes | Public site address (canonical URLs, emails, sitemap, feeds) |
| `APP_SECRET` | yes | 32+ random characters; signs unsubscribe links |
| `MONGODB_URI`, `MONGODB_DB` | yes | Atlas connection |
| `NEXT_PUBLIC_MEDIA_BASE_URL` | yes in production | Blob store URL for uploaded images |
| `BLOB_READ_WRITE_TOKEN` | yes in production | Upload script and admin uploads (without it, uploads go to `public/storage`, for local use only) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | for email | Order confirmations, admin order alerts, contact form, password reset, welcome emails, order status and newsletter emails |
| `MAIL_MAILER` | optional | `log` writes emails to the server log instead of sending them (local testing, like Laravel's log mailer) |
| `LEGACY_APP_KEY` | optional | The Laravel `APP_KEY`, so newsletter unsubscribe links already sent keep working |
| `SESSION_LIFETIME` | optional | Minutes; default 10080 (7 days, as live) |
| `META_PIXEL_ID`, `CLARITY_ID` | optional | Analytics, only loaded when set |
| `SOCIAL_LINKS_ENABLED` | optional | `true` turns the social icons into links |
| `AFFILIATE_LINKS_ENABLED` | optional | `true` shows the affiliate links (account menu, checkout referral code); the affiliate pages work either way |
| `PRODUCT_CARD_IMAGE_RATIO` | optional | Card photo ratio (default 3/4) |
| `SHARE_IMAGE_PATH` | optional | Share image path in the media store |
| `APP_NAME` | optional | Brand name in the admin order and admin password-reset emails (default AGA Collections) |

Without mail settings the shop still works; emails are skipped and logged, as before.

## Deploy to Vercel

1. Import the repository in Vercel, leaving **Root Directory** empty (framework: Next.js).
2. Add the environment variables above (Production and Preview).
3. Deploy. Proxy, pages and route handlers run as Node.js functions.

## Admin panel

- Sign in at `/admin/login` (or `/login`) with an existing admin account: the imported
  `users` keep their Laravel passwords. Admin users are managed under *Admin Users*.
- Uploaded pictures are resized to at most 1600px and saved as WebP (the old app's
  MediaOptimizer); variant pictures as JPEG; videos and other files as sent.
- Every create / update / delete on the audited models writes an audit row with the
  same fields as owen-it/laravel-auditing, so the *Audit Log* continues the old history
  (import it with `--with-audits`). Password hashes are no longer written to it.
- Differences from the old app, on purpose:
  - **Send campaign** works. The PHP used a status constant the model never defined, so
    the button failed. Emails go out during the request (Vercel has no queue worker).
  - `POST /admin/newsletter/subscribers/{id}/status` had no controller method (and no
    page used it), so it is not provided.

## Going live

1. Freeze the Laravel site, take a fresh dump, run the import with `--drop
   --with-audits`, run `npm run fix:storefront` then `npm run fix:skus`, upload media.
2. Point the domain at Vercel.

Customers and admins keep their passwords. Signed-in sessions and bags do not carry over
(everyone signs in again once). New ids continue from MySQL's AUTO_INCREMENT values.

## How the design is kept

- Every stylesheet the Blade layout loaded is linked in the same order. The inline
  `<style>` blocks of each Blade view were copied unchanged into `public/legacy/css/`
  (`<view>.<n>.css`); only three Blade expressions inside CSS were replaced with their values.
- The cascade order is kept with React stylesheet precedence groups
  (`src/components/store/LegacyStyles.tsx`): theme → the page's pushed styles → header
  styles → styles inside the page body → footer styles, as in the original document.
- Markup was ported element by element with the same classes, ids, inline styles and texts.
- The page scripts (drawer, search, gallery, size picker, sticky bar, checkout phone and
  shipping, etc.) were ported to small client components that act on that markup, using
  the same libraries (Bootstrap JS for modals, Swiper 6.5.4, SweetAlert2 11).
- Navigation uses plain links (full page loads), like the Laravel site.
- The admin pages are the Blade views ported to server-rendered HTML templates
  (`src/admin-views/`, one file per view) and sent by Route Handlers, with the original
  jQuery / AdminLTE scripts and inline styles unchanged. `src/lib/admin/php.ts` provides
  the helpers the views used (Carbon dates, collections, paginator links, `route()`,
  `old()`, `$errors`), so the text and markup come out the same.

## Layout of the code

```
src/app/(store)/        storefront pages and route handlers (same URLs as before)
src/app/admin/          admin route handlers (same URLs as before)
src/admin-views/        admin pages (ported Blade views)
src/lib/admin/          admin session, validation (Laravel rules and messages), uploads, audit log
src/services/admin/     admin data and actions (one file per area)
src/components/store/   header, footer, product card, page scripts
src/services/           cart, pricing/shipping, orders, catalog, shop query, settings
src/models/             Mongoose models (ids continue the MySQL ids)
src/lib/                db, env, session, auth, mail, flash, SEO, formatting
src/validators/         Zod schemas
src/emails/             email templates (ported from resources/views/emails)
scripts/                MySQL import, media upload, local test database
public/                 original assets (same paths) and legacy/css
```
