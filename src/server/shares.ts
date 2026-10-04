import { randomBytes, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { SharePayloadSchema, type ShareRequest, type ValidSharePayload } from '@/share/schema';
import type { ShareDb } from './db';
import { sha256 } from './rateLimit';
import { sharedCards } from './schema';

export interface StoredShare {
  id: string;
  createdAt: string;
  cardType: string;
  theme: string;
  isSample: boolean;
  payload: ValidSharePayload;
}

export async function createShare(
  db: ShareDb,
  req: ShareRequest,
): Promise<{ id: string; deleteToken: string }> {
  const id = nanoid(10);
  const deleteToken = randomBytes(24).toString('base64url');
  await db.insert(sharedCards).values({
    id,
    cardType: req.payload.cardType,
    theme: req.payload.theme,
    isSample: req.isSample,
    payload: req.payload,
    deleteTokenHash: sha256(deleteToken),
  });
  return { id, deleteToken };
}

const ID = /^[A-Za-z0-9_-]{10}$/;

/** Cards shared before the rebrand (ADR-036) named the Life deck's theme 'aurora'. */
function upgradeLegacy(payload: unknown): unknown {
  if (
    payload &&
    typeof payload === 'object' &&
    (payload as { theme?: unknown }).theme === 'aurora'
  ) {
    return { ...payload, theme: 'receipt' };
  }
  return payload;
}

export async function getShare(db: ShareDb, id: string): Promise<StoredShare | null> {
  if (!ID.test(id)) return null;
  const [row] = await db.select().from(sharedCards).where(eq(sharedCards.id, id)).limit(1);
  if (!row) return null;
  // Validated again on the way out, so a row that no longer matches the whitelist
  // (edited by hand, or written by an older schema) is treated as missing.
  const payload = SharePayloadSchema.safeParse(upgradeLegacy(row.payload));
  if (!payload.success) return null;
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    cardType: row.cardType,
    theme: payload.data.theme,
    isSample: row.isSample,
    payload: payload.data,
  };
}

/** Deletes a share if the token matches the stored hash (compared in constant time). */
export async function deleteShare(
  db: ShareDb,
  id: string,
  token: string,
): Promise<'deleted' | 'not_found' | 'forbidden'> {
  if (!ID.test(id)) return 'not_found';
  const [row] = await db
    .select({ hash: sharedCards.deleteTokenHash })
    .from(sharedCards)
    .where(eq(sharedCards.id, id))
    .limit(1);
  if (!row) return 'not_found';
  const a = Buffer.from(row.hash, 'hex');
  const b = Buffer.from(sha256(token), 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 'forbidden';
  await db.delete(sharedCards).where(eq(sharedCards.id, id));
  return 'deleted';
}
