import { YT_RABBIT_HOLE_MIN_MIN } from '../constants';
import { clock, day } from '../copy';
import { define } from '../helpers';
import { longestSession, type RabbitHole } from './shared';

export const UNAVAILABLE_TITLE = 'a video that’s no longer available';

export default define<RabbitHole>({
  id: 'youtube.rabbitHole',
  deck: 'youtube',
  order: 5,
  title: 'Rabbit hole',
  requires: async (q, ctx) =>
    ((await longestSession(q, ctx))?.minutes ?? 0) >= YT_RABBIT_HOLE_MIN_MIN,
  run: longestSession,
  a11yText: (p) =>
    `Your longest rabbit hole was on ${day(p.date)}: it started with ${p.firstTitle ?? UNAVAILABLE_TITLE}, and ${p.videos} videos later it was ${clock(p.endMinute)}.`,
});
