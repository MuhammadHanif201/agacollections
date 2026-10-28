/**
 * Give every product the store's SKU prefix and every variant a unique SKU.
 * Imported products carry the old brand's prefix (DC-…) and variant SKUs made of the
 * size alone (DC-S on 16 products). Afterwards: product AC-69-OVE-TEE, variant
 * AC-69-OVE-TEE-S, the same rule the admin product forms use. Safe to run again.
 *
 *   npm run fix:skus -- --dry-run   # print the changes only
 *   npm run fix:skus                # write them
 *
 * Run after `import:mysql`. Reads MONGODB_URI / MONGODB_DB from .env.local (or the environment);
 * the prefix comes from the store name in company settings (AGA Collections → AC).
 */
import fs from 'node:fs';
import mongoose from 'mongoose';
import { brandInitials, skuCode } from '../src/lib/format';
import { CompanySetting } from '../src/models/content';
import { Product } from '../src/models/Product';

for (const f of ['.env.local', '.env']) {
  if (fs.existsSync(f)) { process.loadEnvFile(f); break; }
}

const DRY = process.argv.includes('--dry-run');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is not set (.env.local).'); process.exit(1); }
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  const prefix = brandInitials((await CompanySetting.findOne().sort({ _id: 1 }).lean())?.name);
  const products = await Product.find().sort({ _id: 1 }).lean();
  console.log(`Connected to ${mongoose.connection.name}. Prefix ${prefix}, ${products.length} products.`);

  const fromName = (name: string) => `${prefix}-` + name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map(skuCode).join('-');
  const taken = new Set<string>();
  const updates: { _id: number; sku: string; variants: { _id: number; sku: string }[] }[] = [];

  for (const p of products) {
    // Keep the product's own code, swap a two-letter brand prefix (DC-, TS-) for this store's
    let sku = (p.sku ? String(p.sku).trim().replace(/^[A-Z]{2}-/, `${prefix}-`) : fromName(p.name))
      .replace(/-{2,}/g, '-').replace(/-+$/, '');
    if (taken.has(sku)) sku = `${sku}-${p._id}`;
    taken.add(sku);
    const variants = (p.variants ?? []).map((v) => {
      const codes = Object.values(v.option_values ?? {}).map((x) => skuCode(String(x))).filter(Boolean);
      return { _id: v._id, sku: codes.length ? `${sku}-${codes.join('-')}` : `${sku}-${v._id}` };
    });
    const changed = sku !== p.sku || variants.some((v, i) => v.sku !== p.variants[i].sku);
    if (changed) updates.push({ _id: p._id, sku, variants });
    if (changed && updates.length <= 5) console.log(`  ${p.sku ?? '(none)'} → ${sku}  e.g. ${p.variants[0]?.sku ?? ''} → ${variants[0]?.sku ?? ''}`);
  }

  const all = updates.flatMap((u) => u.variants.map((v) => v.sku));
  const dupes = [...new Set(all.filter((s, i) => all.indexOf(s) !== i))];
  if (dupes.length) { console.error(`Stopped: duplicate variant SKUs ${dupes.slice(0, 10).join(', ')}`); process.exit(1); }
  console.log(`${updates.length} products to update.`);

  if (!DRY && updates.length) {
    const now = new Date();
    await Product.collection.bulkWrite(updates.flatMap((u) => [
      { updateOne: { filter: { _id: u._id } as never, update: { $set: { sku: u.sku, updated_at: now } } } },
      ...u.variants.map((v) => ({
        updateOne: { filter: { _id: u._id } as never, update: { $set: { 'variants.$[v].sku': v.sku } }, arrayFilters: [{ 'v._id': v._id }] },
      })),
    ]));
    console.log('Done.');
  } else if (DRY) {
    console.log('Dry run: nothing written.');
  }
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
