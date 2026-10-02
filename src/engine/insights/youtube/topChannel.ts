import { YT_TOP_CHANNEL_MIN_CHANNELS } from '../constants';
import { n, pct } from '../copy';
import { define, one } from '../helpers';
import { distinctChannels, ytVideos } from './shared';

export interface YoutubeTopChannel {
  channel: string;
  videos: number;
  share: number;
  firstWatch: string;
}

export default define<YoutubeTopChannel>({
  id: 'youtube.topChannel',
  deck: 'youtube',
  order: 3,
  title: 'Top channel',
  requires: async (q, ctx) => (await distinctChannels(q, ctx)) >= YT_TOP_CHANNEL_MIN_CHANNELS,
  async run(q, ctx) {
    const [w, p] = ytVideos(ctx);
    const r = await one<YoutubeTopChannel & { total: number }>(
      q,
      `SELECT channel, COUNT(*)::DOUBLE AS videos, (SUM(COUNT(*)) OVER ())::DOUBLE AS total,
              strftime(min(local_date), '%Y-%m-%d') AS "firstWatch"
       FROM youtube_watches WHERE ${w}
       GROUP BY channel ORDER BY videos DESC, channel LIMIT 1`,
      p,
    );
    if (!r) return null;
    const { total, ...rest } = r;
    return { ...rest, share: Math.round((r.videos / Math.max(1, total)) * 1000) / 1000 };
  },
  a11yText: (p) =>
    `Your most-watched channel was ${p.channel}: ${n(p.videos)} videos, ${pct(p.share)} of everything you watched.`,
});
