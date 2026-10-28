import 'server-only';
import { connectDb } from '@/lib/db';
import { CompanySetting, Review } from '@/models/content';
import { Order } from '@/models/Order';
import authLayout from '@/admin-views/auth/app-layout';
import footer from '@/admin-views/Layouts/footer';
import header from '@/admin-views/Layouts/header';
import type { Admin } from './auth';
import { html, htmlResponse, type Html } from './html';
import { takePageState } from './http';
import { asset, carbonize, withView, type ViewRequest } from './php';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ViewParts { title: Html; styles: Html; content: Html; scripts: Html }
type ViewFn = (d: any) => ViewParts;

function originOf(req: Request) {
  const u = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? u.host;
  const proto = req.headers.get('x-forwarded-proto') ?? u.protocol.replace(':', '');
  return `${proto}://${host}`;
}

/** The view composer's $companySetting (first row) */
export async function loadCompanySetting() {
  await connectDb();
  const s = await CompanySetting.findOne().sort({ _id: 1 }).lean();
  return s ? settingModel(s) : null;
}

/** $companySetting with the CompanySetting model's helper methods */
export function settingModel(s: unknown) {
  const doc = carbonize(s);
  const normalizeEmails = (): Record<string, string> => {
    const emails = doc.emails;
    if (!emails || typeof emails !== 'object' || Object.keys(emails).length === 0) return {};
    const list = Array.isArray(emails) ? emails : Object.keys(emails).every((k, i) => k === String(i)) ? Object.values(emails) : null;
    if (list) {
      const out: Record<string, string> = {};
      ['default', 'support', 'sales', 'contact'].forEach((label, i) => { if (list[i]) out[label] = String(list[i]); });
      return out;
    }
    return { ...emails };
  };
  // decimal:2 casts
  for (const k of ['free_shipping_threshold', 'affiliate_default_rate']) if (doc[k] !== null && doc[k] !== undefined) doc[k] = Number(doc[k]).toFixed(2);
  doc.getEmailByKey = (key: string) => (doc.emails ?? {})[key] ?? null;
  doc.getEmailsAsAssociative = () => {
    const e = normalizeEmails();
    return Object.fromEntries(['default', 'support', 'sales', 'contact'].map((k) => [k, e[k] ?? '']));
  };
  doc.getPrimaryEmail = () => { const e = normalizeEmails(); return e.orders ?? e.contact ?? e.support ?? e.default ?? null; };
  doc.favicon_url = doc.favicon ? asset('storage/' + doc.favicon) : asset('images/default-favicon.png');
  doc.logo_url = doc.logo ? asset('storage/' + doc.logo) : asset('images/default-logo.png');
  return doc;
}

async function viewContext(req: Request, routeName: string, admin: Admin | null): Promise<ViewRequest> {
  const u = new URL(req.url);
  const origin = originOf(req);
  const state = await takePageState(origin + u.pathname + u.search);
  // url()->previous(): the Referer header, else the last page in the session
  const ref = req.headers.get('referer');
  return {
    origin: originOf(req),
    path: u.pathname,
    query: u.searchParams,
    routeName,
    old: state.oldMap,
    hasOld: state.hasOld,
    errors: state.errors,
    flash: state.flash,
    csrf: state.csrf,
    user: admin ? carbonize(admin) : null,
    companySetting: await loadCompanySetting(),
    stack: [],
    previous: ref || state.previous || origin,
  };
}

/** Render an admin page inside adminside/Layouts/main (header + page + footer) */
export async function renderAdmin(req: Request, admin: Admin, routeName: string, view: ViewFn, data: Record<string, unknown> = {}, status = 200) {
  const ctx = await viewContext(req, routeName, admin);
  await connectDb();
  const [pendingOrders, pendingReviews] = await Promise.all([
    Order.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'pending' }),
  ]);
  const body = withView(ctx, () => {
    const d = { ...data, companySetting: ctx.companySetting };
    const v = view(d);
    const h = header({ ...d, title: v.title, styles: v.styles, pendingOrders, pendingReviews });
    const f = footer({ ...d, scripts: html`${ctx.stack}${v.scripts}` });
    return html`${h.content}${v.content}${f.content}`;
  });
  return htmlResponse(body, status);
}

/** Render a guest page inside layouts/app (admin login, password reset) */
export async function renderAuth(req: Request, routeName: string, view: ViewFn, sections: { title: string; bodyClass: string; mainClass: string }, data: Record<string, unknown> = {}) {
  const ctx = await viewContext(req, routeName, null);
  const body = withView(ctx, () => {
    const d = { ...data, companySetting: ctx.companySetting };
    const v = view(d);
    return authLayout({ ...d, ...sections, styles: v.styles, content: v.content, scripts: v.scripts }).content;
  });
  return htmlResponse(body);
}
