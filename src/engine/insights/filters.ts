import type { DataCtx } from './types';

/**
 * Shared WHERE fragments. They contain only placeholders; values always travel as
 * parameters. Each returns [sql, params] to splice into a query.
 */
export type Frag = [sql: string, params: unknown[]];

export const inPeriod = (ctx: DataCtx, col = 'local_date'): Frag => [
  `${col} >= CAST(? AS DATE) AND ${col} < CAST(? AS DATE)`,
  [ctx.period.start, ctx.period.end],
];

/** Music rows in the period. Private sessions count in totals (pass includePrivate=true). */
export function spotifyMusic(ctx: DataCtx, opts: { includePrivate?: boolean } = {}): Frag {
  const [p, pp] = inPeriod(ctx);
  const priv = opts.includePrivate || ctx.includePrivateSessions ? '' : ' AND NOT private_session';
  return [`kind = 'music' AND ${p}${priv}`, pp];
}

export const netflixProfile = (ctx: DataCtx): Frag => {
  const [p, pp] = inPeriod(ctx);
  return [`profile = ? AND ${p}`, [ctx.netflixProfile ?? '', ...pp]];
};

/** Combines fragments with AND. */
export function and(...frags: Frag[]): Frag {
  return [frags.map((f) => `(${f[0]})`).join(' AND '), frags.flatMap((f) => f[1])];
}

/** Stable 32-bit FNV-1a hash, used to choose copy variants deterministically. */
export function hashOf(value: unknown): number {
  const s = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
