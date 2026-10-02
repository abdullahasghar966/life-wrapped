import { pct } from '../copy';
import { define, one } from '../helpers';
import { nfWhere } from './shared';

export interface NetflixSplit {
  seriesHours: number;
  movieHours: number;
  seriesShare: number;
  topMovie: { title: string; hours: number } | null;
}

export default define<NetflixSplit>({
  id: 'netflix.split',
  deck: 'netflix',
  order: 6,
  title: 'Movies vs series',
  async requires(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const r = await one<{ s: number; m: number }>(
      q,
      `SELECT COUNT(*) FILTER (WHERE is_series)::DOUBLE AS s, COUNT(*) FILTER (WHERE NOT is_series)::DOUBLE AS m
       FROM netflix_views WHERE ${w}`,
      p,
    );
    return (r?.s ?? 0) > 0 && (r?.m ?? 0) > 0;
  },
  async run(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const r = await one<{ s: number; m: number }>(
      q,
      `SELECT COALESCE(SUM(duration_s) FILTER (WHERE is_series), 0)::DOUBLE AS s,
              COALESCE(SUM(duration_s) FILTER (WHERE NOT is_series), 0)::DOUBLE AS m
       FROM netflix_views WHERE ${w}`,
      p,
    );
    if (!r) return null;
    const movie = await one<{ title: string; hours: number }>(
      q,
      `SELECT title_raw AS title, ROUND(SUM(duration_s) / 3600.0, 1)::DOUBLE AS hours
       FROM netflix_views WHERE ${w} AND NOT is_series
       GROUP BY title_raw ORDER BY SUM(duration_s) DESC, title_raw LIMIT 1`,
      p,
    );
    return {
      seriesHours: Math.round(r.s / 360) / 10,
      movieHours: Math.round(r.m / 360) / 10,
      seriesShare: Math.round((r.s / Math.max(1, r.s + r.m)) * 1000) / 1000,
      topMovie: movie ?? null,
    };
  },
  a11yText: (p) =>
    p.seriesShare >= 0.5
      ? `You're a series person: ${pct(p.seriesShare)} of your viewing was episodes.`
      : `You're a movie person: ${pct(1 - p.seriesShare)} of your viewing was films.`,
});
