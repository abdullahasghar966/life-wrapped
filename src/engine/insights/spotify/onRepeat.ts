import { SPOTIFY_ON_REPEAT_MIN } from '../constants';
import { day } from '../copy';
import { spotifyPlays } from '../filters';
import { define, one } from '../helpers';
import type { DataCtx, QueryFn } from '../types';

export interface SpotifyOnRepeat {
  track: string;
  artist: string;
  date: string;
  plays: number;
}

async function best(q: QueryFn, ctx: DataCtx) {
  const [w, p] = spotifyPlays(ctx);
  return one<SpotifyOnRepeat>(
    q,
    `SELECT track, COALESCE(artist, '') AS artist, strftime(local_date, '%Y-%m-%d') AS date,
            COUNT(*)::DOUBLE AS plays
     FROM spotify_plays WHERE ${w}
     GROUP BY track, artist, local_date ORDER BY plays DESC, local_date LIMIT 1`,
    p,
  );
}

export default define<SpotifyOnRepeat>({
  id: 'spotify.onRepeat',
  deck: 'spotify',
  order: 6,
  title: 'On repeat',
  requires: async (q, ctx) => ((await best(q, ctx))?.plays ?? 0) >= SPOTIFY_ON_REPEAT_MIN,
  run: async (q, ctx) => (await best(q, ctx)) ?? null,
  a11yText: (p) => `On ${day(p.date)} you played ${p.track} by ${p.artist} ${p.plays} times.`,
});
