import { fmtRange } from '../copy';
import { define, one, periodLastDay } from '../helpers';
import { spotifyMusicAll } from '../filters';

export interface SpotifyOpener {
  periodLabel: string;
  start: string;
  end: string;
  firstDate: string;
  lastDate: string;
}

export default define<SpotifyOpener>({
  id: 'spotify.opener',
  deck: 'spotify',
  order: 1,
  title: 'Your year in sound',
  requires: () => true,
  async run(q, ctx) {
    const [w, p] = spotifyMusicAll(ctx);
    const r = await one<{ first: string; last: string }>(
      q,
      `SELECT strftime(min(local_date), '%Y-%m-%d') AS first, strftime(max(local_date), '%Y-%m-%d') AS last
       FROM spotify_plays WHERE ${w}`,
      p,
    );
    if (!r?.first) return null;
    return {
      periodLabel: ctx.period.label,
      start: ctx.period.start,
      end: periodLastDay(ctx),
      firstDate: r.first,
      lastDate: r.last,
    };
  },
  a11yText: (p) => `Your year in sound: ${fmtRange(p.start, p.end)}.`,
});
