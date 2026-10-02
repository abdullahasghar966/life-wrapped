import { n } from '../copy';
import { define } from '../helpers';
import { secondsByPlatform, sum, type PerPlatform } from './shared';

export interface LifeTotal {
  hours: number;
  days: number;
  /** True when YouTube (an estimate) is part of the total, so the UI shows "≈". */
  estimated: boolean;
  hoursByPlatform: PerPlatform;
}

export default define<LifeTotal>({
  id: 'life.total',
  deck: 'life',
  order: 2,
  title: 'Total time',
  requires: () => true,
  async run(q, ctx) {
    const s = await secondsByPlatform(q, ctx);
    const total = sum(s);
    if (total <= 0) return null;
    return {
      hours: Math.round(total / 3600),
      days: Math.round(total / 86400),
      estimated: s.youtube > 0,
      hoursByPlatform: {
        spotify: Math.round(s.spotify / 3600),
        youtube: Math.round(s.youtube / 3600),
        netflix: Math.round(s.netflix / 3600),
      },
    };
  },
  a11yText: (p) =>
    `${p.estimated ? 'About ' : ''}${n(p.hours)} hours in total, that's ${n(p.days)} days.${p.estimated ? ' YouTube time is estimated.' : ''}`,
});
