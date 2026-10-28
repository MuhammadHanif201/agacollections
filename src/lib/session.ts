import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { connectDb } from './db';
import { env } from './env';
import { Session, type SessionData } from '@/models/Session';

export const SESSION_COOKIE = 'zq_session';

const hashId = (raw: string) => createHash('sha256').update(raw).digest('hex');
const lifetimeMs = () => env.sessionLifetimeMinutes * 60 * 1000;

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: Math.floor(lifetimeMs() / 1000),
});

/** A fresh, unguessable session cookie value (the proxy hands one to first-time visitors) */
export const newSessionToken = () => randomBytes(32).toString('base64url');

export interface LoadedSession {
  id: string | null; // hashed cookie value; null only when the browser sent no cookie
  customerId: number | null;
  data: SessionData;
}

/** The visitor's session (readable anywhere, including Server Components). */
export const getSession = cache(async (): Promise<LoadedSession> => {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return { id: null, customerId: null, data: {} };
  await connectDb();
  const id = hashId(raw);
  const doc = await Session.findById(id).lean();
  if (!doc || doc.expires_at < new Date()) return { id, customerId: null, data: {} };
  return { id, customerId: doc.customer_id ?? null, data: doc.data ?? {} };
});

/**
 * The session for writing (Route Handlers and Server Actions): refreshes the cookie,
 * and creates a session when the browser has none.
 */
export async function getWritableSession(): Promise<LoadedSession & { id: string }> {
  const jar = await cookies();
  let raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) raw = newSessionToken();
  jar.set(SESSION_COOKIE, raw, sessionCookieOptions());
  await connectDb();
  const id = hashId(raw);
  const doc = await Session.findById(id).lean();
  if (doc && doc.expires_at >= new Date()) return { id, customerId: doc.customer_id ?? null, data: doc.data ?? {} };
  return { id, customerId: null, data: {} };
}

/** Save (and extend) a session; creates the record on first write. */
export async function saveSession(s: { id: string; data: SessionData; customerId?: number | null }) {
  await connectDb();
  const update: Record<string, unknown> = { data: s.data, expires_at: new Date(Date.now() + lifetimeMs()) };
  if (s.customerId !== undefined) update.customer_id = s.customerId;
  await Session.updateOne({ _id: s.id }, { $set: update }, { upsert: true });
}

/** New session id (login, password reset): keeps the bag, drops the old id. */
export async function regenerateSession(customerId: number | null, adminId?: number | null) {
  const current = await getWritableSession();
  // The other guard's login lives on too (one Laravel session held both)
  const prev = await Session.findOneAndDelete({ _id: current.id }).select('admin_id').lean();
  const raw = newSessionToken();
  const id = hashId(raw);
  await saveSession({ id, data: current.data, customerId });
  const keepAdmin = adminId !== undefined ? adminId : (prev?.admin_id ?? null);
  if (keepAdmin) await Session.updateOne({ _id: id }, { $set: { admin_id: keepAdmin } });
  (await cookies()).set(SESSION_COOKIE, raw, sessionCookieOptions());
  return { id, customerId, data: current.data };
}

/** Logout: the whole session goes, like Laravel's session()->invalidate(). */
export async function invalidateSession() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await connectDb();
    await Session.deleteOne({ _id: hashId(raw) });
  }
  jar.set(SESSION_COOKIE, newSessionToken(), sessionCookieOptions());
}

/** Change session data from a Server Component (no cookie write needed) */
export async function updateSessionData(id: string, set: Record<string, unknown>, unset: string[] = []) {
  await connectDb();
  const update: Record<string, unknown> = { $set: { ...Object.fromEntries(Object.entries(set).map(([k, v]) => [`data.${k}`, v])), expires_at: new Date(Date.now() + lifetimeMs()) } };
  if (unset.length) update.$unset = Object.fromEntries(unset.map((k) => [`data.${k}`, 1]));
  await Session.updateOne({ _id: id }, update, { upsert: true });
}
