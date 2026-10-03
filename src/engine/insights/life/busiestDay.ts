import { day, n } from '../copy';
import { define, one } from '../helpers';
import { lifeWhere, zero, type PerPlatform, type Platform } from './shared';

/** Events closer than this on the same platform are drawn as one block. */
const MERGE_GAP_MIN = 10;

export interface LifeBusiestDay {
  date: string;
  hours: number;
  /** True when YouTube time (always estimated) is part of the day. */
  estimated: boolean;
  hoursByPlatform: PerPlatform;
  /** Blocks of activity in minutes since local midnight (end may exceed 1440 if it ran past midnight). */
  segments: Array<{ platform: Platform; start: number; end: number }>;
}

export default define<LifeBusiestDay>({
  id: 'life.busiestDay',
  deck: 'life',
  order: 5,
  title: 'Busiest day',
  requires: () => true,
  async run(q, ctx) {
    const [w, p] = lifeWhere(ctx);
    const best = await one<{ date: string; s: number }>(
      q,
      `SELECT strftime(local_date, '%Y-%m-%d') AS date, SUM(seconds)::DOUBLE AS s
       FROM media_events WHERE ${w} GROUP BY local_date ORDER BY s DESC, local_date LIMIT 1`,
      p,
    );
    if (!best) return null;
    const events = await q<{ platform: Platform; start: number; secs: number }>(
      `SELECT platform, (hour(local_ts) * 60 + minute(local_ts) + second(local_ts) / 60.0)::DOUBLE AS start,
              seconds::DOUBLE AS secs
       FROM media_events WHERE ${w} AND local_date = CAST(? AS DATE)
       ORDER BY platform, local_ts`,
      [...p, best.date],
    );
    const by = zero();
    const segments: LifeBusiestDay['segments'] = [];
    for (const e of events) {
      by[e.platform] += e.secs / 3600;
      const end = e.start + e.secs / 60;
      const last = segments.at(-1);
      if (last && last.platform === e.platform && e.start - last.end <= MERGE_GAP_MIN) {
        last.end = Math.max(last.end, end);
      } else segments.push({ platform: e.platform, start: e.start, end });
    }
    return {
      date: best.date,
      hours: Math.round((best.s / 3600) * 10) / 10,
      estimated: by.youtube > 0,
      hoursByPlatform: {
        spotify: Math.round(by.spotify * 10) / 10,
        youtube: Math.round(by.youtube * 10) / 10,
        netflix: Math.round(by.netflix * 10) / 10,
      },
      segments: segments
        .map((s) => ({ ...s, start: Math.round(s.start), end: Math.round(s.end) }))
        .sort((a, b) => a.start - b.start),
    };
  },
  a11yText: (p) =>
    `Your busiest day was ${day(p.date)}: ${p.estimated ? 'about ' : ''}${n(p.hours)} hours of everything.`,
});
