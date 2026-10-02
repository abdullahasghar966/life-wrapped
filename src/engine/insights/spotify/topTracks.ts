import { SPOTIFY_TOP_TRACKS_MIN } from '../constants';
import { listOf } from '../copy';
import { spotifyPlays } from '../filters';
import { define, one } from '../helpers';

export interface SpotifyTopTracks {
  tracks: Array<{ track: string; artist: string; plays: number; minutes: number }>;
}

export default define<SpotifyTopTracks>({
  id: 'spotify.topTracks',
  deck: 'spotify',
  order: 5,
  title: 'Top 5 songs',
  async requires(q, ctx) {
    const [w, p] = spotifyPlays(ctx);
    const r = await one<{ n: number }>(
      q,
      `SELECT COUNT(DISTINCT (track, artist))::DOUBLE AS n FROM spotify_plays WHERE ${w}`,
      p,
    );
    return (r?.n ?? 0) >= SPOTIFY_TOP_TRACKS_MIN;
  },
  async run(q, ctx) {
    const [w, p] = spotifyPlays(ctx);
    const rows = await q<SpotifyTopTracks['tracks'][number]>(
      `SELECT track, COALESCE(artist, '') AS artist, COUNT(*)::DOUBLE AS plays,
              ROUND(SUM(ms_played) / 60000.0)::DOUBLE AS minutes
       FROM spotify_plays WHERE ${w}
       GROUP BY track, artist ORDER BY plays DESC, SUM(ms_played) DESC, track LIMIT 5`,
      p,
    );
    return rows.length === 5 ? { tracks: rows } : null;
  },
  a11yText: (p) => `Your top 5 songs: ${listOf(p.tracks.map((t) => `${t.track} by ${t.artist}`))}.`,
});
