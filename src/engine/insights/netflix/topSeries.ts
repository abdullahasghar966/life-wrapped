import { n } from '../copy';
import { define, one } from '../helpers';
import { nfWhere } from './shared';

export interface NetflixTopSeries {
  series: string;
  hours: number;
  episodes: number;
  seasons: number;
}

export default define<NetflixTopSeries>({
  id: 'netflix.topSeries',
  deck: 'netflix',
  order: 3,
  title: 'Top series',
  async requires(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const r = await one<{ n: number }>(
      q,
      `SELECT COUNT(DISTINCT series)::DOUBLE AS n FROM netflix_views WHERE ${w} AND is_series`,
      p,
    );
    return (r?.n ?? 0) >= 1;
  },
  async run(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const r = await one<NetflixTopSeries>(
      q,
      `SELECT series, ROUND(SUM(duration_s) / 3600.0, 1)::DOUBLE AS hours,
              COUNT(DISTINCT title_raw)::DOUBLE AS episodes, COUNT(DISTINCT season)::DOUBLE AS seasons
       FROM netflix_views WHERE ${w} AND is_series
       GROUP BY series ORDER BY SUM(duration_s) DESC, series LIMIT 1`,
      p,
    );
    return r ?? null;
  },
  a11yText: (p) =>
    `Your top series was ${p.series}: ${n(p.hours)} hours across ${n(p.episodes)} episodes.`,
});
