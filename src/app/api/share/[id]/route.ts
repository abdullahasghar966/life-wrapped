import { getDb } from '@/server/db';
import { deleteShare } from '@/server/shares';

export const dynamic = 'force-dynamic';

/** Deletes a share. The delete token travels as `Authorization: Bearer <token>`. */
export async function DELETE(request: Request, ctx: RouteContext<'/api/share/[id]'>) {
  const db = await getDb();
  if (!db) return Response.json({ error: 'not_configured' }, { status: 503 });
  const { id } = await ctx.params;
  const token = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  if (!token) return Response.json({ error: 'missing_token' }, { status: 401 });
  const result = await deleteShare(db, id, token);
  if (result === 'not_found') return Response.json({ error: 'not_found' }, { status: 404 });
  if (result === 'forbidden') return Response.json({ error: 'forbidden' }, { status: 403 });
  return new Response(null, { status: 204 });
}
