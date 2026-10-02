import { inPeriod, type Frag } from '../filters';
import type { DataCtx, QueryFn } from '../types';

export type Platform = 'spotify' | 'youtube' | 'netflix';
export const PLATFORMS: Platform[] = ['spotify', 'youtube', 'netflix'];

/**
 * Events from the platforms whose decks are available, in the period, with Netflix
 * limited to the selected profile. Spotify private sessions count: these are totals.
 */
export function lifeWhere(ctx: DataCtx): Frag {
  const [p, pp] = inPeriod(ctx);
  const platforms = ctx.availablePlatforms.length > 0 ? ctx.availablePlatforms : ['none'];
  return [
    `${p} AND platform IN (${platforms.map(() => '?').join(', ')}) AND (platform <> 'netflix' OR profile = ?)`,
    [...pp, ...platforms, ctx.netflixProfile ?? ''],
  ];
}

export type PerPlatform = Record<Platform, number>;
export const zero = (): PerPlatform => ({ spotify: 0, youtube: 0, netflix: 0 });

/** Seconds per platform for the period. */
export async function secondsByPlatform(
  q: QueryFn,
  ctx: DataCtx,
  extra = '',
): Promise<PerPlatform> {
  const [w, p] = lifeWhere(ctx);
  const rows = await q<{ platform: Platform; s: number }>(
    `SELECT platform, SUM(seconds)::DOUBLE AS s FROM media_events WHERE ${w} ${extra} GROUP BY platform`,
    p,
  );
  const out = zero();
  for (const r of rows) out[r.platform] = r.s;
  return out;
}

export const sum = (v: PerPlatform) => v.spotify + v.youtube + v.netflix;

export function topPlatform(v: PerPlatform): Platform {
  return PLATFORMS.reduce((a, b) => (v[b] > v[a] ? b : a));
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  netflix: 'Netflix',
};

/** What each platform "is", for generated copy ("Mornings: music."). */
export const PLATFORM_NOUN: Record<Platform, string> = {
  spotify: 'music',
  youtube: 'YouTube',
  netflix: 'Netflix',
};
