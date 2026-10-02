import { SPOTIFY_MINUTES_MIN } from '../constants';
import { n } from '../copy';
import { inPeriod, spotifyMusicAll } from '../filters';
import { define, one } from '../helpers';

export interface SpotifyMinutes {
  /** Music minutes, private sessions included (it's a total). */
  minutes: number;
  podcastMinutes: number;
  activeDays: number;
  /** Average music minutes per active day. */
  perActiveDay: number;
}

export default define<SpotifyMinutes>({
  id: 'spotify.minutes',
  deck: 'spotify',
  order: 2,
  title: 'Minutes listened',
  async requires(q, ctx) {
    const [w, p] = spotifyMusicAll(ctx);
    const r = await one<{ m: number }>(
      q,
      `SELECT COALESCE(SUM(ms_played), 0) / 60000.0 AS m FROM spotify_plays WHERE ${w}`,
      p,
    );
    return (r?.m ?? 0) >= SPOTIFY_MINUTES_MIN;
  },
  async run(q, ctx) {
    const [w, p] = spotifyMusicAll(ctx);
    const [pw, pp] = inPeriod(ctx);
    const r = await one<{ m: number; d: number }>(
      q,
      `SELECT SUM(ms_played) / 60000.0 AS m, COUNT(DISTINCT local_date)::DOUBLE AS d
       FROM spotify_plays WHERE ${w}`,
      p,
    );
    const pod = await one<{ m: number }>(
      q,
      `SELECT COALESCE(SUM(ms_played), 0) / 60000.0 AS m FROM spotify_plays WHERE kind = 'podcast' AND ${pw}`,
      pp,
    );
    if (!r) return null;
    return {
      minutes: Math.round(r.m),
      podcastMinutes: Math.round(pod?.m ?? 0),
      activeDays: r.d,
      perActiveDay: Math.round(r.m / Math.max(1, r.d)),
    };
  },
  a11yText: (p) =>
    `You listened to ${n(p.minutes)} minutes of music${p.podcastMinutes > 0 ? `, plus ${n(p.podcastMinutes)} minutes of podcasts` : ''}.`,
});
