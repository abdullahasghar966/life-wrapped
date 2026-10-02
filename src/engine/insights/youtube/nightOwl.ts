import { MIN_ACTIVE_DAYS_FOR_CLOCK, NIGHT_END_HOUR } from '../constants';
import { hour12, pct } from '../copy';
import { inPeriod } from '../filters';
import { argmax, daypartTotals, define, hourly } from '../helpers';
import { activeDays } from './shared';

export interface YoutubeNightOwl {
  /** Watches per local hour. */
  hours: number[];
  nightShare: number;
  peakHour: number;
  dayparts: { night: number; morning: number; afternoon: number; evening: number };
}

export default define<YoutubeNightOwl>({
  id: 'youtube.nightOwl',
  deck: 'youtube',
  order: 7,
  title: 'Night owl',
  requires: async (q, ctx) => (await activeDays(q, ctx)) >= MIN_ACTIVE_DAYS_FOR_CLOCK,
  async run(q, ctx) {
    const [w, p] = inPeriod(ctx);
    const rows = await q<{ h: number; v: number }>(
      `SELECT local_hour::DOUBLE AS h, COUNT(*)::DOUBLE AS v FROM youtube_watches WHERE ${w} GROUP BY local_hour`,
      p,
    );
    const hours = hourly(rows);
    const total = hours.reduce((a, b) => a + b, 0);
    const night = hours.slice(0, NIGHT_END_HOUR).reduce((a, b) => a + b, 0);
    const parts = daypartTotals(hours);
    const share = (v: number) => Math.round((v / Math.max(1, total)) * 1000) / 1000;
    return {
      hours,
      nightShare: share(night),
      peakHour: argmax(hours),
      dayparts: {
        night: share(parts.night),
        morning: share(parts.morning),
        afternoon: share(parts.afternoon),
        evening: share(parts.evening),
      },
    };
  },
  a11yText: (p) =>
    `${pct(p.nightShare)} of your videos were watched between midnight and 5 AM. Your peak hour was ${hour12(p.peakHour)}.`,
});
