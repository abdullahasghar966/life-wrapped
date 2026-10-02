import { inPeriod, type Frag } from '../filters';
import { one } from '../helpers';
import type { DataCtx, QueryFn } from '../types';

/** Regular YouTube watches with a known channel. YouTube Music has its own card. */
export function ytVideos(ctx: DataCtx): Frag {
  const [p, pp] = inPeriod(ctx);
  return [`product = 'youtube' AND channel IS NOT NULL AND ${p}`, pp];
}

export async function distinctChannels(q: QueryFn, ctx: DataCtx): Promise<number> {
  const [w, p] = ytVideos(ctx);
  const r = await one<{ n: number }>(
    q,
    `SELECT COUNT(DISTINCT channel)::DOUBLE AS n FROM youtube_watches WHERE ${w}`,
    p,
  );
  return r?.n ?? 0;
}

export async function activeDays(q: QueryFn, ctx: DataCtx): Promise<number> {
  const [w, p] = inPeriod(ctx);
  const r = await one<{ n: number }>(
    q,
    `SELECT COUNT(DISTINCT local_date)::DOUBLE AS n FROM youtube_watches WHERE ${w}`,
    p,
  );
  return r?.n ?? 0;
}

export interface RabbitHole {
  date: string;
  /** Minutes since local midnight of the first and last watch. */
  startMinute: number;
  endMinute: number;
  /** True when the session ended on the next calendar day. */
  crossesMidnight: boolean;
  videos: number;
  minutes: number;
  firstTitle: string | null;
  lastTitle: string | null;
  /** The chain, in order (titles may be null for removed videos). */
  chain: Array<{ title: string | null; channel: string | null }>;
}

/** The longest session ("rabbit hole") that starts inside the period. */
export async function longestSession(q: QueryFn, ctx: DataCtx): Promise<RabbitHole | null> {
  const [w, p] = inPeriod(ctx);
  const r = await one<
    RabbitHole & {
      chainTitles: Array<string | null>;
      chainChannels: Array<string | null>;
      endDate: string;
    }
  >(
    q,
    `WITH s AS (
       SELECT session_id,
              COUNT(*) AS n,
              date_diff('second', MIN(ts_utc), MAX(ts_utc)) + arg_max(est_seconds, ts_utc) AS secs,
              MIN(local_ts) AS first_local, MAX(local_ts) AS last_local,
              arg_min(title, ts_utc) AS first_title, arg_max(title, ts_utc) AS last_title,
              list(title ORDER BY ts_utc) AS titles, list(channel ORDER BY ts_utc) AS channels
       FROM youtube_watches
       WHERE session_id IN (SELECT DISTINCT session_id FROM youtube_watches WHERE ${w})
       GROUP BY session_id)
     SELECT strftime(first_local, '%Y-%m-%d') AS date, strftime(last_local, '%Y-%m-%d') AS "endDate",
            (hour(first_local) * 60 + minute(first_local))::DOUBLE AS "startMinute",
            (hour(last_local) * 60 + minute(last_local))::DOUBLE AS "endMinute",
            n::DOUBLE AS videos, ROUND(secs / 60.0)::DOUBLE AS minutes,
            first_title AS "firstTitle", last_title AS "lastTitle",
            titles[1:12] AS "chainTitles", channels[1:12] AS "chainChannels"
     FROM s WHERE CAST(first_local AS DATE) >= CAST(? AS DATE) AND CAST(first_local AS DATE) < CAST(? AS DATE)
     ORDER BY secs DESC, first_local LIMIT 1`,
    [...p, ctx.period.start, ctx.period.end],
  );
  if (!r) return null;
  const { chainTitles, chainChannels, endDate, ...rest } = r;
  return {
    ...rest,
    crossesMidnight: endDate !== r.date,
    chain: chainTitles.map((title, i) => ({ title, channel: chainChannels[i] ?? null })),
  };
}
