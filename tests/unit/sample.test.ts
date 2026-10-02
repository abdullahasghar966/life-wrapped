import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { IngestSummary } from '@/engine/types';
import { generateSample } from '@/engine/sample/generator';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

describe('sample generator', () => {
  let t: TestEngine;
  let summary: IngestSummary;
  let ms = 0;

  beforeAll(async () => {
    t = await createTestEngine();
    await t.engine.ping(); // warm up DuckDB so timing measures generation + ingestion
    const start = performance.now();
    summary = await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
    ms = performance.now() - start;
  });
  afterAll(() => t.db.close());

  it('is deterministic for the same seed, time zone and date', () => {
    const a = generateSample({ seed: 7, timeZone: TEST_TZ, today: '2026-06-15' });
    const b = generateSample({ seed: 7, timeZone: TEST_TZ, today: '2026-06-15' });
    expect(a.map((f) => f.text)).toEqual(b.map((f) => f.text));
  });

  it('generates and ingests in under 3 seconds', () => {
    console.info(`sample generate+ingest: ${Math.round(ms)} ms`);
    expect(ms).toBeLessThan(3000);
  });

  it('has the expected volumes', () => {
    console.info(
      JSON.stringify(summary.counts),
      JSON.stringify(summary.files.map((f) => f.message)),
    );
    expect(summary.counts.spotifyPlays).toBeGreaterThan(50_000);
    expect(summary.counts.spotifyPlays).toBeLessThan(70_000);
    expect(summary.counts.spotifyPodcast).toBeGreaterThan(0);
    expect(summary.counts.youtubeWatches).toBeGreaterThan(8_000);
    expect(summary.counts.youtubeWatches).toBeLessThan(11_000);
    expect(summary.counts.youtubeSearches).toBe(600);
    expect(summary.netflixProfiles.map((p) => p.name)).toEqual(['Alex', 'Sam']);
    expect(summary.options.netflixProfile).toBe('Alex');
    expect(summary.availableDecks).toEqual(['spotify', 'youtube', 'netflix', 'life']);
    expect(summary.isSample).toBe(true);
  });

  it('plants a 27-play day for one song', async () => {
    const [r] = await t.q<{ track: string; n: number }>(
      `SELECT track, COUNT(*)::DOUBLE AS n FROM spotify_plays WHERE kind='music' AND ms_played >= 30000
       GROUP BY track, artist, local_date ORDER BY n DESC LIMIT 1`,
    );
    expect(r).toEqual({ track: 'Paper Moons', n: 27 });
  });

  it('plants a 63-day listening streak', async () => {
    const [r] = await t.q<{ streak: number }>(
      `WITH d AS (SELECT DISTINCT local_date FROM spotify_plays),
       g AS (SELECT local_date, local_date - CAST(ROW_NUMBER() OVER (ORDER BY local_date) AS INTEGER) AS grp FROM d)
       SELECT MAX(c)::DOUBLE AS streak FROM (SELECT COUNT(*) AS c FROM g GROUP BY grp)`,
    );
    expect(r?.streak).toBe(63);
  });

  it('drops ads, trailers and short Netflix views', async () => {
    const yt = summary.files.find((f) => f.kind === 'youtube_watch');
    expect(yt?.skipped).toBeGreaterThanOrEqual(140);
    const nf = summary.files.find((f) => f.kind === 'netflix_viewing');
    expect(nf?.skipped).toBeGreaterThan(50);
    const [{ n } = { n: -1 }] = await t.q<{ n: number }>(
      `SELECT COUNT(*)::DOUBLE AS n FROM netflix_views WHERE duration_s < 60 OR title_raw LIKE '%_hook_%'`,
    );
    expect(n).toBe(0);
  });
});
