import 'server-only';
import type { ClientSession } from 'mongoose';
import { Order, type OrderItem } from '@/models/Order';
import { Product } from '@/models/Product';

/**
 * StockService: stock changes for orders placed or edited by staff, and for cancellations.
 *  - products with sizes: stock lives on the size and the product total is kept equal to
 *    the sum of its sizes
 *  - products without sizes: stock is the product's quantity
 */
export class StockError extends Error {}

/** Products with sizes: product quantity = total of the sizes */
export async function syncProduct(productId: number, session?: ClientSession) {
  await Product.updateOne(
    { _id: productId, 'variants.0': { $exists: true } },
    [{ $set: { quantity: { $sum: { $map: { input: '$variants', in: { $ifNull: ['$$this.quantity', 0] } } } } } }],
    { session, updatePipeline: true },
  );
}

/** Check and take stock for one order line (throws StockError with a message staff can act on) */
export async function takeStock(productId: number | null, variantId: number | null, qty: number, name: string, session: ClientSession) {
  if (variantId) {
    const product = await Product.findOne({ 'variants._id': variantId }).session(session).lean();
    const variant = product?.variants.find((v) => v._id === variantId);
    if (!product || !variant) throw new StockError(`${name} no longer exists.`);
    const have = Number(variant.quantity ?? 0);
    if (have < qty) throw new StockError(have > 0 ? `Only ${have} left of ${name}.` : `${name} is out of stock.`);
    await Product.updateOne({ _id: product._id, 'variants._id': variantId }, { $inc: { 'variants.$.quantity': -qty } }, { session });
    await syncProduct(product._id, session);
    return;
  }
  const product = productId ? await Product.findById(productId).session(session).lean() : null;
  if (!product) throw new StockError(`${name} no longer exists.`);
  const have = Number(product.quantity ?? 0);
  if (have < qty) throw new StockError(have > 0 ? `Only ${have} left of ${name}.` : `${name} is out of stock.`);
  await Product.updateOne({ _id: product._id }, { $inc: { quantity: -qty } }, { session });
}

/** Put an order line's stock back, once (only if it was taken) */
export async function giveBack(orderId: number, item: OrderItem, session: ClientSession) {
  if (!item.stock_adjusted) return;
  const owner = item.variant_id ? await Product.findOne({ 'variants._id': item.variant_id }).session(session).lean() : null;
  if (owner) {
    await Product.updateOne({ _id: owner._id, 'variants._id': item.variant_id }, { $inc: { 'variants.$.quantity': item.quantity } }, { session });
    await syncProduct(owner._id, session);
  } else if (!item.variant_id && !item.variant_label && item.product_id) {
    // only products that have no sizes; a deleted size has nowhere to go back to
    await Product.updateOne({ _id: item.product_id, 'variants.0': { $exists: false } }, { $inc: { quantity: item.quantity } }, { session });
  }
  await Order.updateOne({ _id: orderId, 'items._id': item._id }, { $set: { 'items.$.stock_adjusted': false } }, { session });
}
