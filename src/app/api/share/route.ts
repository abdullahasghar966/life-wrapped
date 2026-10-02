import { getDb, shareConfig } from '@/server/db';
import { allowShare, clientIp } from '@/server/rateLimit';
import { createShare } from '@/server/shares';
import { byteLength, SHARE_MAX_BYTES, ShareRequestSchema } from '@/share/schema';

// The answer depends on runtime environment variables and the database.
export const dynamic = 'force-dynamic';

const NOT_CONFIGURED = {
  error: 'not_configured',
  message: 'Sharing isn’t set up on this deployment. Everything else works without it.',
};

/** Whether sharing is available, so the UI can explain before anything is sent. */
export function GET() {
  return Response.json({ enabled: shareConfig().enabled });
}

/** Creates a share from a whitelisted summary (≤ 4 KB). Raw rows are never accepted. */
export async function POST(request: Request) {
  const { salt } = shareConfig();
  const db = await getDb();
  if (!db || !salt) return Response.json(NOT_CONFIGURED, { status: 503 });

  const text = await request.text();
  if (byteLength(text) > SHARE_MAX_BYTES) {
    return Response.json(
      { error: 'too_large', message: 'Shares are limited to 4 KB.' },
      { status: 413 },
    );
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: 'invalid', message: 'Expected JSON.' }, { status: 400 });
  }
  const parsed = ShareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid', message: 'This card can’t be shared in that shape.' },
      { status: 400 },
    );
  }
  if (!(await allowShare(db, clientIp(request.headers), salt))) {
    return Response.json(
      { error: 'rate_limited', message: 'That’s a lot of sharing. Try again in an hour.' },
      { status: 429 },
    );
  }
  const { id, deleteToken } = await createShare(db, parsed.data);
  return Response.json({ id, deleteToken }, { status: 201 });
}
