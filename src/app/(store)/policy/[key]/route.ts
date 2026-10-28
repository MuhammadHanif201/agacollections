import { NextResponse } from 'next/server';

/** Legacy deep links redirect to the single policies page */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return NextResponse.redirect(new URL(`/policies#${key}`, req.url), 301);
}
