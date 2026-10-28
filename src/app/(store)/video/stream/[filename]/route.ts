import { NextResponse } from 'next/server';

/**
 * Old video links: only video files at the top of the public folder. The static file
 * server already answers range requests, so this just points there.
 */
export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const name = decodeURIComponent((await params).filename).split(/[\\/]/).pop() ?? '';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!name || !['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return new NextResponse('Not Found', { status: 404 });
  return NextResponse.redirect(new URL('/' + encodeURIComponent(name), req.url), 302);
}
