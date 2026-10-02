import { createHash } from 'node:crypto';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import type { ShareDb } from './db';
import { shareRateLimits } from './schema';

/** 10 shares per IP per hour (§13). */
export const SHARES_PER_HOUR = 10;

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** The client IP as seen by the platform's proxy; never stored, only hashed. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Records one share for this IP and says whether it's allowed. The key is
 * sha256(ip + SHARE_SALT), so the table never contains an address.
 */
export async function allowShare(db: ShareDb, ip: string, salt: string): Promise<boolean> {
  const keyHash = sha256(`${ip}${salt}`);
  const hourAgo = sql`now() - interval '1 hour'`;
  // Old rows are useless; prune them so the table stays tiny.
  await db.delete(shareRateLimits).where(lt(shareRateLimits.createdAt, hourAgo));
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(shareRateLimits)
    .where(and(eq(shareRateLimits.keyHash, keyHash), gt(shareRateLimits.createdAt, hourAgo)));
  if ((row?.n ?? 0) >= SHARES_PER_HOUR) return false;
  await db.insert(shareRateLimits).values({ keyHash });
  return true;
}
