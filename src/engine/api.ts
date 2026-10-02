import type { Db } from './db/types';
import { loadDataset } from './db/load';
import { availablePlatforms, decksFor } from './insights/availability';
import { DEFAULT_PERIOD_MONTHS } from './insights/constants';
import { runDeck } from './insights/registry';
import './insights';
import type { DataCtx, InsightResult, QueryFn } from './insights/types';
import { Dataset, ingestFiles } from './ingest/pipeline';
import { addDays, addMonths, defaultTimeZone, isValidTimeZone, TimeConverter } from './ingest/time';
import { CancelledError } from './ingest/unzip';
import { DEFAULT_SEED, generateSample } from './sample/generator';
import type {
  DateRange,
  DeckId,
  EngineOptions,
  FileReport,
  IngestProgress,
  IngestSummary,
  NetflixProfile,
  Period,
} from './types';

export interface EngineDeps {
  createDb: () => Promise<Db>;
  /** Injected so tests are deterministic. */
  now?: () => number;
}

export type OptionsPatch = Partial<
  Pick<
    EngineOptions,
    'timeZone' | 'includePrivateSessions' | 'includeSearches' | 'netflixProfile'
  > & {
    period: string | null;
  }
>;

export interface EngineApi {
  /** Health check used by tests: runs `SELECT 42` in DuckDB. */
  ping(): Promise<number>;
  ingest(
    files: File[],
    opts: { timeZone: string },
    onProgress?: (p: IngestProgress) => void,
  ): Promise<IngestSummary>;
  cancelIngest(): Promise<void>;
  loadSample(seed?: number, opts?: { timeZone?: string }): Promise<IngestSummary>;
  setOptions(o: OptionsPatch): Promise<IngestSummary>;
  summary(): Promise<IngestSummary | null>;
  availableDecks(): Promise<DeckId[]>;
  getDeck(deck: DeckId): Promise<InsightResult[]>;
  clear(): Promise<void>;
}

const EMPTY_COUNTS: IngestSummary['counts'] = {
  spotifyPlays: 0,
  spotifyMusic: 0,
  spotifyPodcast: 0,
  youtubeWatches: 0,
  youtubeSearches: 0,
  netflixViews: 0,
};

export function createEngine(deps: EngineDeps): EngineApi {
  const now = deps.now ?? (() => Date.now());
  let dbPromise: Promise<Db> | null = null;
  const getDb = () => (dbPromise ??= deps.createDb());

  let dataset = new Dataset();
  let reports: FileReport[] = [];
  let isSample = false;
  let youtubeHtmlFound = false;
  let cancelled = false;
  let loaded = false;
  let options: EngineOptions = {
    timeZone: defaultTimeZone(),
    periodId: null,
    includePrivateSessions: false,
    includeSearches: false,
    netflixProfile: null,
  };
  let cachedSummary: IngestSummary | null = null;
  const deckCache = new Map<DeckId, InsightResult[]>();

  const q: QueryFn = async (sql, params) => (await getDb()).query(sql, params);

  async function reload() {
    const db = await getDb();
    await loadDataset(db, dataset, options.timeZone);
    loaded = true;
  }

  async function periods(): Promise<Period[]> {
    const [row] = await q<{ last: string | null }>(
      `SELECT strftime(max(d), '%Y-%m-%d') AS last FROM (
         SELECT max(local_date) AS d FROM spotify_plays
         UNION ALL SELECT max(local_date) FROM youtube_watches
         UNION ALL SELECT max(local_date) FROM netflix_views)`,
    );
    if (!row?.last) return [];
    const end = addDays(row.last, 1);
    const out: Period[] = [
      { id: 'last12', start: addMonths(end, -DEFAULT_PERIOD_MONTHS), end, label: 'Last 12 months' },
    ];
    const years = await q<{ y: number }>(
      `SELECT DISTINCT y FROM (
         SELECT year(local_date) AS y FROM spotify_plays
         UNION ALL SELECT year(local_date) FROM youtube_watches
         UNION ALL SELECT year(local_date) FROM netflix_views) ORDER BY y DESC`,
    );
    for (const { y } of years) {
      out.push({ id: String(y), start: `${y}-01-01`, end: `${y + 1}-01-01`, label: String(y) });
    }
    return out;
  }

  async function profiles(): Promise<NetflixProfile[]> {
    return q<{ name: string; hours: number; views: number }>(
      `SELECT profile AS name, ROUND(SUM(duration_s) / 3600.0, 1)::DOUBLE AS hours, COUNT(*)::DOUBLE AS views
       FROM netflix_views GROUP BY profile ORDER BY hours DESC, name`,
    );
  }

  async function ranges(): Promise<IngestSummary['ranges']> {
    const out: IngestSummary['ranges'] = {};
    for (const [key, table] of [
      ['spotify', 'spotify_plays'],
      ['youtube', 'youtube_watches'],
      ['netflix', 'netflix_views'],
    ] as const) {
      const [r] = await q<{ first: string | null; last: string | null }>(
        `SELECT strftime(min(local_date), '%Y-%m-%d') AS first, strftime(max(local_date), '%Y-%m-%d') AS last FROM ${table}`,
      );
      if (r?.first && r.last) out[key] = { first: r.first, last: r.last } satisfies DateRange;
    }
    return out;
  }

  async function currentPeriod(all: Period[]): Promise<Period | null> {
    return all.find((p) => p.id === options.periodId) ?? all[0] ?? null;
  }

  async function ctx(): Promise<DataCtx | null> {
    const all = await periods();
    const period = await currentPeriod(all);
    if (!period) return null;
    const r = await ranges();
    const base = {
      period,
      timeZone: options.timeZone,
      netflixProfile: options.netflixProfile,
      includePrivateSessions: options.includePrivateSessions,
      includeSearches: options.includeSearches,
      isSample,
      dataStart: {
        spotify: r.spotify?.first,
        youtube: r.youtube?.first,
        netflix: r.netflix?.first,
      },
    };
    return { ...base, availablePlatforms: await availablePlatforms(q, base) };
  }

  async function buildSummary(): Promise<IngestSummary> {
    const all = loaded ? await periods() : [];
    const period = await currentPeriod(all);
    const c = loaded ? await ctx() : null;
    const [counts] = loaded
      ? await q<IngestSummary['counts']>(
          `SELECT
             (SELECT COUNT(*) FROM spotify_plays)::DOUBLE AS "spotifyPlays",
             (SELECT COUNT(*) FROM spotify_plays WHERE kind = 'music')::DOUBLE AS "spotifyMusic",
             (SELECT COUNT(*) FROM spotify_plays WHERE kind = 'podcast')::DOUBLE AS "spotifyPodcast",
             (SELECT COUNT(*) FROM youtube_watches)::DOUBLE AS "youtubeWatches",
             (SELECT COUNT(*) FROM youtube_searches)::DOUBLE AS "youtubeSearches",
             (SELECT COUNT(*) FROM netflix_views)::DOUBLE AS "netflixViews"`,
        )
      : [EMPTY_COUNTS];
    cachedSummary = {
      isSample,
      files: reports,
      counts: counts ?? EMPTY_COUNTS,
      ranges: loaded ? await ranges() : {},
      netflixProfiles: loaded ? await profiles() : [],
      options: { ...options, periodId: period?.id ?? null },
      period,
      periods: all,
      availableDecks: c ? decksFor(c.availablePlatforms) : [],
      youtubeHtmlFound,
    };
    return cachedSummary;
  }

  async function afterLoad() {
    deckCache.clear();
    await reload();
    const profs = await profiles();
    if (!options.netflixProfile || !profs.some((p) => p.name === options.netflixProfile)) {
      // Default "you" = the profile with the most hours.
      options.netflixProfile = profs[0]?.name ?? null;
    }
    return buildSummary();
  }

  function resetState() {
    dataset = new Dataset();
    reports = [];
    isSample = false;
    youtubeHtmlFound = false;
    loaded = false;
    cachedSummary = null;
    deckCache.clear();
    options = {
      ...options,
      periodId: null,
      includePrivateSessions: false,
      includeSearches: false,
      netflixProfile: null,
    };
  }

  return {
    async ping() {
      const rows = await q<{ answer: number }>('SELECT 42 AS answer');
      return rows[0]?.answer ?? -1;
    },

    async ingest(files, opts, onProgress) {
      if (isSample) resetState();
      cancelled = false;
      if (isValidTimeZone(opts.timeZone)) options.timeZone = opts.timeZone;
      const progress = (p: IngestProgress) => {
        try {
          void onProgress?.(p);
        } catch {
          /* the UI may have gone away; ingestion carries on */
        }
      };
      try {
        const outcome = await ingestFiles(files, dataset, progress, () => cancelled);
        reports = [...reports, ...outcome.reports];
        youtubeHtmlFound ||= outcome.youtubeHtmlFound;
      } catch (err) {
        if (err instanceof CancelledError) {
          progress({ stage: 'done', filesDone: 0, filesTotal: files.length, fraction: 0 });
          return buildSummary();
        }
        throw err;
      }
      progress({
        stage: 'loading',
        filesDone: files.length,
        filesTotal: files.length,
        fraction: 0.85,
      });
      const summary = dataset.isEmpty() ? await buildSummary() : await afterLoad();
      progress({ stage: 'done', filesDone: files.length, filesTotal: files.length, fraction: 1 });
      return summary;
    },

    async cancelIngest() {
      cancelled = true;
    },

    async loadSample(seed = DEFAULT_SEED, opts = {}) {
      resetState();
      if (opts.timeZone && isValidTimeZone(opts.timeZone)) options.timeZone = opts.timeZone;
      const today = new TimeConverter(options.timeZone).toLocal(now()).date;
      const files = generateSample({ seed, timeZone: options.timeZone, today }).map(
        (f) =>
          new File([f.text], f.name, {
            type: f.name.endsWith('.csv') ? 'text/csv' : 'application/json',
          }),
      );
      const outcome = await ingestFiles(files, dataset);
      reports = outcome.reports;
      isSample = true;
      options.includeSearches = true;
      options.netflixProfile = 'Alex';
      return afterLoad();
    },

    async setOptions(o) {
      let needsReload = false;
      if (o.timeZone && o.timeZone !== options.timeZone && isValidTimeZone(o.timeZone)) {
        options.timeZone = o.timeZone;
        needsReload = true;
      }
      if (o.period !== undefined) options.periodId = o.period;
      if (o.includePrivateSessions !== undefined)
        options.includePrivateSessions = o.includePrivateSessions;
      if (o.includeSearches !== undefined) options.includeSearches = o.includeSearches;
      if (o.netflixProfile !== undefined) options.netflixProfile = o.netflixProfile;
      deckCache.clear();
      if (needsReload && !dataset.isEmpty()) await reload();
      return buildSummary();
    },

    async summary() {
      return loaded || reports.length > 0 ? (cachedSummary ?? buildSummary()) : null;
    },

    async availableDecks() {
      if (!loaded) return [];
      const c = await ctx();
      return c ? decksFor(c.availablePlatforms) : [];
    },

    async getDeck(deck) {
      if (!loaded) return [];
      const cached = deckCache.get(deck);
      if (cached) return cached;
      const c = await ctx();
      if (!c) return [];
      const decks = decksFor(c.availablePlatforms);
      if (!decks.includes(deck)) return [];
      const results = await runDeck(deck, q, c);
      deckCache.set(deck, results);
      return results;
    },

    async clear() {
      resetState();
      if (dbPromise) {
        const db = await getDb();
        await db.exec(
          'DROP VIEW IF EXISTS media_events; DROP TABLE IF EXISTS spotify_plays; DROP TABLE IF EXISTS youtube_watches; DROP TABLE IF EXISTS youtube_searches; DROP TABLE IF EXISTS netflix_views;',
        );
      }
    },
  };
}
