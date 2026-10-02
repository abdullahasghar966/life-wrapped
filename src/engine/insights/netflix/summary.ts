import { NF_BINGE_MIN_EPISODES, NF_PERSONA_THRESHOLDS, NIGHT_END_HOUR } from '../constants';
import { n } from '../copy';
import { define, one } from '../helpers';
import { bingeRecord, nfWhere } from './shared';

export type NetflixPersona = 'Binger' | 'Night Watcher' | 'Movie Buff' | 'Series Loyalist';

export interface NetflixSummary {
  hours: number;
  topSeries: string | null;
  binge: { series: string; count: number } | null;
  persona: NetflixPersona;
}

export default define<NetflixSummary>({
  id: 'netflix.summary',
  deck: 'netflix',
  order: 10,
  title: 'Your year on screen',
  requires: () => true,
  async run(q, ctx) {
    const [w, p] = nfWhere(ctx);
    const t = await one<{ total: number; night: number; movies: number }>(
      q,
      `SELECT SUM(duration_s)::DOUBLE AS total,
              COALESCE(SUM(duration_s) FILTER (WHERE local_hour < ${NIGHT_END_HOUR}), 0)::DOUBLE AS night,
              COALESCE(SUM(duration_s) FILTER (WHERE NOT is_series), 0)::DOUBLE AS movies
       FROM netflix_views WHERE ${w}`,
      p,
    );
    if (!t?.total) return null;
    const top = await one<{ series: string; s: number }>(
      q,
      `SELECT series, SUM(duration_s)::DOUBLE AS s FROM netflix_views WHERE ${w} AND is_series
       GROUP BY series ORDER BY s DESC, series LIMIT 1`,
      p,
    );
    const binge = await bingeRecord(q, ctx);
    const T = NF_PERSONA_THRESHOLDS;
    const scores: Array<[NetflixPersona, number]> = [
      ['Binger', (binge?.count ?? 0) / T.binger],
      ['Night Watcher', t.night / t.total / T.nightWatcher],
      ['Movie Buff', t.movies / t.total / T.movieBuff],
      ['Series Loyalist', (top?.s ?? 0) / t.total / T.seriesLoyalist],
    ];
    const persona = scores.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    return {
      hours: Math.round(t.total / 3600),
      topSeries: top?.series ?? null,
      binge:
        binge && binge.count >= NF_BINGE_MIN_EPISODES
          ? { series: binge.series, count: binge.count }
          : null,
      persona,
    };
  },
  a11yText: (p) =>
    [
      `Summary: ${n(p.hours)} hours of Netflix.`,
      p.topSeries && `Top series ${p.topSeries}.`,
      p.binge && `Binge record ${p.binge.count} episodes of ${p.binge.series}.`,
      `You're a ${p.persona}.`,
    ]
      .filter(Boolean)
      .join(' '),
  share: (p) => ({
    cardType: 'netflix.summary',
    theme: 'binge',
    numbers: { hours: p.hours, ...(p.binge ? { bingeEpisodes: p.binge.count } : {}) },
    names: { persona: p.persona, ...(p.topSeries ? { topSeries: p.topSeries } : {}) },
  }),
});
