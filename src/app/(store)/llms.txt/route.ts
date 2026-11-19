import { env } from '@/lib/env';
import { connectDb } from '@/lib/db';
import { strTitle } from '@/lib/format';
import { Product } from '@/models/Product';
import { shownPrice } from '@/services/catalog';
import { getCompanySetting, getMenuCategories } from '@/services/settings';

export const dynamic = 'force-dynamic';

/**
 * /llms.txt: a plain summary of the store for AI assistants (what is sold, prices, payment, delivery, exchanges),
 * built from the live categories and products. Facts come from the store's Policies page.
 */
export async function GET() {
  await connectDb();
  const [company, cats, products] = await Promise.all([
    getCompanySetting(),
    getMenuCategories(),
    Product.find({ status: 'active' }, { name: 1, slug: 1, price: 1, variants: 1, category_ids: 1 }).sort({ sort_order: 1, _id: 1 }).lean(),
  ]);
  const brand = company?.name ?? 'AGA Collections';
  const base = env.appUrl;
  const rs = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-PK');
  const priceOf = (p: Parameters<typeof shownPrice>[0]) => shownPrice(p); // the price on the product cards
  const wa = company?.whatsapps?.[0] ?? null;
  const emailList = company?.emails ? (Array.isArray(company.emails) ? company.emails : Object.values(company.emails)) : [];
  const email = emailList.find((e) => typeof e === 'string' && e.includes('@')) ?? null;

  const out: string[] = [
    `# ${brand}`,
    '',
    `> ${brand} is a streetwear clothing brand from Karachi, Pakistan, selling online at ${base}: unisex baggy jeans, oversized T-shirts, button-down shirts, sports jerseys, plain and printed hoodies and zip-up hoodies. Every order is cash on delivery anywhere in Pakistan.`,
    '',
    '## Buying from ' + brand,
    '',
    '- Payment: cash on delivery only (pay the courier when the parcel arrives), all over Pakistan.',
    '- Delivery: 2–4 working days to Karachi, Lahore and Islamabad; 4–6 working days to other cities. Couriers: TCS, Leopards Courier, BlueEx.',
    '- Exchanges: within 7 days of delivery for a different size or colour, if unused, unwashed and with tags on; pickup arranged on WhatsApp. Return shipping is paid by the customer unless the item is defective or wrong. Sale or discounted items cannot be exchanged. No cash refunds; defective or wrong items get a replacement or store credit.',
    '- Fit: oversized, unisex. Sizing help on WhatsApp.',
    ...(wa ? [`- WhatsApp: ${wa}`] : []),
    ...(email ? [`- Email: ${email}`] : []),
    `- Policies: ${base}/policies`,
    '',
    '## Categories',
    '',
  ];
  for (const c of cats) {
    if (!c.slug || c.title === 'Home Page - New Arrival') continue;
    const inCat = products.filter((p) => (p.category_ids ?? []).includes(c._id)).map(priceOf).filter((n) => n > 0);
    const from = inCat.length ? `, from ${rs(Math.min(...inCat))}` : '';
    out.push(`- [${strTitle(c.title)}](${base}/shop/${c.slug}): ${c.products_count} ${c.products_count === 1 ? 'style' : 'styles'}${from}`);
  }
  out.push('', '## Products', '');
  for (const p of products) {
    const price = priceOf(p);
    out.push(`- [${strTitle(p.name)}](${base}/product/${p.slug})${price > 0 ? `: ${rs(price)}` : ''}`);
  }
  out.push('', '## Pages', '', `- [Shop all](${base}/shop)`, `- [About ${brand}](${base}/about-us)`, `- [Contact](${base}/contact-us)`, `- [Policies](${base}/policies)`, '');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': 'public, max-age=3600' } });
}
