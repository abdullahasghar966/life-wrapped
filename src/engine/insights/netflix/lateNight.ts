import { NIGHT_END_HOUR } from '../constants';
import { clock, pct } from '../copy';
import { define, one } from '../helpers';
import type { DataCtx, QueryFn } from '../types';
import { nfWhere } from './shared';

export interface NetflixLateNight {
  /** Minutes after midnight of the latest start between 00:00 and 04:59. */
  latestMinute: number;
  date: string;
  title: string;
  nightShare: number;
}

async function latest(q: QueryFn, ctx: DataCtx) {
  const [w, p] = nfWhere(ctx);
  return one<{ latestMinute: number; date: string; title: string }>(
    q,
    `SELECT (hour(local_ts) * 60 + minute(local_ts))::DOUBLE AS "latestMinute",
            strftime(local_date, '%Y-%m-%d') AS date, COALESCE(series, title_raw) AS title
     FROM netflix_views WHERE ${w} AND local_hour < ${NIGHT_END_HOUR}
     ORDER BY "latestMinute" DESC, local_ts LIMIT 1`,
    p,
  );
}

export default define<NetflixLateNight>({
  id: 'netflix.lateNight',
  deck: 'netflix',
  order: 7,
  title: 'Latest night',
  requires: async (q, ctx) => !!(await latest(q, ctx)),
  async run(q, ctx) {
    const l = await latest(q, ctx);
    if (!l) return null;
    const [w, p] = nfWhere(ctx);
    const share = await one<{ s: number }>(
      q,
      `SELECT (SUM(duration_s) FILTER (WHERE local_hour < ${NIGHT_END_HOUR}) / SUM(duration_s))::DOUBLE AS s
       FROM netflix_views WHERE ${w}`,
      p,
    );
    return { ...l, nightShare: Math.round((share?.s ?? 0) * 1000) / 1000 };
  },
  a11yText: (p) =>
    `Your latest night: you pressed play at ${clock(p.latestMinute)}. ${pct(p.nightShare)} of your viewing happened after midnight.`,
});
