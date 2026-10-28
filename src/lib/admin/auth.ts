import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { connectDb } from '@/lib/db';
import { getWritableSession, invalidateSession, regenerateSession, SESSION_COOKIE } from '@/lib/session';
import { Session } from '@/models/Session';
import { User, type UserDoc } from '@/models/User';

const REMEMBER_COOKIE = 'zq_admin_remember';
const REMEMBER_DAYS = 400;

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export type Admin = Pick<UserDoc, '_id' | 'name' | 'username' | 'email' | 'phone' | 'last_login_at' | 'created_at' | 'updated_at'>;
const publicFields = '_id name username email phone last_login_at created_at updated_at';

/** The signed-in admin (Laravel auth()->user() on the web guard), or null */
export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  await connectDb();
  if (raw) {
    const doc = await Session.findById(sha256(raw)).select('admin_id expires_at').lean();
    if (doc?.admin_id && doc.expires_at >= new Date()) {
      const u = await User.findById(doc.admin_id).select(publicFields).lean();
      if (u) return u as Admin;
    }
  }
  return adminFromRememberCookie();
});

async function adminFromRememberCookie(): Promise<Admin | null> {
  const raw = (await cookies()).get(REMEMBER_COOKIE)?.value;
  if (!raw) return null;
  const [idPart, token] = raw.split('.');
  const id = Number(idPart);
  if (!Number.isInteger(id) || !token) return null;
  const u = await User.findById(id).select(publicFields + ' remember_token').lean();
  if (!u?.remember_token) return null;
  const a = Buffer.from(u.remember_token);
  const b = Buffer.from(sha256(token));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const { remember_token: _omit, ...rest } = u;
  void _omit;
  return rest as Admin;
}

/** Auth::guard('web')->login($user, $remember) on a fresh session id */
export async function loginAdmin(userId: number, remember: boolean) {
  const current = await getWritableSession();
  await regenerateSession(current.customerId, userId);
  if (remember) {
    const token = randomBytes(30).toString('base64url');
    await User.updateOne({ _id: userId }, { $set: { remember_token: sha256(token) } });
    (await cookies()).set(REMEMBER_COOKIE, `${userId}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REMEMBER_DAYS * 24 * 3600,
    });
  }
}

/** Logout + session()->invalidate(): the whole session goes, as in Laravel */
export async function logoutAdmin(userId: number | null) {
  if (userId) {
    await connectDb();
    await User.updateOne({ _id: userId }, { $set: { remember_token: sha256(randomBytes(30).toString('base64url')) } });
  }
  (await cookies()).delete(REMEMBER_COOKIE);
  await invalidateSession();
}

export const hashToken = sha256;
