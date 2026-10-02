import { YT_REWATCH_MIN } from '../constants';
import { inPeriod } from '../filters';
import { define, one } from '../helpers';
import type { DataCtx, QueryFn } from '../types';

export interface YoutubeRewatched {
  title: string;
  channel: string | null;
  times: number;
}

async function most(q: QueryFn, ctx: DataCtx) {
  const [w, p] = inPeriod(ctx);
  return one<YoutubeRewatched>(
    q,
    `SELECT arg_max(title, ts_utc) AS title, arg_max(channel, ts_utc) AS channel, COUNT(*)::DOUBLE AS times
     FROM youtube_watches WHERE ${w} AND video_id IS NOT NULL AND product = 'youtube'
     GROUP BY video_id ORDER BY times DESC, title LIMIT 1`,
    p,
  );
}

export default define<YoutubeRewatched>({
  id: 'youtube.rewatched',
  deck: 'youtube',
  order: 6,
  title: 'Most rewatched',
  requires: async (q, ctx) => ((await most(q, ctx))?.times ?? 0) >= YT_REWATCH_MIN,
  run: async (q, ctx) => (await most(q, ctx)) ?? null,
  a11yText: (p) => `You watched ${p.title} ${p.times} times.`,
});
