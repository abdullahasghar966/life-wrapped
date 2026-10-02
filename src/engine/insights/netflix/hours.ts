import { NF_MOVIE_HOURS } from '../constants';
import { n } from '../copy';
import { define, one } from '../helpers';
import { nfWhere } from './shared';

export interface NetflixHours {
  hours: number;
  /** Hours ÷ a typical film's length: "about N movies' worth". */
  movieEquivalents: number;
  titles: number;
  days: number;
}

export default define<NetflixHours>({
  id: 'netflix.hours',
  deck: 'netflix',
  order: 2,
  title: 'Hours watched',
  requires: () => true,
  async run(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const r = await one<{ s: number; titles: number; days: number }>(
      q,
      `SELECT SUM(duration_s)::DOUBLE AS s,
              COUNT(DISTINCT CASE WHEN is_series THEN series ELSE title_raw END)::DOUBLE AS titles,
              COUNT(DISTINCT local_date)::DOUBLE AS days
       FROM netflix_views WHERE ${w}`,
      p,
    );
    if (!r?.s) return null;
    const hours = Math.round(r.s / 3600);
    return {
      hours,
      movieEquivalents: Math.round(r.s / 3600 / NF_MOVIE_HOURS),
      titles: r.titles,
      days: r.days,
    };
  },
  a11yText: (p) =>
    `You watched ${n(p.hours)} hours of Netflix, about ${n(p.movieEquivalents)} movies' worth.`,
});
