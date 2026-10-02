import { SPOTIFY_PLAY_MS, SPOTIFY_STREAK_MIN } from '../constants';
import { date } from '../copy';
import { inPeriod } from '../filters';
import { define, one } from '../helpers';
import type { DataCtx, QueryFn } from '../types';

export interface SpotifyStreak {
  days: number;
  start: string;
  end: string;
}

/** Longest run of consecutive local dates with at least one play (gaps-and-islands). */
export async function longestStreak(q: QueryFn, ctx: DataCtx): Promise<SpotifyStreak | null> {
  const [w, p] = inPeriod(ctx);
  const r = await one<SpotifyStreak>(
    q,
    `WITH d AS (
       SELECT DISTINCT local_date FROM spotify_plays WHERE ms_played >= ${SPOTIFY_PLAY_MS} AND ${w}),
     g AS (
       SELECT local_date, local_date - CAST(ROW_NUMBER() OVER (ORDER BY local_date) AS INTEGER) AS grp FROM d)
     SELECT COUNT(*)::DOUBLE AS days, strftime(min(local_date), '%Y-%m-%d') AS start,
            strftime(max(local_date), '%Y-%m-%d') AS "end"
     FROM g GROUP BY grp ORDER BY days DESC, start LIMIT 1`,
    p,
  );
  return r ?? null;
}

export default define<SpotifyStreak>({
  id: 'spotify.streak',
  deck: 'spotify',
  order: 10,
  title: 'Listening streak',
  requires: async (q, ctx) => ((await longestStreak(q, ctx))?.days ?? 0) >= SPOTIFY_STREAK_MIN,
  run: longestStreak,
  a11yText: (p) =>
    `Your longest listening streak was ${p.days} days in a row, from ${date(p.start)} to ${date(p.end)}.`,
});
