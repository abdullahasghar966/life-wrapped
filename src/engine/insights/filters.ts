import { SPOTIFY_PLAY_MS } from './constants';
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

/**
 * Private sessions: the user chose privacy for those plays. They count in time
 * totals (minutes, clock, streak), but never in named lists or anything shareable
 * unless "Include private sessions" is on.
 */
const privacy = (ctx: DataCtx) => (ctx.includePrivateSessions ? '' : ' AND NOT private_session');

/** All music rows in the period, private sessions included (for totals). */
export function spotifyMusicAll(ctx: DataCtx): Frag {
  const [p, pp] = inPeriod(ctx);
  return [`kind = 'music' AND ${p}`, pp];
}

/** Music "plays" (≥ 30 s) in the period for named lists; private sessions excluded. */
export function spotifyPlays(ctx: DataCtx): Frag {
  const [p, pp] = inPeriod(ctx);
  return [`kind = 'music' AND ms_played >= ${SPOTIFY_PLAY_MS} AND ${p}${privacy(ctx)}`, pp];
}

/** Like spotifyPlays but across all time (used for "first play" and "new to you"). */
export function spotifyPlaysAllTime(ctx: DataCtx): Frag {
  return [`kind = 'music' AND ms_played >= ${SPOTIFY_PLAY_MS}${privacy(ctx)}`, []];
}

export function spotifyPodcasts(ctx: DataCtx): Frag {
  const [p, pp] = inPeriod(ctx);
  return [`kind = 'podcast' AND ${p}${privacy(ctx)}`, pp];
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
