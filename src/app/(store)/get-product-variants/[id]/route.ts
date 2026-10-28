import { connectDb } from '@/lib/db';
import { mediaUrl } from '@/lib/media';
import { json } from '@/lib/route';
import { Product } from '@/models/Product';

const ucfirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Sizes/colours of a product for the "Choose Variant" modal */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return json({ message: 'Not Found' }, 404);
  await connectDb();
  const product = await Product.findOne({ _id: id, status: 'active' }).lean();
  if (!product) return json({ message: 'Not Found' }, 404);

  const optionGroups: Record<string, Record<string, boolean>> = {};
  const variants = product.variants.map((v) => {
    for (const [opt, val] of Object.entries(v.option_values ?? {})) {
      (optionGroups[opt.toLowerCase()] ??= {})[ucfirst(String(val))] = true;
    }
    return {
      id: v._id,
      sku: v.sku ?? null,
      price: Number(v.price ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      image: mediaUrl(v.primary_image ?? ''),
      quantity: v.quantity ?? null,
      options: Object.fromEntries(Object.entries(v.option_values ?? {}).map(([k, val]) => [k.toLowerCase(), val])),
    };
  });
  return json({ variants, optionGroups });
}
