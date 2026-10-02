import { NF_TOP5_MIN_TITLES } from '../constants';
import { listOf } from '../copy';
import { define, one } from '../helpers';
import { nfWhere } from './shared';

export interface NetflixTopTitles {
  titles: Array<{ title: string; hours: number; isSeries: boolean; episodes: number }>;
}

const TITLE = `CASE WHEN is_series THEN series ELSE title_raw END`;

export default define<NetflixTopTitles>({
  id: 'netflix.topTitles',
  deck: 'netflix',
  order: 4,
  title: 'Top 5 titles',
  async requires(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const r = await one<{ n: number }>(
      q,
      `SELECT COUNT(DISTINCT ${TITLE})::DOUBLE AS n FROM netflix_views WHERE ${w}`,
      p,
    );
    return (r?.n ?? 0) >= NF_TOP5_MIN_TITLES;
  },
  async run(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const rows = await q<NetflixTopTitles['titles'][number]>(
      `SELECT ${TITLE} AS title, ROUND(SUM(duration_s) / 3600.0, 1)::DOUBLE AS hours,
              bool_or(is_series) AS "isSeries", COUNT(DISTINCT title_raw)::DOUBLE AS episodes
       FROM netflix_views WHERE ${w}
       GROUP BY 1 ORDER BY SUM(duration_s) DESC, title LIMIT 5`,
      p,
    );
    return rows.length === 5 ? { titles: rows } : null;
  },
  a11yText: (p) => `Your top 5 titles: ${listOf(p.titles.map((t) => t.title))}.`,
});
