import { connectDb } from '@/lib/db';
import { env } from '@/lib/env';
import { escapeHtml } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { Category } from '@/models/Category';
import { Product } from '@/models/Product';
import { activeProductCounts } from '@/services/settings';

export const dynamic = 'force-dynamic';

const abs = (u: string) => (/^https?:/.test(u) ? u : env.appUrl + u);
/** Carbon toAtomString(): 2026-10-18T14:31:59+00:00 */
const atom = (d?: Date | null) => (d ? d.toISOString().replace(/\.\d{3}Z$/, '+00:00') : '');

/** ClientController::siteMapping — only pages a shopper can use */
export async function GET() {
  await connectDb();
  const [products, cats, counts] = await Promise.all([
    Product.find({ status: 'active' }).sort({ sort_order: 1, _id: 1 }).select('slug updated_at images').lean(),
    Category.find({ status: 'active' }).sort({ sort_order: 1, _id: 1 }).lean(),
    activeProductCounts(),
  ]);
  const categories = cats.filter((c) => (counts.get(c._id) ?? 0) > 0);
  const e = escapeHtml;
  const base = env.appUrl;

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    '',
    '    <url>', `        <loc>${e(base)}</loc>`, '        <changefreq>daily</changefreq>', '        <priority>1.0</priority>', '    </url>',
    '',
    '    <url>', `        <loc>${e(base + '/shop')}</loc>`, '        <changefreq>daily</changefreq>', '        <priority>0.9</priority>', '    </url>',
    '',
  ];
  for (const c of categories) {
    lines.push('    <url>', `        <loc>${e(`${base}/shop/${c.slug ?? ''}`)}</loc>`, `        <lastmod>${atom(c.updated_at)}</lastmod>`, '        <changefreq>weekly</changefreq>', '        <priority>0.8</priority>', '    </url>');
  }
  lines.push('');
  for (const p of products) {
    lines.push('    <url>', `        <loc>${e(`${base}/product/${p.slug}`)}</loc>`, `        <lastmod>${atom(p.updated_at)}</lastmod>`, '        <changefreq>weekly</changefreq>', '        <priority>0.8</priority>');
    // primary image first, up to five
    for (const img of [...p.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary)).slice(0, 5)) {
      lines.push('        <image:image>', `            <image:loc>${e(abs(mediaUrl(img.image_path)))}</image:loc>`, '        </image:image>');
    }
    lines.push('    </url>');
  }
  lines.push(
    '',
    '    <url>', `        <loc>${e(base + '/about-us')}</loc>`, '        <changefreq>monthly</changefreq>', '        <priority>0.5</priority>', '    </url>',
    '',
    '    <url>', `        <loc>${e(base + '/contact-us')}</loc>`, '        <changefreq>monthly</changefreq>', '        <priority>0.5</priority>', '    </url>',
    '',
    '    <url>', `        <loc>${e(base + '/policies')}</loc>`, '        <changefreq>yearly</changefreq>', '        <priority>0.3</priority>', '    </url>',
    '',
    '</urlset>',
  );
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'application/xml; charset=UTF-8' } });
}
