import type { DeckId } from '../types';
import {
  LIFE_DECK_MIN_PLATFORMS,
  NETFLIX_DECK_MIN_SECONDS,
  SPOTIFY_DECK_MIN_MUSIC_MS,
  YOUTUBE_DECK_MIN_WATCHES,
} from './constants';
import { inPeriod, netflixProfile } from './filters';
import type { DataCtx, QueryFn } from './types';

type Platform = 'spotify' | 'youtube' | 'netflix';

/** Deck availability rules (§8.2), evaluated for the current period and profile. */
export async function availablePlatforms(
  q: QueryFn,
  ctx: Omit<DataCtx, 'availablePlatforms'>,
): Promise<Platform[]> {
  const full = { ...ctx, availablePlatforms: [] } as DataCtx;
  const out: Platform[] = [];
  const [p, pp] = inPeriod(full);

  const [sp] = await q<{ ms: number | null }>(
    `SELECT SUM(ms_played)::DOUBLE AS ms FROM spotify_plays WHERE kind = 'music' AND ${p}`,
    pp,
  );
  if ((sp?.ms ?? 0) >= SPOTIFY_DECK_MIN_MUSIC_MS) out.push('spotify');

  const [yt] = await q<{ n: number }>(
    `SELECT COUNT(*)::DOUBLE AS n FROM youtube_watches WHERE ${p}`,
    pp,
  );
  if ((yt?.n ?? 0) >= YOUTUBE_DECK_MIN_WATCHES) out.push('youtube');

  if (ctx.netflixProfile) {
    const [nw, nwp] = netflixProfile(full);
    const [nf] = await q<{ s: number | null }>(
      `SELECT SUM(duration_s)::DOUBLE AS s FROM netflix_views WHERE ${nw}`,
      nwp,
    );
    if ((nf?.s ?? 0) >= NETFLIX_DECK_MIN_SECONDS) out.push('netflix');
  }
  return out;
}

export function decksFor(platforms: Platform[]): DeckId[] {
  const decks: DeckId[] = [...platforms];
  if (platforms.length >= LIFE_DECK_MIN_PLATFORMS) decks.push('life');
  return decks;
}
