import { YT_TOP_SEARCH_TERMS } from '../constants';
import { n } from '../copy';
import { inPeriod } from '../filters';
import { define, one } from '../helpers';

/** Common words that would otherwise top every search list. */
const STOP_WORDS = new Set(
  'a an and are as at be by can do does for from how i in is it my of on or the to vs what when where which who why with you your'.split(
    ' ',
  ),
);

export interface YoutubeSearches {
  total: number;
  topQueries: Array<{ query: string; count: number }>;
  topWords: Array<{ word: string; count: number }>;
  first: { query: string; date: string } | null;
}

export default define<YoutubeSearches>({
  id: 'youtube.searches',
  deck: 'youtube',
  order: 9,
  title: 'Searches',
  async requires(q, ctx) {
    if (!ctx.includeSearches) return false;
    const [w, p] = inPeriod(ctx);
    const r = await one<{ n: number }>(
      q,
      `SELECT COUNT(*)::DOUBLE AS n FROM youtube_searches WHERE ${w}`,
      p,
    );
    return (r?.n ?? 0) > 0;
  },
  async run(q, ctx) {
    const [w, p] = inPeriod(ctx);
    const rows = await q<{ query: string; count: number }>(
      `SELECT lower(trim(regexp_replace(query, '\\s+', ' ', 'g'))) AS query, COUNT(*)::DOUBLE AS count
       FROM youtube_searches WHERE ${w} GROUP BY 1 ORDER BY count DESC, query`,
      p,
    );
    const first = await one<{ query: string; date: string }>(
      q,
      `SELECT query, strftime(local_date, '%Y-%m-%d') AS date FROM youtube_searches WHERE ${w}
       ORDER BY ts_utc LIMIT 1`,
      p,
    );
    const words = new Map<string, number>();
    for (const r of rows) {
      for (const word of r.query.split(/[^\p{L}\p{N}']+/u)) {
        if (word.length < 2 || STOP_WORDS.has(word)) continue;
        words.set(word, (words.get(word) ?? 0) + r.count);
      }
    }
    const topWords = [...words.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));
    return {
      total: rows.reduce((a, r) => a + r.count, 0),
      topQueries: rows.slice(0, YT_TOP_SEARCH_TERMS),
      topWords,
      first: first ?? null,
    };
  },
  a11yText: (p) =>
    `You searched YouTube ${n(p.total)} times. Your most searched phrase was ${p.topQueries[0]?.query ?? 'nothing in particular'}.`,
});
