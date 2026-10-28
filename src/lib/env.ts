import 'server-only';

function optional(name: string, fallback = ''): string {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

export const env = {
  get mongodbUri() {
    const v = process.env.MONGODB_URI;
    if (!v) throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
    return v;
  },
  mongodbDb: optional('MONGODB_DB'),
  appUrl: optional('APP_URL', 'http://localhost:3000').replace(/\/+$/, ''),
  appName: optional('APP_NAME', 'AGA Collections'),
  get appSecret() {
    const v = process.env.APP_SECRET;
    if (!v || v.length < 32) throw new Error('APP_SECRET must be set to a random string of at least 32 characters.');
    return v;
  },
  sessionLifetimeMinutes: Number(optional('SESSION_LIFETIME', '10080')),
  mail: {
    host: optional('MAIL_HOST'),
    port: Number(optional('MAIL_PORT', '587')),
    username: optional('MAIL_USERNAME'),
    password: optional('MAIL_PASSWORD'),
    encryption: optional('MAIL_ENCRYPTION'),
    fromAddress: optional('MAIL_FROM_ADDRESS', 'hello@example.com'),
    fromName: optional('MAIL_FROM_NAME', 'AGA Collections'),
  },
  metaPixelId: optional('META_PIXEL_ID'),
  clarityId: optional('CLARITY_ID'),
  socialLinksEnabled: optional('SOCIAL_LINKS_ENABLED', 'false') === 'true',
  affiliateLinksEnabled: optional('AFFILIATE_LINKS_ENABLED', 'false') === 'true',
  productCardImageRatio: optional('PRODUCT_CARD_IMAGE_RATIO'),
};
