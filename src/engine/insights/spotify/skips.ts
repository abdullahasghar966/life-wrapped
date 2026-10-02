import { SPOTIFY_MOST_SKIPPED_MIN_PLAYS, SPOTIFY_SKIPS_MIN_PLAYS } from '../constants';
import { n, pct } from '../copy';
import { inPeriod, spotifyMusicAll } from '../filters';
import { define, one } from '../helpers';

export interface SpotifySkips {
  /** Tracks started (every music row, including quick skips). */
  started: number;
  skipped: number;
  rate: number;
  mostSkipped: { artist: string; rate: number; skipped: number; started: number } | null;
}

export default define<SpotifySkips>({
  id: 'spotify.skips',
  deck: 'spotify',
  order: 8,
  title: 'Skips',
  async requires(q, ctx) {
    const [w, p] = spotifyMusicAll(ctx);
    const r = await one<{ n: number }>(
      q,
      `SELECT COUNT(*)::DOUBLE AS n FROM spotify_plays WHERE ${w}`,
      p,
    );
    return (r?.n ?? 0) >= SPOTIFY_SKIPS_MIN_PLAYS;
  },
  async run(q, ctx) {
    const [w, p] = spotifyMusicAll(ctx);
    const t = await one<{ started: number; skipped: number }>(
      q,
      `SELECT COUNT(*)::DOUBLE AS started, COUNT(*) FILTER (WHERE skipped)::DOUBLE AS skipped
       FROM spotify_plays WHERE ${w}`,
      p,
    );
    if (!t) return null;
    const [pw, pp] = inPeriod(ctx);
    const priv = ctx.includePrivateSessions ? '' : 'AND NOT private_session';
    const worst = await one<NonNullable<SpotifySkips['mostSkipped']>>(
      q,
      `SELECT artist, COUNT(*) FILTER (WHERE skipped)::DOUBLE AS skipped, COUNT(*)::DOUBLE AS started,
              (COUNT(*) FILTER (WHERE skipped) / COUNT(*))::DOUBLE AS rate
       FROM spotify_plays WHERE kind = 'music' AND artist IS NOT NULL AND ${pw} ${priv}
       GROUP BY artist HAVING COUNT(*) >= ?
       ORDER BY rate DESC, started DESC, artist LIMIT 1`,
      [...pp, SPOTIFY_MOST_SKIPPED_MIN_PLAYS],
    );
    return {
      started: t.started,
      skipped: t.skipped,
      rate: Math.round((t.skipped / Math.max(1, t.started)) * 1000) / 1000,
      mostSkipped: worst ? { ...worst, rate: Math.round(worst.rate * 1000) / 1000 } : null,
    };
  },
  a11yText: (p) =>
    `You skipped ${pct(p.rate)} of the ${n(p.started)} tracks you started.${p.mostSkipped ? ` The artist you skipped most was ${p.mostSkipped.artist}.` : ''}`,
});
