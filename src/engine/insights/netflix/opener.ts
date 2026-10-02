import { fmtRange } from '../copy';
import { define, periodLastDay } from '../helpers';

export interface NetflixOpener {
  periodLabel: string;
  start: string;
  end: string;
  profile: string;
}

export default define<NetflixOpener>({
  id: 'netflix.opener',
  deck: 'netflix',
  order: 1,
  title: 'Previously on… you',
  requires: (_q, ctx) => !!ctx.netflixProfile,
  run: async (_q, ctx) => ({
    periodLabel: ctx.period.label,
    start: ctx.period.start,
    end: periodLastDay(ctx),
    profile: ctx.netflixProfile ?? '',
  }),
  a11yText: (p) =>
    `Previously on… you. Netflix viewing for ${p.profile}, ${fmtRange(p.start, p.end)}.`,
});
