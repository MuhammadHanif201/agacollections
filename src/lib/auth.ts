import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { connectDb } from './db';
import { getSession, invalidateSession, regenerateSession } from './session';
import { Customer, type CustomerDoc } from '@/models/Customer';

const REMEMBER_COOKIE = 'zq_remember';
const REMEMBER_DAYS = 400; // browsers cap cookie lifetime at about 400 days

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

export type CurrentCustomer = Pick<CustomerDoc, '_id' | 'full_name' | 'email' | 'phone' | 'country' | 'city' | 'address' | 'villa_apartment'>;

const publicFields = '_id full_name email phone country city address villa_apartment';

/** The signed-in shopper, or null. Falls back to the "remember me" cookie. */
export const getCurrentCustomer = cache(async (): Promise<CurrentCustomer | null> => {
  const session = await getSession();
  await connectDb();
  if (session.customerId) {
    const c = await Customer.findById(session.customerId).select(publicFields).lean();
    if (c) return c as CurrentCustomer;
  }
  const remembered = await customerFromRememberCookie();
  return remembered;
});

async function customerFromRememberCookie(): Promise<CurrentCustomer | null> {
  const raw = (await cookies()).get(REMEMBER_COOKIE)?.value;
  if (!raw) return null;
  const [idPart, token] = raw.split('.');
  const id = Number(idPart);
  if (!Number.isInteger(id) || !token) return null;
  await connectDb();
  const c = await Customer.findById(id).select(publicFields + ' remember_token').lean();
  if (!c?.remember_token) return null;
  const a = Buffer.from(c.remember_token);
  const b = Buffer.from(sha256(token));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const { remember_token: _omit, ...rest } = c;
  void _omit;
  return rest as CurrentCustomer;
}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  // Laravel writes $2y$ hashes; bcryptjs reads them as-is
  return bcrypt.compare(plain, hash);
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);

/** Sign a customer in on a fresh session id (protects against session fixation). */
export async function loginCustomer(customerId: number, remember: boolean) {
  await regenerateSession(customerId);
  const jar = await cookies();
  if (remember) {
    const token = randomBytes(30).toString('base64url');
    await Customer.updateOne({ _id: customerId }, { $set: { remember_token: sha256(token) } });
    jar.set(REMEMBER_COOKIE, `${customerId}.${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REMEMBER_DAYS * 24 * 3600,
    });
  }
}

export async function logoutCustomer(customerId: number | null) {
  if (customerId) {
    await connectDb();
    // Like Laravel: a new remember token signs out other remembered browsers
    await Customer.updateOne({ _id: customerId }, { $set: { remember_token: sha256(randomBytes(30).toString('base64url')) } });
  }
  (await cookies()).delete(REMEMBER_COOKIE);
  await invalidateSession();
}
