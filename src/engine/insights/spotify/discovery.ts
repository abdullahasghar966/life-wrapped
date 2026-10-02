import { SPOTIFY_DISCOVERY_MIN_ARTISTS } from '../constants';
import { n } from '../copy';
import { spotifyPlays, spotifyPlaysAllTime } from '../filters';
import { define } from '../helpers';
import { distinctArtists } from './topArtist';

export interface SpotifyDiscovery {
  artists: number;
  /** Artists whose first-ever play falls inside the period; null when the data starts inside it. */
  newArtists: number | null;
  /** Most-played artists that were new this period (up to 3). */
  topNew: string[];
}

export default define<SpotifyDiscovery>({
  id: 'spotify.discovery',
  deck: 'spotify',
  order: 9,
  title: 'Discovery',
  requires: async (q, ctx) => (await distinctArtists(q, ctx)) >= SPOTIFY_DISCOVERY_MIN_ARTISTS,
  async run(q, ctx) {
    const artists = await distinctArtists(q, ctx);
    // "New" is only meaningful if we can see listening from before the period.
    const startsBefore = !!ctx.dataStart.spotify && ctx.dataStart.spotify < ctx.period.start;
    if (!startsBefore) return { artists, newArtists: null, topNew: [] };
    const [aw, ap] = spotifyPlaysAllTime(ctx);
    const [pw, pp] = spotifyPlays(ctx);
    const rows = await q<{ artist: string; ms: number }>(
      `WITH first AS (
         SELECT artist, min(local_date) AS first_date FROM spotify_plays
         WHERE ${aw} AND artist IS NOT NULL GROUP BY artist)
       SELECT p.artist, SUM(p.ms_played)::DOUBLE AS ms
       FROM spotify_plays p JOIN first f USING (artist)
       WHERE ${pw} AND f.first_date >= CAST(? AS DATE)
       GROUP BY p.artist ORDER BY ms DESC, p.artist`,
      [...ap, ...pp, ctx.period.start],
    );
    return { artists, newArtists: rows.length, topNew: rows.slice(0, 3).map((r) => r.artist) };
  },
  a11yText: (p) =>
    p.newArtists === null
      ? `You listened to ${n(p.artists)} different artists.`
      : `You listened to ${n(p.artists)} different artists, and ${n(p.newArtists)} of them were new to you.`,
});
