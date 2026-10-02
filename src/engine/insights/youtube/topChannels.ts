import { YT_TOP5_MIN_CHANNELS } from '../constants';
import { listOf } from '../copy';
import { define } from '../helpers';
import { distinctChannels, ytVideos } from './shared';

export interface YoutubeTopChannels {
  channels: Array<{ channel: string; videos: number; hours: number }>;
}

export default define<YoutubeTopChannels>({
  id: 'youtube.topChannels',
  deck: 'youtube',
  order: 4,
  title: 'Top 5 channels',
  requires: async (q, ctx) => (await distinctChannels(q, ctx)) >= YT_TOP5_MIN_CHANNELS,
  async run(q, ctx) {
    const [w, p] = ytVideos(ctx);
    const rows = await q<YoutubeTopChannels['channels'][number]>(
      `SELECT channel, COUNT(*)::DOUBLE AS videos, ROUND(SUM(est_seconds) / 3600.0, 1)::DOUBLE AS hours
       FROM youtube_watches WHERE ${w}
       GROUP BY channel ORDER BY videos DESC, channel LIMIT 5`,
      p,
    );
    return rows.length === 5 ? { channels: rows } : null;
  },
  a11yText: (p) => `Your top 5 channels: ${listOf(p.channels.map((c) => c.channel))}.`,
});
