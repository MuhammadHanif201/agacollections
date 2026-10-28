// Port of resources/views/adminside/index.blade.php
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { html, raw, bladeJson } from '@/lib/admin/html';
import { errors as errorBag, route, asset, now, today, number_format, count, strtoupper, ucfirst, substr, array_values, array_sum, round, abs, max, min, optional, Str, entries, foreach, Customer } from '@/lib/admin/php';

export default function view(d: any) {
  const errors = errorBag();
  const companySetting = d.companySetting ?? null;
  let { lastMonthRevenue, thisMonthRevenue, todayRevenue, todayOrders, todayNewCustomers, pendingActionCount, lastMonthOrders, thisMonthOrders, totalRevenue, avgOrderValue, totalOrders, totalCustomers, outOfStockCount, totalProducts, pendingReviews, statusDistribution, paymentMethodStats, pmColors, pmTotal, lowStockProducts, newsletterSubscribers, recentOrders, minQty, isCritical, productLabels, maxQty, productQuantities, topCustomers, emiratesData, maxCity, categoryRevenueData, maxCat, couponUsage, totalCouponOrders, totalDiscountGiven, dates, weeklySales, weeklyOrders } = d;
  let mTrend = lastMonthRevenue > 0
                      ? round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100, 1)
                      : (thisMonthRevenue > 0 ? 100 : 0);
  let revTrend = lastMonthRevenue > 0
                      ? round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100, 1)
                      : (thisMonthRevenue > 0 ? 100 : 0);
  let ordTrend = lastMonthOrders > 0
                      ? round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100, 1)
                      : (thisMonthOrders > 0 ? 100 : 0);
  let statusColors: Record<string, any> = {'Pending':'#F59E0B','Processing':'#111111','Completed':'#10B981','Cancelled':'#EF4444'};
  let statusTotal = array_sum(statusDistribution);
  return {
    title: html`<title>Dashboard — ${optional(companySetting)?.name ?? 'AGA Collections'} Admin</title>
<meta name="description" content="Overview of sales, orders, revenue, and store activity for ${optional(companySetting)?.name ?? 'AGA Collections'} — premium Pakistani clothing brand.">
<meta name="keywords" content="admin dashboard, aga collections admin, ecommerce dashboard, sales overview, order summary, pakistani clothing store">
`,
    styles: html`<style>
/* ── Status badges ── */
.order-badge{display:inline-block;padding:.25em .65em;border-radius:.375rem;font-size:.72rem;font-weight:600;line-height:1;}
.badge-pending   {background:#FFF3CD;color:#856404;}
.badge-processing{background:#CFE2FF;color:#084298;}
.badge-completed {background:#D1E7DD;color:#0A3622;}
.badge-cancelled {background:#F8D7DA;color:#842029;}

/* ── Today strip ── */
.today-strip{
    background:linear-gradient(135deg,#111111 0%,#1E3A5F 100%);
    border-radius:.6rem;padding:1.1rem 1.5rem;
    border:1px solid rgba(17,17,17,.25);
    position:relative;overflow:hidden;margin-bottom:1.5rem;
}
.today-strip::after{
    content:'';position:absolute;right:-40px;top:-40px;
    width:180px;height:180px;border-radius:50%;
    background:radial-gradient(circle,rgba(17,17,17,.18),transparent 70%);
    pointer-events:none;
}
.today-item{position:relative;z-index:1;}
.today-lbl{font-size:.65rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(163,163,163,.7);margin-bottom:.15rem;}
.today-val{font-size:1.25rem;font-weight:700;color:#F4F4F4;line-height:1.2;}
.today-sub{font-size:.68rem;color:rgba(163,163,163,.6);margin-top:.1rem;}
.today-divider{width:1px;height:34px;background:rgba(255,255,255,.12);align-self:center;}

/* ── KPI Cards ── */
.kpi-card{
    background:#fff;border-radius:.55rem;padding:1.05rem 1.15rem;
    border:1px solid #E5E5E5;height:100%;
    transition:box-shadow .15s,border-color .15s;
    text-decoration:none!important;display:block;color:inherit!important;
}
.kpi-card:hover{box-shadow:0 4px 18px rgba(0,0,0,.08);border-color:#D4D4D4;}
.kpi-icon{
    width:40px;height:40px;border-radius:.45rem;
    display:flex;align-items:center;justify-content:center;
    font-size:1rem;flex-shrink:0;
}
.kpi-val{font-size:1.45rem;font-weight:700;line-height:1.2;color:#1C1C1C;}
.kpi-lbl{font-size:.68rem;color:#737373;font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
.kpi-sub{font-size:.67rem;color:#A3A3A3;margin-top:.2rem;}
.kpi-trend{font-size:.7rem;font-weight:700;white-space:nowrap;}
.kpi-trend.up  {color:#10B981;}
.kpi-trend.down{color:#EF4444;}
.kpi-trend.flat{color:#A3A3A3;}

/* ── Progress bars ── */
.prog-track{height:5px;background:#e9ecef;border-radius:3px;overflow:hidden;flex:1;}
.prog-fill{height:100%;border-radius:3px;}

/* ── Stock items ── */
.stock-item{display:flex;align-items:center;gap:.65rem;padding:.5rem .25rem;border-bottom:1px solid rgba(0,0,0,.05);}
.stock-item:last-child{border-bottom:none;}
.stock-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}

/* ── Customer avatar ── */
.cust-av{
    width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,#111111,#2A2A2A);
    color:#fff;font-size:.66rem;font-weight:700;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
}

/* ── Quick action buttons ── */
.qa-btn{
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:.3rem;padding:.75rem .3rem;border-radius:.45rem;
    background:#FAFAFA;border:1px solid #E5E5E5;
    text-decoration:none!important;color:#374151;
    transition:all .15s;font-size:.68rem;font-weight:600;
    text-align:center;line-height:1.25;min-height:62px;
}
.qa-btn:hover{background:#F3F0E9;border-color:#111111;color:#2A2A2A;}
.qa-btn i{font-size:1.05rem;display:block;}

/* ── Alert tiles ── */
.alert-tile{
    display:flex;align-items:center;gap:.75rem;
    padding:.65rem .85rem;border-radius:.45rem;
    border:1px solid #E5E5E5;background:#fff;
    margin-bottom:.5rem;transition:border-color .15s;
}
.alert-tile:last-child{margin-bottom:0;}
.alert-tile.warn{border-color:#FCD34D;background:#FFFDF0;}
.alert-tile.danger{border-color:#FCA5A5;background:#FFF5F5;}
.at-icon{
    width:34px;height:34px;border-radius:.4rem;
    display:flex;align-items:center;justify-content:center;
    font-size:.88rem;flex-shrink:0;
}
.at-title{font-size:.8rem;font-weight:600;color:#1C1C1C;line-height:1.2;}
.at-sub{font-size:.69rem;color:#737373;}
</style>
`,
    content: html`<div class="content-wrapper">

    
    <section class="content-header">
        <div class="container-fluid">
            <div class="row align-items-center mb-2">
                <div class="col-sm-6">
                    <h1 class="m-0">
                        <i class="fas fa-gauge-high me-2" style="color:var(--dc-blue,#111111);font-size:1rem;"></i>
                        Dashboard
                    </h1>
                </div>
                <div class="col-sm-6">
                    <ol class="breadcrumb float-sm-end mb-0">
                        <li class="breadcrumb-item active">Dashboard</li>
                    </ol>
                </div>
            </div>
        </div>
    </section>

    <section class="content">
        <div class="container-fluid">

            
                        <div class="today-strip">
                <div class="d-flex align-items-center flex-wrap gap-4">

                    <div class="today-item">
                        <div class="today-lbl">Today's Revenue</div>
                        <div class="today-val">PKR ${number_format(todayRevenue)}</div>
                        <div class="today-sub">Non-cancelled orders</div>
                    </div>
                    <div class="today-divider d-none d-md-block"></div>

                    <div class="today-item">
                        <div class="today-lbl">Today's Orders</div>
                        <div class="today-val">${todayOrders}</div>
                        <div class="today-sub">Placed today</div>
                    </div>
                    <div class="today-divider d-none d-md-block"></div>

                    <div class="today-item">
                        <div class="today-lbl">New Customers</div>
                        <div class="today-val">${todayNewCustomers}</div>
                        <div class="today-sub">Registered today</div>
                    </div>
                    <div class="today-divider d-none d-md-block"></div>

                    <div class="today-item">
                        <div class="today-lbl">Pending Orders</div>
                        <div class="today-val" style="${pendingActionCount > 0 ? 'color:#FCD34D' : ''}">
                            ${pendingActionCount}
                        </div>
                        <div class="today-sub">Awaiting action</div>
                    </div>
                    <div class="today-divider d-none d-md-block"></div>

                    <div class="today-item">
                        <div class="today-lbl">${now()?.format('M Y')} Revenue</div>
                        <div class="today-val">PKR ${number_format(thisMonthRevenue)}</div>
                        <div class="today-sub">
                            ${(mTrend > 0) ? html`                                <span style="color:#4ADE80;">▲ ${mTrend}%</span> vs last month
                            ` : (mTrend < 0) ? html`                                <span style="color:#FCA5A5;">▼ ${abs(mTrend)}%</span> vs last month
                            ` : html`                                Same as last month
                            `}                        </div>
                    </div>

                    <div class="ms-auto d-none d-lg-block" style="position:relative;z-index:1;">
                        <a href="${route('admin.orders.index')}" class="btn btn-sm btn-outline-light" style="border-radius:8px;font-size:.8rem;">
                            <i class="fas fa-arrow-right me-1"></i> View Orders
                        </a>
                    </div>

                </div>
            </div>

            
                        <div class="row g-3 mb-4">

                
                <div class="col-xl-2 col-lg-4 col-md-6">
                    <a href="${route('admin.orders.index')}" class="kpi-card">
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="kpi-icon" style="background:#F3F0E9;">
                                <i class="fas fa-wallet" style="color:#111111;"></i>
                            </div>
                        </div>
                        <div class="kpi-val" style="font-size:1.2rem;">${number_format(totalRevenue)}</div>
                        <div class="kpi-lbl">Total Revenue (PKR)</div>
                        <div class="kpi-sub">Completed orders only</div>
                    </a>
                </div>

                
                <div class="col-xl-2 col-lg-4 col-md-6">
                    <a href="${route('admin.orders.index')}" class="kpi-card">
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="kpi-icon" style="background:#F0FDF4;">
                                <i class="fas fa-calendar-check" style="color:#10B981;"></i>
                            </div>
                            <span class="kpi-trend ${revTrend >= 0 ? 'up' : 'down'}">
                                ${revTrend >= 0 ? '▲' : '▼'} ${abs(revTrend)}%
                            </span>
                        </div>
                        <div class="kpi-val" style="font-size:1.2rem;">${number_format(thisMonthRevenue)}</div>
                        <div class="kpi-lbl">${now()?.format('M')} Revenue (PKR)</div>
                        <div class="kpi-sub">Last: ${number_format(lastMonthRevenue)}</div>
                    </a>
                </div>

                
                <div class="col-xl-2 col-lg-4 col-md-6">
                    <div class="kpi-card" style="cursor:default;">
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="kpi-icon" style="background:#FFF7ED;">
                                <i class="fas fa-receipt" style="color:#F97316;"></i>
                            </div>
                        </div>
                        <div class="kpi-val" style="font-size:1.2rem;">${number_format(avgOrderValue)}</div>
                        <div class="kpi-lbl">Avg Order (PKR)</div>
                        <div class="kpi-sub">Non-cancelled orders</div>
                    </div>
                </div>

                
                <div class="col-xl-2 col-lg-4 col-md-6">
                    <a href="${route('admin.orders.index')}" class="kpi-card">
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="kpi-icon" style="background:#F0FDF4;">
                                <i class="fas fa-bag-shopping" style="color:#10B981;"></i>
                            </div>
                            <span class="kpi-trend ${ordTrend >= 0 ? 'up' : 'down'}">
                                ${ordTrend >= 0 ? '▲' : '▼'} ${abs(ordTrend)}%
                            </span>
                        </div>
                        <div class="kpi-val">${number_format(totalOrders)}</div>
                        <div class="kpi-lbl">Total Orders</div>
                        <div class="kpi-sub">${todayOrders} today &nbsp;·&nbsp; ${thisMonthOrders} this month</div>
                    </a>
                </div>

                
                <div class="col-xl-2 col-lg-4 col-md-6">
                    <a href="${route('admin.customers.index')}" class="kpi-card">
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="kpi-icon" style="background:#FFF7ED;">
                                <i class="fas fa-users" style="color:#F97316;"></i>
                            </div>
                        </div>
                        <div class="kpi-val">${number_format(totalCustomers)}</div>
                        <div class="kpi-lbl">Total Customers</div>
                        <div class="kpi-sub">${todayNewCustomers} new today</div>
                    </a>
                </div>

                
                <div class="col-xl-2 col-lg-4 col-md-6">
                    <a href="${route('admin.products.index')}" class="kpi-card">
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="kpi-icon" style="background:#F3F0E9;">
                                <i class="fas fa-shirt" style="color:#111111;"></i>
                            </div>
                            ${(outOfStockCount > 0) ? html`                                <span class="badge bg-danger" style="font-size:.6rem;padding:.2em .5em;">${outOfStockCount} OOS</span>
                            ` : ''}                        </div>
                        <div class="kpi-val">${number_format(totalProducts)}</div>
                        <div class="kpi-lbl">Products</div>
                        <div class="kpi-sub">
                            ${(outOfStockCount > 0) ? html`                                <span style="color:#EF4444;">${outOfStockCount} out of stock</span>
                            ` : html`                                All stocked
                            `}                        </div>
                    </a>
                </div>

            </div>

            
            <div class="row g-3 mb-4">

                <div class="col-lg-8">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-chart-line me-2"></i>Sales Overview</h3>
                            <div class="card-tools">
                                <div class="btn-group btn-group-sm">
                                    <button type="button" class="btn btn-primary chart-toggle active" data-type="weekly">7 Days</button>
                                    <button type="button" class="btn btn-default chart-toggle" data-type="monthly">6 Months</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div style="position:relative;height:250px;">
                                <canvas id="salesChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-bolt me-2 text-warning"></i>Quick Actions</h3>
                        </div>
                        <div class="card-body">
                            <div class="row g-2">
                                <div class="col-4">
                                    <a href="${route('admin.products.create')}" class="qa-btn">
                                        <i class="fas fa-plus-circle text-primary"></i>
                                        New Product
                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.orders.index')}" class="qa-btn">
                                        <i class="fas fa-bag-shopping text-success"></i>
                                        Orders
                                        ${(pendingActionCount > 0) ? html`                                            <span class="badge bg-warning text-dark" style="font-size:.58rem;">${pendingActionCount}</span>
                                        ` : ''}                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.customers.index')}" class="qa-btn">
                                        <i class="fas fa-users" style="color:#F97316;"></i>
                                        Customers
                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.products.index')}" class="qa-btn">
                                        <i class="fas fa-shirt text-primary"></i>
                                        Products
                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.reviews.index')}" class="qa-btn">
                                        <i class="fas fa-star text-warning"></i>
                                        Reviews
                                        ${(pendingReviews > 0) ? html`                                            <span class="badge bg-danger" style="font-size:.58rem;">${pendingReviews}</span>
                                        ` : ''}                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.coupon.index')}" class="qa-btn">
                                        <i class="fas fa-ticket text-danger"></i>
                                        Coupons
                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.category.index')}" class="qa-btn">
                                        <i class="fas fa-layer-group" style="color:#8B5CF6;"></i>
                                        Categories
                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.newsletter.subscribers.index')}" class="qa-btn">
                                        <i class="fas fa-envelope" style="color:#06B6D4;"></i>
                                        Newsletter
                                    </a>
                                </div>
                                <div class="col-4">
                                    <a href="${route('admin.company-settings.edit')}" class="qa-btn">
                                        <i class="fas fa-gear text-secondary"></i>
                                        Settings
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            
            <div class="row g-3 mb-4">

                
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-chart-pie me-2"></i>Order Status</h3>
                        </div>
                        <div class="card-body">
                            <div style="position:relative;height:155px;">
                                <canvas id="statusChart"></canvas>
                            </div>
                            <div class="mt-3">
                                                                ${foreach(entries(statusDistribution), ([lbl, cnt], loop) => html`                                <div class="d-flex align-items-center justify-content-between mb-2">
                                    <div class="d-flex align-items-center gap-2">
                                        <span style="width:9px;height:9px;border-radius:2px;background:${statusColors?.[lbl] ?? '#A3A3A3'};display:inline-block;flex-shrink:0;"></span>
                                        <span style="font-size:.8rem;">${lbl}</span>
                                    </div>
                                    <div>
                                        <strong style="font-size:.8rem;">${cnt}</strong>
                                        <span class="text-muted" style="font-size:.7rem;"> (${statusTotal > 0 ? round(cnt/statusTotal*100) : 0}%)</span>
                                    </div>
                                </div>
                                `)}                            </div>
                        </div>
                    </div>
                </div>

                
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-credit-card me-2"></i>Payment Methods</h3>
                        </div>
                        <div class="card-body">
                            ${(paymentMethodStats?.isEmpty()) ? html`                                <div class="text-center py-5 text-muted">
                                    <i class="fas fa-credit-card mb-2" style="font-size:1.6rem;display:block;opacity:.35;"></i>
                                    No payment data yet
                                </div>
                            ` : (() => { let pmColors = ['#111111','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4'];
let pmTotal = paymentMethodStats?.sum('count');
 return html`                                                                <div style="position:relative;height:155px;">
                                    <canvas id="paymentChart"></canvas>
                                </div>
                                <div class="mt-3">
                                    ${foreach(entries(paymentMethodStats), ([i, pm], loop) => html`                                    <div class="d-flex align-items-center justify-content-between mb-2">
                                        <div class="d-flex align-items-center gap-2">
                                            <span style="width:9px;height:9px;border-radius:2px;background:${pmColors?.[i % count(pmColors)]};display:inline-block;flex-shrink:0;"></span>
                                            <span style="font-size:.8rem;">${pm?.['method']}</span>
                                        </div>
                                        <div>
                                            <strong style="font-size:.8rem;">${pm?.['count']}</strong>
                                            <span class="text-muted" style="font-size:.7rem;"> · PKR ${number_format(pm?.['revenue'])}</span>
                                        </div>
                                    </div>
                                    `)}                                </div>
                            `; })()}                        </div>
                    </div>
                </div>

                
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-bell me-2"></i>Alerts &amp; Info</h3>
                        </div>
                        <div class="card-body p-3">

                            <div class="alert-tile ${pendingActionCount > 0 ? 'warn' : ''}">
                                <div class="at-icon" style="background:#FFF7ED;">
                                    <i class="fas fa-clock" style="color:#F97316;"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="at-title">Pending Orders</div>
                                    <div class="at-sub">Require processing</div>
                                </div>
                                <a href="${route('admin.orders.index')}"
                                   class="badge ${pendingActionCount > 0 ? 'bg-warning text-dark' : 'bg-secondary'}"
                                   style="font-size:.78rem;text-decoration:none;min-width:26px;text-align:center;">
                                    ${pendingActionCount}
                                </a>
                            </div>

                            <div class="alert-tile ${pendingReviews > 0 ? 'warn' : ''}">
                                <div class="at-icon" style="background:#FFFBEB;">
                                    <i class="fas fa-star-half-stroke" style="color:#F59E0B;"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="at-title">Pending Reviews</div>
                                    <div class="at-sub">Awaiting moderation</div>
                                </div>
                                <a href="${route('admin.reviews.index')}"
                                   class="badge ${pendingReviews > 0 ? 'bg-warning text-dark' : 'bg-secondary'}"
                                   style="font-size:.78rem;text-decoration:none;min-width:26px;text-align:center;">
                                    ${pendingReviews}
                                </a>
                            </div>

                            <div class="alert-tile ${lowStockProducts?.count() > 0 ? 'danger' : ''}">
                                <div class="at-icon" style="background:#FEF2F2;">
                                    <i class="fas fa-triangle-exclamation" style="color:#EF4444;"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="at-title">Low Stock Items</div>
                                    <div class="at-sub">Quantity ≤ 3</div>
                                </div>
                                <a href="${route('admin.products.index')}"
                                   class="badge ${lowStockProducts?.count() > 0 ? 'bg-danger' : 'bg-secondary'}"
                                   style="font-size:.78rem;text-decoration:none;min-width:26px;text-align:center;">
                                    ${lowStockProducts?.count()}
                                </a>
                            </div>

                            <div class="alert-tile ${outOfStockCount > 0 ? 'danger' : ''}">
                                <div class="at-icon" style="background:#FEF2F2;">
                                    <i class="fas fa-box-open" style="color:#EF4444;"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="at-title">Out of Stock</div>
                                    <div class="at-sub">Products / variants</div>
                                </div>
                                <a href="${route('admin.products.index')}"
                                   class="badge ${outOfStockCount > 0 ? 'bg-danger' : 'bg-success'}"
                                   style="font-size:.78rem;text-decoration:none;min-width:26px;text-align:center;">
                                    ${outOfStockCount}
                                </a>
                            </div>

                            <div class="alert-tile">
                                <div class="at-icon" style="background:#F3F0E9;">
                                    <i class="fas fa-envelope" style="color:#111111;"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <div class="at-title">Newsletter</div>
                                    <div class="at-sub">Active subscribers</div>
                                </div>
                                <a href="${route('admin.newsletter.subscribers.index')}"
                                   class="badge bg-primary"
                                   style="font-size:.78rem;text-decoration:none;min-width:26px;text-align:center;">
                                    ${newsletterSubscribers}
                                </a>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            
            <div class="row g-3 mb-4">

                <div class="col-lg-7">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-clock-rotate-left me-2"></i>Recent Orders</h3>
                            <div class="card-tools">
                                <a href="${route('admin.orders.index')}" class="btn btn-tool btn-sm btn-primary"
                                   style="font-size:.75rem;padding:.2rem .65rem;border-radius:6px;">
                                    View All
                                </a>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;padding:.6rem 1rem;">#</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Customer</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Items</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Total</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Status</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${count(recentOrders) ? foreach(recentOrders, (order, loop) => html`                                        <tr>
                                            <td style="padding:.6rem 1rem;">
                                                <a href="${route('admin.orders.show', order?.id)}"
                                                   class="fw-bold text-primary text-decoration-none"
                                                   style="font-size:.82rem;">
                                                    #${order?.id}
                                                </a>
                                            </td>
                                            <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.82rem;">
                                                ${optional(order?.customer)?.full_name ?? 'Guest'}
                                            </td>
                                            <td style="font-size:.78rem;color:#737373;">
                                                ${order?.items?.count()}
                                            </td>
                                            <td class="fw-semibold" style="font-size:.82rem;">
                                                PKR ${number_format(order?.total)}
                                            </td>
                                            <td>
                                                <span class="order-badge badge-${order?.status}">
                                                    ${ucfirst(order?.status)}
                                                </span>
                                            </td>
                                            <td class="text-muted" style="font-size:.75rem;white-space:nowrap;">
                                                ${order?.created_at?.format('d M, H:i')}
                                            </td>
                                        </tr>
                                        `) : html`                                        <tr>
                                            <td colspan="6" class="text-center text-muted py-4">No orders yet</td>
                                        </tr>
                                        `}                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-5">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-triangle-exclamation me-2 text-warning"></i>Low Stock Alert
                                ${(lowStockProducts?.count() > 0) ? html`                                    <span class="badge bg-danger ms-1" style="font-size:.68rem;">${lowStockProducts?.count()}</span>
                                ` : ''}                            </h3>
                            <div class="card-tools">
                                <a href="${route('admin.products.index')}" class="btn btn-tool btn-sm btn-primary"
                                   style="font-size:.75rem;padding:.2rem .65rem;border-radius:6px;">
                                    Manage
                                </a>
                            </div>
                        </div>
                        <div class="card-body p-0" style="max-height:305px;overflow-y:auto;">
                            ${count(lowStockProducts) ? foreach(lowStockProducts, (p, loop) => { let minQty = p?.variants?.count() ? p?.variants?.min('quantity') : p?.quantity;
let isCritical = minQty <= 0;
 return html`                                                                <div class="stock-item px-3">
                                    <span class="stock-dot" style="background:${isCritical ? '#EF4444' : '#F59E0B'};"></span>
                                    <span class="flex-grow-1 text-truncate" style="font-size:.82rem;font-weight:500;"
                                          title="${p?.name}">
                                        ${Str.limit(p?.name, 30)}
                                    </span>
                                    ${(p?.variants?.count()) ? html`                                        ${foreach(p?.variants, (v, loop) => html`                                            <span class="badge ${v?.quantity <= 0 ? 'bg-danger' : 'bg-warning text-dark'}"
                                                  style="font-size:.65rem;">${v?.quantity}</span>
                                        `)}                                    ` : html`                                        <span class="badge ${isCritical ? 'bg-danger' : 'bg-warning text-dark'}"
                                              style="font-size:.68rem;">${minQty}</span>
                                    `}                                    <a href="${route('admin.products.edit', p?.id)}"
                                       class="btn btn-xs btn-outline-primary ms-1"
                                       style="font-size:.68rem;padding:.15rem .4rem;border-radius:4px;">
                                        Edit
                                    </a>
                                </div>
                            `; }) : html`                                <div class="text-center py-5 text-muted">
                                    <i class="fas fa-circle-check text-success mb-2" style="font-size:1.5rem;display:block;"></i>
                                    All products are well stocked
                                </div>
                            `}                        </div>
                    </div>
                </div>

            </div>

            
            <div class="row g-3 mb-4">

                <div class="col-lg-5">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-fire me-2 text-warning"></i>Top Products
                                <small class="text-muted ms-1">(last 7 days)</small>
                            </h3>
                        </div>
                        <div class="card-body">
                            ${(productLabels?.isEmpty()) ? html`                                <p class="text-center text-muted py-4">No sales data yet</p>
                            ` : (() => { let maxQty = productQuantities?.max()  ||  1;
 return html`                                                                ${foreach(entries(productLabels), ([i, label], loop) => html`                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span style="font-size:.8rem;font-weight:500;">${label}</span>
                                        <span class="badge bg-primary" style="font-size:.68rem;">${productQuantities?.[i]} sold</span>
                                    </div>
                                    <div class="prog-track">
                                        <div class="prog-fill bg-primary"
                                             style="width:${round(productQuantities?.[i]/maxQty*100)}%;"></div>
                                    </div>
                                </div>
                                `)}                            `; })()}                        </div>
                    </div>
                </div>

                <div class="col-lg-7">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-crown me-2 text-warning"></i>Top Customers by Spend
                            </h3>
                            <div class="card-tools">
                                <a href="${route('admin.customers.index')}" class="btn btn-tool btn-sm btn-primary"
                                   style="font-size:.75rem;padding:.2rem .65rem;border-radius:6px;">
                                    All Customers
                                </a>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            ${count(topCustomers) ? foreach(topCustomers, (c, loop) => html`                            <div class="d-flex align-items-center gap-3 px-3 py-2 border-bottom">
                                <div class="cust-av">${strtoupper(substr(c?.full_name, 0, 1))}</div>
                                <div class="flex-grow-1" style="min-width:0;">
                                    <div style="font-size:.83rem;font-weight:600;" class="text-truncate">
                                        ${Str.limit(c?.full_name, 22)}
                                    </div>
                                    <div class="text-muted" style="font-size:.72rem;">
                                        ${Str.limit(c?.email ?? (c?.phone ?? '—'), 28)}
                                    </div>
                                </div>
                                <div class="text-end flex-shrink-0">
                                    <div style="font-size:.83rem;font-weight:700;" class="text-primary">
                                        PKR ${number_format(c?.total_spend)}
                                    </div>
                                    <div class="text-muted" style="font-size:.7rem;">${c?.order_count} orders</div>
                                </div>
                            </div>
                            `) : html`                            <p class="text-center text-muted py-4">No orders yet</p>
                            `}                        </div>
                    </div>
                </div>

            </div>

            
            <div class="row g-3 mb-4">

                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-location-dot me-2"></i>Orders by City</h3>
                        </div>
                        <div class="card-body">
                            ${(emiratesData?.isEmpty()) ? html`                                <p class="text-center text-muted py-3">No city data available</p>
                            ` : (() => { let maxCity = emiratesData?.max('order_count')  ||  1;
 return html`                                                                ${foreach(emiratesData, (city, loop) => html`                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span style="font-size:.8rem;font-weight:500;">${city?.city}</span>
                                        <span style="font-size:.76rem;" class="text-muted">
                                            <strong class="text-dark">${city?.order_count}</strong> orders
                                            &nbsp;·&nbsp; PKR ${number_format(city?.revenue)}
                                        </span>
                                    </div>
                                    <div class="prog-track">
                                        <div class="prog-fill" style="width:${round(city?.order_count/maxCity*100)}%;background:#8B5CF6;"></div>
                                    </div>
                                </div>
                                `)}                            `; })()}                        </div>
                    </div>
                </div>

                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-layer-group me-2"></i>Revenue by Category</h3>
                        </div>
                        <div class="card-body">
                            ${(categoryRevenueData?.isEmpty()) ? html`                                <p class="text-center text-muted py-3">No category data available</p>
                            ` : (() => { let maxCat = categoryRevenueData?.max('revenue')  ||  1;
 return html`                                                                ${foreach(categoryRevenueData, (cat, loop) => html`                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span style="font-size:.8rem;font-weight:500;">${cat?.name}</span>
                                        <span style="font-size:.76rem;" class="text-muted">
                                            <strong class="text-dark">PKR ${number_format(cat?.revenue)}</strong>
                                            &nbsp;·&nbsp; ${cat?.order_count} orders
                                        </span>
                                    </div>
                                    <div class="prog-track">
                                        <div class="prog-fill bg-success" style="width:${round(cat?.revenue/maxCat*100)}%;"></div>
                                    </div>
                                </div>
                                `)}                            `; })()}                        </div>
                    </div>
                </div>

            </div>

            
            ${(couponUsage?.count() > 0) ? html`            <div class="row g-3 mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><i class="fas fa-ticket me-2"></i>Coupon Usage</h3>
                            <div class="card-tools">
                                <span class="text-muted" style="font-size:.8rem;">
                                    ${totalCouponOrders} orders used coupons &nbsp;·&nbsp;
                                    <strong class="text-danger">PKR ${number_format(totalDiscountGiven)}</strong> total discounts given
                                </span>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;padding:.6rem 1rem;">Code</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Uses</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Revenue</th>
                                            <th style="font-size:.7rem;color:#6B7280;text-transform:uppercase;">Discount Given</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${foreach(couponUsage, (coupon, loop) => html`                                        <tr>
                                            <td style="padding:.6rem 1rem;">
                                                <code class="bg-light px-2 py-1 rounded"
                                                      style="font-size:.8rem;color:#2A2A2A;">${coupon?.coupon_code}</code>
                                            </td>
                                            <td><span class="badge bg-primary">${coupon?.uses}</span></td>
                                            <td class="fw-semibold" style="font-size:.82rem;">
                                                PKR ${number_format(coupon?.revenue)}
                                            </td>
                                            <td class="fw-semibold text-danger" style="font-size:.82rem;">
                                                − PKR ${number_format(coupon?.total_discount)}
                                            </td>
                                        </tr>
                                        `)}                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
    </section>
</div>
`,
    scripts: html`<script src="${asset('adminSide/plugins/chart.js/Chart.min.js')}"></script>
<script>
/* Chart.js v2.9.3 — all options use v2 API */
Chart.defaults.global.defaultFontFamily = "'Manrope','Inter',system-ui,sans-serif";

// ── Sales Chart ──────────────────────────────────────────────────────
var salesChart;
function buildSalesChart(labels, sales, orders) {
    var canvas = document.getElementById('salesChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 250);
    grad.addColorStop(0, 'rgba(17,17,17,.22)');
    grad.addColorStop(1, 'rgba(17,17,17,0)');
    if (salesChart) { salesChart.destroy(); }
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (PKR)',
                yAxisID: 'y-revenue',
                data: sales,
                fill: true,
                backgroundColor: grad,
                borderColor: '#111111',
                borderWidth: 2.5,
                lineTension: 0.4,
                pointBackgroundColor: '#111111',
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: 'Orders',
                yAxisID: 'y-orders',
                data: orders,
                fill: false,
                borderColor: '#10B981',
                borderWidth: 2,
                lineTension: 0.4,
                borderDash: [5, 3],
                pointBackgroundColor: '#10B981',
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            hover: { mode: 'index', intersect: false },
            legend: {
                position: 'top',
                labels: { fontSize: 11, boxWidth: 12, usePointStyle: true }
            },
            tooltips: { mode: 'index', intersect: false },
            scales: {
                xAxes: [{
                    gridLines: { display: false },
                    ticks: { fontSize: 11, fontColor: '#A3A3A3' }
                }],
                yAxes: [{
                    id: 'y-revenue',
                    position: 'left',
                    gridLines: { color: 'rgba(226,232,240,.6)' },
                    ticks: {
                        fontSize: 10,
                        fontColor: '#A3A3A3',
                        callback: function(v) { return '\\u20A8' + v.toLocaleString(); }
                    }
                }, {
                    id: 'y-orders',
                    position: 'right',
                    gridLines: { display: false },
                    ticks: { fontSize: 10, fontColor: '#A3A3A3', beginAtZero: true }
                }]
            }
        }
    });
}

buildSalesChart(
    ${bladeJson(dates?.values())},
    ${bladeJson(weeklySales?.values())},
    ${bladeJson(weeklyOrders?.values())});

var loadingChart = false;
document.querySelectorAll('.chart-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
        if (loadingChart) return;
        document.querySelectorAll('.chart-toggle').forEach(function(b) {
            b.classList.remove('btn-primary'); b.classList.add('btn-default'); b.classList.remove('active');
        });
        this.classList.add('btn-primary', 'active'); this.classList.remove('btn-default');
        loadingChart = true;
        var type = this.dataset.type;
        fetch("${route('admin.dashboard.salesData')}?type=" + type)
            .then(function(r) { return r.json(); })
            .then(function(d) { buildSalesChart(d.labels, d.sales, d.orders); loadingChart = false; })
            .catch(function() { loadingChart = false; });
    });
});

// ── Order Status Donut ───────────────────────────────────────────────
(function() {
    var el = document.getElementById('statusChart');
    if (!el) return;
    new Chart(el.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Processing', 'Completed', 'Cancelled'],
            datasets: [{
                data: ${bladeJson(array_values(statusDistribution))},
                backgroundColor: ['#F59E0B', '#111111', '#10B981', '#EF4444'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutoutPercentage: 70,
            legend: { display: false },
            tooltips: {
                callbacks: {
                    label: function(item, data) {
                        return ' ' + data.labels[item.index] + ': ' + data.datasets[0].data[item.index];
                    }
                }
            }
        }
    });
})();

// ── Payment Methods Donut ────────────────────────────────────────────
${(paymentMethodStats?.isNotEmpty()) ? html`(function() {
    var el = document.getElementById('paymentChart');
    if (!el) return;
    new Chart(el.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ${bladeJson(paymentMethodStats?.pluck('method')?.values())},
            datasets: [{
                data: ${bladeJson(paymentMethodStats?.pluck('count')?.values())},
                backgroundColor: ['#111111', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutoutPercentage: 70,
            legend: { display: false },
            tooltips: {
                callbacks: {
                    label: function(item, data) {
                        return ' ' + data.labels[item.index] + ': ' + data.datasets[0].data[item.index] + ' orders';
                    }
                }
            }
        }
    });
})();
` : ''}</script>
`,
  };
}
