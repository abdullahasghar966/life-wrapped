import { NF_COUNTRIES_MIN } from '../constants';
import { listOf } from '../copy';
import { define } from '../helpers';
import type { DataCtx, QueryFn } from '../types';
import { nfWhere } from './shared';

export interface NetflixCountries {
  countries: Array<{ code: string; name: string | null; hours: number }>;
}

async function countries(q: QueryFn, ctx: DataCtx) {
  const [w, p] = nfWhere(ctx);
  return q<NetflixCountries['countries'][number]>(
    `SELECT country_code AS code, arg_max(country_name, duration_s) AS name,
            ROUND(SUM(duration_s) / 3600.0, 1)::DOUBLE AS hours
     FROM netflix_views WHERE ${w} AND country_code IS NOT NULL
     GROUP BY country_code ORDER BY SUM(duration_s) DESC, code`,
    p,
  );
}

export default define<NetflixCountries>({
  id: 'netflix.countries',
  deck: 'netflix',
  order: 9,
  title: 'Around the world',
  requires: async (q, ctx) => (await countries(q, ctx)).length >= NF_COUNTRIES_MIN,
  run: async (q, ctx) => ({ countries: await countries(q, ctx) }),
  a11yText: (p) =>
    `You streamed from ${p.countries.length} countries: ${listOf(p.countries.map((c) => c.name ?? c.code))}.`,
});
