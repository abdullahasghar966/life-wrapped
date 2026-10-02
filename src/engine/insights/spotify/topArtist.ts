import { SPOTIFY_TOP_ARTISTS_MIN } from '../constants';
import { date, n } from '../copy';
import { spotifyPlays, spotifyPlaysAllTime } from '../filters';
import { define, one } from '../helpers';
import type { DataCtx, QueryFn } from '../types';

export interface SpotifyTopArtist {
  artist: string;
  minutes: number;
  plays: number;
  /** First-ever play of this artist anywhere in the data. */
  firstPlay: string;
  /** Share of music minutes in the period. */
  share: number;
}

export async function distinctArtists(q: QueryFn, ctx: DataCtx): Promise<number> {
  const [w, p] = spotifyPlays(ctx);
  const r = await one<{ n: number }>(
    q,
    `SELECT COUNT(DISTINCT artist)::DOUBLE AS n FROM spotify_plays WHERE ${w} AND artist IS NOT NULL`,
    p,
  );
  return r?.n ?? 0;
}

export default define<SpotifyTopArtist>({
  id: 'spotify.topArtist',
  deck: 'spotify',
  order: 3,
  title: 'Top artist',
  requires: async (q, ctx) => (await distinctArtists(q, ctx)) >= SPOTIFY_TOP_ARTISTS_MIN,
  async run(q, ctx) {
    const [w, p] = spotifyPlays(ctx);
    const top = await one<{ artist: string; minutes: number; plays: number; total: number }>(
      q,
      `SELECT artist, SUM(ms_played) / 60000.0 AS minutes, COUNT(*)::DOUBLE AS plays,
              SUM(SUM(ms_played)) OVER () / 60000.0 AS total
       FROM spotify_plays WHERE ${w} AND artist IS NOT NULL
       GROUP BY artist ORDER BY minutes DESC, artist LIMIT 1`,
      p,
    );
    if (!top) return null;
    const [aw, ap] = spotifyPlaysAllTime(ctx);
    const first = await one<{ d: string }>(
      q,
      `SELECT strftime(min(local_date), '%Y-%m-%d') AS d FROM spotify_plays WHERE ${aw} AND artist = ?`,
      [...ap, top.artist],
    );
    return {
      artist: top.artist,
      minutes: Math.round(top.minutes),
      plays: top.plays,
      firstPlay: first?.d ?? '',
      share: Math.round((top.minutes / Math.max(1, top.total)) * 1000) / 1000,
    };
  },
  a11yText: (p) =>
    `Your top artist was ${p.artist}: ${n(p.minutes)} minutes over ${n(p.plays)} plays, first played on ${date(p.firstPlay)}.`,
});
