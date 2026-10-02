import { fmtRange } from '../copy';
import { define, periodLastDay } from '../helpers';

export interface YoutubeOpener {
  periodLabel: string;
  start: string;
  end: string;
}

export default define<YoutubeOpener>({
  id: 'youtube.opener',
  deck: 'youtube',
  order: 1,
  title: 'Now playing: your year on YouTube',
  requires: () => true,
  run: async (_q, ctx) => ({
    periodLabel: ctx.period.label,
    start: ctx.period.start,
    end: periodLastDay(ctx),
  }),
  a11yText: (p) => `Now playing: your year on YouTube, ${fmtRange(p.start, p.end)}.`,
});
