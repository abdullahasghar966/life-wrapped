import { SPOTIFY_TOP_ARTISTS_MIN } from '../constants';
import { listOf } from '../copy';
import { spotifyPlays } from '../filters';
import { define } from '../helpers';
import { distinctArtists } from './topArtist';

export interface SpotifyTopArtists {
  artists: Array<{ name: string; minutes: number; plays: number }>;
}

export default define<SpotifyTopArtists>({
  id: 'spotify.topArtists',
  deck: 'spotify',
  order: 4,
  title: 'Top 5 artists',
  requires: async (q, ctx) => (await distinctArtists(q, ctx)) >= SPOTIFY_TOP_ARTISTS_MIN,
  async run(q, ctx) {
    const [w, p] = spotifyPlays(ctx);
    const rows = await q<{ name: string; minutes: number; plays: number }>(
      `SELECT artist AS name, ROUND(SUM(ms_played) / 60000.0)::DOUBLE AS minutes, COUNT(*)::DOUBLE AS plays
       FROM spotify_plays WHERE ${w} AND artist IS NOT NULL
       GROUP BY artist ORDER BY SUM(ms_played) DESC, artist LIMIT 5`,
      p,
    );
    return rows.length === 5 ? { artists: rows } : null;
  },
  a11yText: (p) => `Your top 5 artists: ${listOf(p.artists.map((a) => a.name))}.`,
});
