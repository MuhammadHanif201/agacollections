import 'server-only';
import { connectDb } from '@/lib/db';
import { Carbon, carbonize, collect } from '@/lib/admin/php';
import { strLimit } from '@/lib/format';
import { Category } from '@/models/Category';
import { NewsletterSubscriber, Review } from '@/models/content';
import { Customer } from '@/models/Customer';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';

const day = (d: Date) => d.toISOString().slice(0, 10);
const dayExpr = (field = '$created_at') => ({ $dateToString: { format: '%Y-%m-%d', date: field } });
/** MySQL SUM() of a DECIMAL(10,2) column as Laravel hands it over: "123.00", or 0 for no rows */
const decimalSum = (n: number | null | undefined, rows: number) => (rows === 0 || n === null || n === undefined ? 0 : n.toFixed(2));

async function sumTotal(match: Record<string, unknown>) {
  const [r] = await Order.aggregate<{ total: number; n: number }>([{ $match: match }, { $group: { _id: null, total: { $sum: '$total' }, n: { $sum: 1 } } }]);
  return r ? r.total : 0;
}

/** HomeController::index */
export async function dashboardData() {
  await connectDb();
  const now = new Date();
  const today = day(now);
  const notCancelled = { status: { $ne: 'cancelled' } };

  const [totalOrders, totalProducts, totalCustomers, totalRevenue] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    Customer.countDocuments(),
    sumTotal({ status: 'completed' }),
  ]);

  const recentRaw = await Order.find().sort({ created_at: -1, _id: -1 }).limit(5).lean();
  const recentCustomers = await Customer.find({ _id: { $in: recentRaw.map((o) => o.customer_id) } }).select('full_name email phone').lean();
  const recentOrders = collect(recentRaw.map((o) => {
    const doc = carbonize(o);
    doc.customer = carbonize(recentCustomers.find((c) => c._id === o.customer_id) ?? null);
    return doc;
  }));

  const [viewsAgg] = await Product.aggregate<{ v: number }>([{ $group: { _id: null, v: { $sum: '$views' } } }]);
  const totalViews = viewsAgg?.v ?? 0;
  const conversionRate = totalViews > 0 ? Math.round((totalOrders / totalViews) * 100 * 100) / 100 : 0;

  // Low stock: products without sizes at 3 or less, and products with a size at 3 or less
  const warningThreshold = 3;
  const lowRaw = await Product.find({
    $or: [
      { 'variants.0': { $exists: false }, quantity: { $lte: warningThreshold } },
      { variants: { $elemMatch: { quantity: { $lte: warningThreshold } } } },
    ],
  }).sort({ _id: 1 }).lean();
  const lowStockProducts = collect(lowRaw.map((p) => {
    const doc = carbonize({ ...p, variants: p.variants.filter((v) => v.quantity !== null && v.quantity !== undefined && v.quantity <= warningThreshold) });
    doc.primaryImage = p.images.find((i) => i.is_primary) ?? null;
    return doc;
  })).sortBy('name');

  // Last 7 days (today included), cancelled orders left out
  const dates = collect<string>();
  const weeklySales = collect<number | string>();
  const weeklyOrders = collect<number>();
  const start = Carbon.today().subDays(6);
  const perDay = await Order.aggregate<{ _id: string; total: number; n: number }>([
    { $match: { ...notCancelled, created_at: { $gte: new Date(start.t) } } },
    { $group: { _id: dayExpr(), total: { $sum: '$total' }, n: { $sum: 1 } } },
  ]);
  for (let i = 6; i >= 0; i--) {
    const d = Carbon.today().subDays(i);
    dates.push(d.format('d M'));
    const row = perDay.find((r) => r._id === d.format('Y-m-d'));
    weeklySales.push(decimalSum(row?.total, row?.n ?? 0));
    weeklyOrders.push(row?.n ?? 0);
  }

  // Best sellers of the last 7 days (by order line date)
  const since = Carbon.now().subDays(7).format('Y-m-d');
  const top = await Order.aggregate<{ _id: number; qty: number }>([
    { $unwind: '$items' },
    { $match: { $expr: { $gte: [dayExpr('$items.created_at'), since] } } },
    { $group: { _id: '$items.product_id', qty: { $sum: '$items.quantity' } } },
    { $sort: { qty: -1, _id: 1 } },
    { $limit: 5 },
  ]);
  const topNames = await Product.find({ _id: { $in: top.map((t) => t._id) } }).select('name').lean();
  const topProducts = top.map((t) => ({ name: strLimit(topNames.find((p) => p._id === t._id)?.name ?? 'N/A', 25), quantity: String(t.qty) }));
  const productLabels = collect(topProducts.map((t) => t.name));
  const productQuantities = collect(topProducts.map((t) => t.quantity));

  const [todayOrders, todayRevenueRow, todayNewCustomers, pendingActionCount] = await Promise.all([
    Order.countDocuments({ $expr: { $eq: [dayExpr(), today] } }),
    sumTotal({ ...notCancelled, $expr: { $eq: [dayExpr(), today] } }),
    Customer.countDocuments({ $expr: { $eq: [dayExpr(), today] } }),
    Order.countDocuments({ status: 'pending' }),
  ]);

  const statusCounts = await Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]);
  const sc = (s: string) => statusCounts.find((r) => r._id === s)?.n ?? 0;
  const statusDistribution = { Pending: sc('pending'), Processing: sc('processing'), Completed: sc('completed'), Cancelled: sc('cancelled') };

  const pm = await Order.aggregate<{ _id: string | null; n: number; revenue: number }>([
    { $match: notCancelled },
    { $group: { _id: { $toLower: { $ifNull: ['$payment_method', ''] } }, method: { $first: '$payment_method' }, n: { $sum: 1 }, revenue: { $sum: '$total' } } },
    { $sort: { _id: 1 } },
  ]);
  const paymentMethodStats = collect(pm.map((r) => {
    const m = (r as unknown as { method: string | null }).method;
    return { method: (m ?? 'unknown').toUpperCase(), count: r.n, revenue: Math.round(r.revenue * 100) / 100 };
  }));

  const customerJoin = [
    { $match: notCancelled },
    { $lookup: { from: 'customers', localField: 'customer_id', foreignField: '_id', as: 'c' } },
    { $unwind: '$c' },
  ];
  const topCust = await Order.aggregate<{ _id: number; full_name: string; email: string | null; order_count: number; total_spend: number }>([
    ...customerJoin,
    { $group: { _id: '$c._id', full_name: { $first: '$c.full_name' }, email: { $first: '$c.email' }, order_count: { $sum: 1 }, total_spend: { $sum: '$total' } } },
    { $sort: { total_spend: -1, _id: 1 } },
    { $limit: 5 },
  ]);
  const topCustomers = collect(topCust.map((c) => ({ id: c._id, full_name: c.full_name, email: c.email ?? null, order_count: c.order_count, total_spend: c.total_spend.toFixed(2) })));

  const cities = await Order.aggregate<{ _id: string; city: string; order_count: number; revenue: number }>([
    ...customerJoin,
    { $match: { 'c.city': { $nin: [null, ''] } } },
    { $sort: { _id: 1 } },
    { $group: { _id: { $toLower: '$c.city' }, city: { $first: '$c.city' }, order_count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    { $sort: { order_count: -1, _id: 1 } },
    { $limit: 8 },
  ]);
  const emiratesData = collect(cities.map((c) => ({ city: c.city, order_count: c.order_count, revenue: c.revenue.toFixed(2) })));

  // Revenue per category: every order line of a product counts for each of its categories
  const catRows = await Order.aggregate<{ _id: number; orders: number[]; revenue: number }>([
    { $match: notCancelled },
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product_id', foreignField: '_id', as: 'p' } },
    { $unwind: '$p' },
    { $unwind: '$p.category_ids' },
    { $group: { _id: '$p.category_ids', orders: { $addToSet: '$_id' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    { $sort: { revenue: -1, _id: 1 } },
    { $limit: 6 },
  ]);
  const catNames = await Category.find({ _id: { $in: catRows.map((c) => c._id) } }).select('title').lean();
  const categoryRevenueData = collect(catRows.map((c) => ({ name: catNames.find((x) => x._id === c._id)?.title ?? '', order_count: c.orders.length, revenue: c.revenue.toFixed(2) })));

  const withCoupon = { coupon_code: { $nin: [null, ''] } };
  const coupons = await Order.aggregate<{ _id: string; coupon_code: string; uses: number; total_discount: number; revenue: number }>([
    { $match: withCoupon },
    { $sort: { _id: 1 } },
    { $group: { _id: { $toLower: '$coupon_code' }, coupon_code: { $first: '$coupon_code' }, uses: { $sum: 1 }, total_discount: { $sum: { $ifNull: ['$discount', 0] } }, revenue: { $sum: '$total' } } },
    { $sort: { uses: -1, _id: 1 } },
    { $limit: 8 },
  ]);
  const couponUsage = collect(coupons.map((c) => ({ coupon_code: c.coupon_code, uses: c.uses, total_discount: c.total_discount.toFixed(2), revenue: c.revenue.toFixed(2) })));
  const [couponAgg] = await Order.aggregate<{ n: number; d: number }>([{ $match: withCoupon }, { $group: { _id: null, n: { $sum: 1 }, d: { $sum: '$discount' } } }]);
  const totalCouponOrders = couponAgg?.n ?? 0;
  const totalDiscountGiven = couponAgg?.d ?? 0;

  // This month vs last month (subMonthNoOverflow)
  const y = now.getUTCFullYear(), m = now.getUTCMonth();
  const monthRange = (yy: number, mm: number) => ({ created_at: { $gte: new Date(Date.UTC(yy, mm, 1)), $lt: new Date(Date.UTC(yy, mm + 1, 1)) } });
  const lastY = m === 0 ? y - 1 : y, lastM = m === 0 ? 11 : m - 1;
  const [thisMonthRevenue, lastMonthRevenue, thisMonthOrders, lastMonthOrders] = await Promise.all([
    sumTotal({ ...notCancelled, ...monthRange(y, m) }),
    sumTotal({ ...notCancelled, ...monthRange(lastY, lastM) }),
    Order.countDocuments(monthRange(y, m)),
    Order.countDocuments(monthRange(lastY, lastM)),
  ]);

  const [avg] = await Order.aggregate<{ a: number }>([{ $match: notCancelled }, { $group: { _id: null, a: { $avg: '$total' } } }]);
  const avgOrderValue = avg?.a ?? 0;

  const [pendingReviews, newsletterSubscribers, oosSimple, oosVariants] = await Promise.all([
    Review.countDocuments({ status: 'pending' }),
    NewsletterSubscriber.countDocuments({ status: 'subscribed' }),
    Product.countDocuments({ 'variants.0': { $exists: false }, quantity: 0 }),
    Product.aggregate<{ n: number }>([{ $unwind: '$variants' }, { $match: { 'variants.quantity': 0 } }, { $count: 'n' }]),
  ]);
  const outOfStockCount = oosSimple + (oosVariants[0]?.n ?? 0);

  return {
    totalOrders, totalProducts, totalCustomers, totalRevenue, recentOrders, lowStockProducts, dates, weeklySales, weeklyOrders,
    conversionRate, productLabels, productQuantities, todayOrders, todayRevenue: todayRevenueRow, todayNewCustomers, pendingActionCount,
    statusDistribution, paymentMethodStats, topCustomers, emiratesData, categoryRevenueData, couponUsage, totalCouponOrders,
    totalDiscountGiven, thisMonthRevenue, lastMonthRevenue, thisMonthOrders, lastMonthOrders, avgOrderValue, pendingReviews,
    newsletterSubscribers, outOfStockCount,
  };
}

/** HomeController::getSalesData — revenue per day for the chosen range */
export async function salesData(type: string | null) {
  await connectDb();
  const notCancelled = { status: { $ne: 'cancelled' } };
  const spans: { label: string; from: Date; to: Date }[] = [];
  const now = new Date();
  if (type === 'monthly') {
    for (let i = 5; i >= 0; i--) {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1) - 1);
      spans.push({ label: new Carbon(from.getTime()).format('F Y'), from, to });
    }
  } else {
    for (let i = 6; i >= 0; i--) {
      const d = Carbon.today().subDays(i);
      spans.push({ label: d.format('d M'), from: new Date(d.t), to: new Date(d.t + 86400000 - 1) });
    }
  }
  const sales: number[] = [];
  const orders: number[] = [];
  for (const s of spans) {
    const [r] = await Order.aggregate<{ total: number; n: number }>([
      { $match: { ...notCancelled, created_at: { $gte: s.from, $lte: s.to } } },
      { $group: { _id: null, total: { $sum: '$total' }, n: { $sum: 1 } } },
    ]);
    sales.push(r?.total ?? 0);
    orders.push(r?.n ?? 0);
  }
  return { labels: spans.map((s) => s.label), sales, orders };
}
