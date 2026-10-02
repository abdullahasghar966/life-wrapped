import { SPOTIFY_PODCAST_MIN_MS } from '../constants';
import { n } from '../copy';
import { spotifyPodcasts } from '../filters';
import { define, one } from '../helpers';

export interface SpotifyPodcasts {
  show: string;
  showMinutes: number;
  episodes: number;
  totalMinutes: number;
  shows: number;
}

export default define<SpotifyPodcasts>({
  id: 'spotify.podcasts',
  deck: 'spotify',
  order: 11,
  title: 'Podcasts',
  async requires(q, ctx) {
    const [w, p] = spotifyPodcasts(ctx);
    const r = await one<{ ms: number }>(
      q,
      `SELECT COALESCE(SUM(ms_played), 0)::DOUBLE AS ms FROM spotify_plays WHERE ${w}`,
      p,
    );
    return (r?.ms ?? 0) >= SPOTIFY_PODCAST_MIN_MS;
  },
  async run(q, ctx) {
    const [w, p] = spotifyPodcasts(ctx);
    const r = await one<SpotifyPodcasts>(
      q,
      `WITH s AS (
         SELECT "show", SUM(ms_played) AS ms, COUNT(DISTINCT episode) AS eps
         FROM spotify_plays WHERE ${w} AND "show" IS NOT NULL GROUP BY "show")
       SELECT "show" AS show, ROUND(ms / 60000.0)::DOUBLE AS "showMinutes", eps::DOUBLE AS episodes,
              ROUND(SUM(ms) OVER () / 60000.0)::DOUBLE AS "totalMinutes", (COUNT(*) OVER ())::DOUBLE AS shows
       FROM s ORDER BY ms DESC, "show" LIMIT 1`,
      p,
    );
    return r ?? null;
  },
  a11yText: (p) =>
    `Your favourite podcast was ${p.show}: ${n(p.showMinutes)} minutes across ${n(p.episodes)} episodes.`,
});
