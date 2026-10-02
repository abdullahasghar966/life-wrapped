import { daypartOf, define, weekdayWeekendDays, type Daypart } from '../helpers';
import {
  lifeWhere,
  PLATFORM_NOUN,
  PLATFORMS,
  topPlatform,
  zero,
  type PerPlatform,
  type Platform,
} from './shared';

export interface LifeRhythm {
  /** Hours per local hour of the day, per platform. */
  hours: Array<{ hour: number } & PerPlatform>;
  /**
   * The platform that most defines each daypart: the highest share of that
   * daypart relative to its share of all time (so the biggest platform doesn't
   * win every slot).
   */
  dayparts: Record<Daypart, Platform | null>;
  /** The platform whose per-day time grows most on weekends. */
  weekends: Platform | null;
}

export default define<LifeRhythm>({
  id: 'life.rhythm',
  deck: 'life',
  order: 4,
  title: 'Daily rhythm',
  requires: () => true,
  async run(q, ctx) {
    const [w, p] = lifeWhere(ctx);
    const rows = await q<{ platform: Platform; h: number; weekend: boolean; s: number }>(
      `SELECT platform, local_hour::DOUBLE AS h, local_dow IN (0, 6) AS weekend, SUM(seconds)::DOUBLE AS s
       FROM media_events WHERE ${w} GROUP BY ALL`,
      p,
    );
    if (rows.length === 0) return null;
    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, ...zero() }));
    const parts: Record<Daypart, PerPlatform> = {
      night: zero(),
      morning: zero(),
      afternoon: zero(),
      evening: zero(),
    };
    const weekday = zero();
    const weekend = zero();
    for (const r of rows) {
      hours[r.h]![r.platform] += r.s / 3600;
      parts[daypartOf(r.h)][r.platform] += r.s;
      (r.weekend ? weekend : weekday)[r.platform] += r.s;
    }
    for (const h of hours) for (const pl of PLATFORMS) h[pl] = Math.round(h[pl] * 10) / 10;
    const days = weekdayWeekendDays(ctx.period.start, ctx.period.end);
    let weekends: Platform | null = null;
    let bestRatio = 1;
    for (const pl of ctx.availablePlatforms) {
      const wd = weekday[pl] / Math.max(1, days.weekday);
      const we = weekend[pl] / Math.max(1, days.weekend);
      const ratio = wd > 0 ? we / wd : we > 0 ? Infinity : 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        weekends = pl;
      }
    }
    const overall = zero();
    for (const pl of PLATFORMS) overall[pl] = weekday[pl] + weekend[pl];
    const grand = overall.spotify + overall.youtube + overall.netflix;
    const dayparts = Object.fromEntries(
      (Object.keys(parts) as Daypart[]).map((d) => {
        const total = parts[d].spotify + parts[d].youtube + parts[d].netflix;
        if (total <= 0) return [d, null];
        const lift = zero();
        for (const pl of PLATFORMS) {
          lift[pl] = overall[pl] > 0 ? parts[d][pl] / total / (overall[pl] / grand) : 0;
        }
        return [d, topPlatform(lift)];
      }),
    ) as Record<Daypart, Platform | null>;
    return { hours, dayparts, weekends };
  },
  a11yText: (p) =>
    [
      p.dayparts.morning && `Mornings: ${PLATFORM_NOUN[p.dayparts.morning]}.`,
      p.dayparts.night && `Nights: ${PLATFORM_NOUN[p.dayparts.night]}.`,
      p.weekends && `Weekends: ${PLATFORM_NOUN[p.weekends]}.`,
    ]
      .filter(Boolean)
      .join(' ') || 'Your daily rhythm across platforms.',
});
