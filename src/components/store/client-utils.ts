'use client';

import type Swal from 'sweetalert2';

type SwalType = typeof Swal;
let swalPromise: Promise<SwalType> | null = null;

/** SweetAlert2 v11, the same library the Laravel pages loaded from the CDN */
export function getSwal(): Promise<SwalType> {
  swalPromise ??= import('sweetalert2').then((m) => m.default);
  return swalPromise;
}

export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
  let data = {} as T;
  try { data = (await res.json()) as T; } catch { /* empty body */ }
  return { ok: res.ok, status: res.status, data };
}
