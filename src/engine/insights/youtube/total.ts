import { n } from '../copy';
import { inPeriod } from '../filters';
import { define, one } from '../helpers';

export interface YoutubeTotal {
  videos: number;
  /** Estimated hours (§8.3): always shown with "≈" and an explanation. */
  hours: number;
  unavailable: number;
  activeDays: number;
}

export default define<YoutubeTotal>({
  id: 'youtube.total',
  deck: 'youtube',
  order: 2,
  title: 'Videos and watch time',
  requires: () => true,
  async run(q, ctx) {
    const [w, p] = inPeriod(ctx);
    const r = await one<YoutubeTotal>(
      q,
      `SELECT COUNT(*)::DOUBLE AS videos, ROUND(SUM(est_seconds) / 3600.0)::DOUBLE AS hours,
              COUNT(*) FILTER (WHERE unavailable)::DOUBLE AS unavailable,
              COUNT(DISTINCT local_date)::DOUBLE AS "activeDays"
       FROM youtube_watches WHERE ${w}`,
      p,
    );
    return r && r.videos > 0 ? r : null;
  },
  a11yText: (p) =>
    `You watched ${n(p.videos)} videos, about ${n(p.hours)} hours. Watch time is an estimate based on the gaps between videos.`,
});
