import { YT_HEATMAP_MIN_WEEKS } from '../constants';
import { hour12 } from '../copy';
import { inPeriod } from '../filters';
import { define, one } from '../helpers';

const DAY_NAMES = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
];

export interface YoutubeWeekly {
  /** grid[dow][hour] = watches; dow 0 = Sunday. */
  grid: number[][];
  peakDow: number;
  peakHour: number;
  max: number;
}

export default define<YoutubeWeekly>({
  id: 'youtube.weekly',
  deck: 'youtube',
  order: 8,
  title: 'Weekly rhythm',
  async requires(q, ctx) {
    const [w, p] = inPeriod(ctx);
    const r = await one<{ n: number }>(
      q,
      `SELECT COUNT(DISTINCT date_trunc('week', local_date))::DOUBLE AS n FROM youtube_watches WHERE ${w}`,
      p,
    );
    return (r?.n ?? 0) >= YT_HEATMAP_MIN_WEEKS;
  },
  async run(q, ctx) {
    const [w, p] = inPeriod(ctx);
    const rows = await q<{ d: number; h: number; v: number }>(
      `SELECT local_dow::DOUBLE AS d, local_hour::DOUBLE AS h, COUNT(*)::DOUBLE AS v
       FROM youtube_watches WHERE ${w} GROUP BY local_dow, local_hour`,
      p,
    );
    const grid = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
    let peak = { d: 0, h: 0, v: -1 };
    for (const r of rows) {
      grid[r.d]![r.h] = r.v;
      if (r.v > peak.v || (r.v === peak.v && (r.d < peak.d || (r.d === peak.d && r.h < peak.h))))
        peak = r;
    }
    return { grid, peakDow: peak.d, peakHour: peak.h, max: Math.max(0, peak.v) };
  },
  a11yText: (p) => `Your YouTube prime time: ${DAY_NAMES[p.peakDow]} at ${hour12(p.peakHour)}.`,
});

export { DAY_NAMES };
