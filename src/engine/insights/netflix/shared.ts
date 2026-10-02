import { netflixProfile } from '../filters';
import { one } from '../helpers';
import type { DataCtx, QueryFn } from '../types';

export { netflixProfile as nfWhere };

export interface BingeRecord {
  series: string;
  date: string;
  count: number;
  /** In viewing order: season label (if any) and episode name. */
  episodes: Array<{ season: string | null; episode: string | null }>;
}

/** Most distinct episodes of one series watched on one local day. */
export async function bingeRecord(q: QueryFn, ctx: DataCtx): Promise<BingeRecord | null> {
  const [w, p] = netflixProfile(ctx);
  const best = await one<{ series: string; date: string; count: number }>(
    q,
    `SELECT series, strftime(local_date, '%Y-%m-%d') AS date, COUNT(DISTINCT title_raw)::DOUBLE AS count
     FROM netflix_views WHERE ${w} AND is_series AND series IS NOT NULL
     GROUP BY series, local_date ORDER BY count DESC, local_date LIMIT 1`,
    p,
  );
  if (!best) return null;
  const episodes = await q<{ season: string | null; episode: string | null }>(
    `SELECT season, episode FROM (
       SELECT title_raw, arg_min(season, ts_utc) AS season, arg_min(episode, ts_utc) AS episode, MIN(ts_utc) AS t
       FROM netflix_views WHERE ${w} AND series = ? AND local_date = CAST(? AS DATE)
       GROUP BY title_raw) ORDER BY t`,
    [...p, best.series, best.date],
  );
  return { ...best, episodes };
}

export async function totalSeconds(q: QueryFn, ctx: DataCtx): Promise<number> {
  const [w, p] = netflixProfile(ctx);
  const r = await one<{ s: number }>(
    q,
    `SELECT COALESCE(SUM(duration_s), 0)::DOUBLE AS s FROM netflix_views WHERE ${w}`,
    p,
  );
  return r?.s ?? 0;
}
