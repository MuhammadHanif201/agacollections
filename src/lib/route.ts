import 'server-only';
import { NextResponse } from 'next/server';
import { isSameOrigin } from './request';

/** Body of a POST as a plain object: JSON, urlencoded or multipart */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) {
      const v = await req.json();
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    }
    if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const fd = await req.formData();
      const out: Record<string, unknown> = {};
      for (const [k, v] of fd.entries()) {
        if (typeof v !== 'string') continue;
        if (k.endsWith('[]')) ((out[k.slice(0, -2)] ??= []) as string[]).push(v);
        else out[k] = v;
      }
      return out;
    }
  } catch { /* malformed body */ }
  return {};
}

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** Laravel answered 419 when the CSRF token was missing; here requests must come from this site */
export function rejectCrossSite(req: Request) {
  return isSameOrigin(req) ? null : json({ message: 'Page expired.' }, 419);
}

export const tooManyRequests = () => json({ message: 'Too Many Attempts.' }, 429);
