import { YT_MUSIC_MIN_ENTRIES } from '../constants';
import { n } from '../copy';
import { inPeriod } from '../filters';
import { define, one } from '../helpers';

export interface YoutubeMusic {
  channel: string;
  plays: number;
  total: number;
  channels: Array<{ channel: string; plays: number }>;
}

export default define<YoutubeMusic>({
  id: 'youtube.music',
  deck: 'youtube',
  order: 10,
  title: 'YouTube Music',
  async requires(q, ctx) {
    const [w, p] = inPeriod(ctx);
    const r = await one<{ n: number }>(
      q,
      `SELECT COUNT(*)::DOUBLE AS n FROM youtube_watches WHERE product = 'youtube_music' AND ${w}`,
      p,
    );
    return (r?.n ?? 0) >= YT_MUSIC_MIN_ENTRIES;
  },
  async run(q, ctx) {
    const [w, p] = inPeriod(ctx);
    const rows = await q<{ channel: string; plays: number; total: number }>(
      `SELECT channel, COUNT(*)::DOUBLE AS plays, (SUM(COUNT(*)) OVER ())::DOUBLE AS total
       FROM youtube_watches WHERE product = 'youtube_music' AND channel IS NOT NULL AND ${w}
       GROUP BY channel ORDER BY plays DESC, channel LIMIT 3`,
      p,
    );
    const top = rows[0];
    if (!top) return null;
    return {
      channel: top.channel,
      plays: top.plays,
      total: top.total,
      channels: rows.map(({ channel, plays }) => ({ channel, plays })),
    };
  },
  a11yText: (p) => `Your YouTube Music favourite was ${p.channel}, with ${n(p.plays)} plays.`,
});
