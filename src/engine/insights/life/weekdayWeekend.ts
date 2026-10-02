import { define, round1, round3, weekdayWeekendDays } from '../helpers';
import {
  PLATFORM_LABEL,
  secondsByPlatform,
  sum,
  topPlatform,
  type PerPlatform,
  type Platform,
} from './shared';

interface Side {
  /** Average hours per day. */
  perDay: number;
  shares: PerPlatform;
  top: Platform;
}

export interface LifeWeekdayWeekend {
  weekday: Side;
  weekend: Side;
  /** The platform whose share grows most at weekends. */
  weekendWinner: Platform;
}

function side(s: PerPlatform, days: number): Side {
  const total = Math.max(1, sum(s));
  return {
    perDay: round1(sum(s) / 3600 / Math.max(1, days)),
    shares: {
      spotify: round3(s.spotify / total),
      youtube: round3(s.youtube / total),
      netflix: round3(s.netflix / total),
    },
    top: topPlatform(s),
  };
}

export default define<LifeWeekdayWeekend>({
  id: 'life.weekdayWeekend',
  deck: 'life',
  order: 6,
  title: 'Weekday vs weekend',
  requires: () => true,
  async run(q, ctx) {
    const wd = await secondsByPlatform(q, ctx, 'AND local_dow NOT IN (0, 6)');
    const we = await secondsByPlatform(q, ctx, 'AND local_dow IN (0, 6)');
    if (sum(wd) + sum(we) <= 0) return null;
    const days = weekdayWeekendDays(ctx.period.start, ctx.period.end);
    const weekday = side(wd, days.weekday);
    const weekend = side(we, days.weekend);
    const weekendWinner = ctx.availablePlatforms.reduce((a, b) =>
      weekend.shares[b] - weekday.shares[b] > weekend.shares[a] - weekday.shares[a] ? b : a,
    );
    return { weekday, weekend, weekendWinner };
  },
  a11yText: (p) =>
    `On weekdays you spent about ${p.weekday.perDay} hours a day, on weekends ${p.weekend.perDay}. Weekends belong to ${PLATFORM_LABEL[p.weekendWinner]}.`,
});
