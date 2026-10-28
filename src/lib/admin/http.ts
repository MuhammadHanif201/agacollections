import 'server-only';
import { randomBytes } from 'node:crypto';
import { connectDb } from '@/lib/db';
import { isSameOrigin } from '@/lib/request';
import { getSession, getWritableSession, saveSession, updateSessionData } from '@/lib/session';
import { getCurrentAdmin, type Admin } from './auth';
import { flattenOld, readForm, type FormInput } from './form';
import { htmlResponse, type Html } from './html';
import type { Errors } from './validate';

export interface AdminFlash { success?: string; error?: string; [k: string]: string | undefined }
interface AdminBag {
  _aflash?: AdminFlash;
  _aform?: { old?: Record<string, string>; errors?: Errors };
  _token?: string;
  _intended?: string;
  _previous?: string; // Laravel's _previous.url
}

/** What a page needs from the previous request: flash messages, old() input and $errors */
export interface PageState {
  flash: AdminFlash;
  old: (key: string, fallback?: string | number | null) => string;
  hasOld: boolean;
  oldMap: Record<string, string>;
  errors: Errors;
  error: (key: string) => string | null;
  csrf: string;
  previous?: string;
}

export async function takePageState(currentUrl?: string): Promise<PageState> {
  const s = await getSession();
  const bag = s.data as AdminBag;
  const previous = bag._previous;
  const flash = bag._aflash ?? {};
  const form = bag._aform ?? {};
  let csrf = bag._token;
  if (s.id && (bag._aflash || bag._aform || !csrf || (currentUrl && currentUrl !== previous))) {
    csrf ??= randomBytes(30).toString('base64url').slice(0, 40);
    await updateSessionData(s.id, { _token: csrf, ...(currentUrl ? { _previous: currentUrl } : {}) }, ['_aflash', '_aform']);
  }
  const old = form.old ?? {};
  const errors = form.errors ?? {};
  return {
    flash,
    old: (key, fallback = '') => (key in old ? old[key] : fallback === null || fallback === undefined ? '' : String(fallback)),
    hasOld: Object.keys(old).length > 0,
    oldMap: old,
    errors,
    error: (key) => errors[key]?.[0] ?? null,
    csrf: csrf ?? '',
    previous,
  };
}

/** session()->flash() for the next page */
export async function flash(values: AdminFlash) {
  const s = await getWritableSession();
  const bag = s.data as AdminBag;
  bag._aflash = { ...(bag._aflash ?? {}), ...values };
  await saveSession(s);
}

const SECRET_FIELDS = new Set(['password', 'password_confirmation', 'current_password', 'new_password', 'new_password_confirmation']);

/** ->withErrors($errors)->withInput() */
export async function putErrors(errors: Errors, input: FormInput | null) {
  const s = await getWritableSession();
  const bag = s.data as AdminBag;
  const old = input ? Object.fromEntries(Object.entries(flattenOld(input)).filter(([k]) => !SECRET_FIELDS.has(k.split('.').pop() ?? k) && k !== '_token' && k !== '_method')) : undefined;
  bag._aform = { ...(old ? { old } : {}), errors };
  await saveSession(s);
}

export const redirect = (to: string, status = 302) => new Response(null, { status, headers: { location: to } });

/** back(): the page the form was on */
export function backUrl(req: Request, fallback = '/admin/home') {
  const ref = req.headers.get('referer');
  if (ref) {
    try {
      const u = new URL(ref);
      const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
      if (u.host === host) return u.pathname + u.search;
    } catch { /* ignore */ }
  }
  return fallback;
}

export async function back(req: Request, values?: AdminFlash) {
  if (values) await flash(values);
  return redirect(backUrl(req));
}

export function expectsJson(req: Request) {
  const accept = req.headers.get('accept') ?? '';
  return req.headers.get('x-requested-with') === 'XMLHttpRequest' || accept.includes('/json') || accept.includes('+json');
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-cache, private' } });

/** A failed $request->validate(): 422 JSON for scripts, otherwise back with errors and input */
export async function validationFailed(req: Request, errors: Errors, input: FormInput | null) {
  if (expectsJson(req)) {
    const all = Object.values(errors).flat();
    const more = all.length - 1;
    const message = all[0] + (more > 0 ? ` (and ${more} more error${more === 1 ? '' : 's'})` : '');
    return jsonResponse({ message, errors }, 422);
  }
  await putErrors(errors, input);
  return redirect(backUrl(req));
}

/** The storefront's error page (errors/<code>.blade.php) with that status */
export async function errorPage(req: Request, code: 403 | 404 | 419 | 429 | 500) {
  const u = new URL(req.url);
  try {
    const r = await fetch(`${u.origin}/zq-error/${code}?current=${encodeURIComponent(u.pathname + u.search)}`, {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    return htmlResponse(await r.text(), code);
  } catch {
    return htmlResponse(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${code}</title></head><body><h1>${code}</h1></body></html>`, code);
  }
}
const pageExpired = (req: Request) => errorPage(req, 419);

/** abort(404) / findOrFail() */
export const notFound = (req: Request) => (expectsJson(req) ? jsonResponse({ message: 'Not Found' }, 404) : errorPage(req, 404));

/** The throttle middleware's answer */
export const tooMany = (req: Request) => (expectsJson(req) ? jsonResponse({ message: 'Too Many Attempts.' }, 429) : errorPage(req, 429));

type Params = Record<string, string | string[]>;
export interface AdminContext {
  req: Request;
  admin: Admin;
  params: Record<string, string>;
  url: URL;
}

async function resolveParams(ctx: { params: Promise<Params> } | undefined): Promise<Record<string, string>> {
  const p = ctx ? await ctx.params : {};
  return Object.fromEntries(Object.entries(p ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v.join('/') : decodeURIComponent(v)]));
}

/** The "auth" middleware: guests go to the login page (and come back after signing in) */
async function guard(req: Request): Promise<Admin | Response> {
  await connectDb();
  const admin = await getCurrentAdmin();
  if (admin) return admin;
  if (expectsJson(req)) return jsonResponse({ message: 'Unauthenticated.' }, 401);
  if (req.method === 'GET') {
    const s = await getWritableSession();
    const u = new URL(req.url);
    (s.data as AdminBag)._intended = u.pathname + u.search;
    await saveSession(s);
  }
  return redirect('/login');
}

type Handler = (c: AdminContext) => Promise<Response | Html>;

/** GET page behind the admin login */
export function adminPage(fn: Handler) {
  return async (req: Request, ctx: { params: Promise<Params> }) => {
    const admin = await guard(req);
    if (admin instanceof Response) return admin;
    const out = await fn({ req, admin, params: await resolveParams(ctx), url: new URL(req.url) });
    return out instanceof Response ? out : htmlResponse(out);
  };
}

export interface AdminActionContext extends AdminContext { input: FormInput }

/**
 * POST (also PUT / DELETE sent with _method) behind the admin login. Requests must
 * come from this site, standing in for Laravel's CSRF check.
 */
export function adminAction(methods: Record<string, (c: AdminActionContext) => Promise<Response>>) {
  return async (req: Request, ctx: { params: Promise<Params> }) => {
    if (!isSameOrigin(req)) return expectsJson(req) ? jsonResponse({ message: 'CSRF token mismatch.' }, 419) : pageExpired(req);
    const input = await readForm(req);
    const method = (typeof input._method === 'string' ? input._method : req.method).toUpperCase();
    const fn = methods[method];
    if (!fn) return jsonResponse({ message: `The ${method} method is not supported for route ${new URL(req.url).pathname.slice(1)}.` }, 405);
    const admin = await guard(req);
    if (admin instanceof Response) return admin;
    return fn({ req, admin, input, params: await resolveParams(ctx), url: new URL(req.url) });
  };
}

/** Guest-only POST (login, password reset) with the same-site check */
export function guestAction(fn: (c: { req: Request; input: FormInput; params: Record<string, string> }) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Params> }) => {
    if (!isSameOrigin(req)) return pageExpired(req);
    await connectDb();
    const input = await readForm(req);
    return fn({ req, input, params: await resolveParams(ctx) });
  };
}

/** redirect()->intended() */
export async function pullIntended(fallback: string) {
  const s = await getWritableSession();
  const bag = s.data as AdminBag;
  const to = bag._intended && bag._intended.startsWith('/') && !bag._intended.startsWith('//') ? bag._intended : fallback;
  if (bag._intended) { delete bag._intended; await saveSession(s); }
  return to;
}

