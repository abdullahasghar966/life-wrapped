import { afterAll, beforeAll, expect, it } from 'vitest';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';
import {
  netflixViewingActivity,
  spotifyExtendedFiles,
  youtubeWatchHistory,
} from '../helpers/bigExport';

/**
 * Performance budgets (MASTER_PROMPT §15). This suite runs on its own, with no
 * other test files in parallel, so the timings mean something (ADR-019).
 */
let t: TestEngine;
beforeAll(async () => {
  t = await createTestEngine();
  await t.engine.ping(); // warm up DuckDB so timings measure generation + ingestion only
});
afterAll(() => t.db.close());

it('generates and ingests the sample in under 3 seconds', async () => {
  const start = performance.now();
  await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
  const ms = performance.now() - start;
  console.info(`[budget] sample generate + ingest: ${Math.round(ms)} ms`);
  expect(ms).toBeLessThan(3000);
});

it('ingests 500k rows of real-format exports in under 10 seconds', async () => {
  const end = Date.parse('2026-06-14T12:00:00Z');
  const files = [
    ...spotifyExtendedFiles(350_000, end),
    youtubeWatchHistory(120_000, end),
    netflixViewingActivity(30_000, end),
  ];
  const big = await createTestEngine();
  try {
    await big.engine.ping();
    const start = performance.now();
    const summary = await big.engine.ingest(files, { timeZone: TEST_TZ });
    const ms = performance.now() - start;
    const rows = summary.files.reduce((n, f) => n + f.rows, 0);
    console.info(`[budget] ${rows} rows ingested end to end: ${Math.round(ms)} ms`);
    expect(rows).toBe(500_000);
    expect(ms).toBeLessThan(10_000);
  } finally {
    big.db.close();
  }
}, 120_000);

it('computes every deck in under a second each', async () => {
  for (const deck of ['spotify', 'youtube', 'netflix', 'life'] as const) {
    const start = performance.now();
    const cards = await t.engine.getDeck(deck);
    const ms = performance.now() - start;
    console.info(`[budget] ${deck} deck (${cards.length} cards): ${Math.round(ms)} ms`);
    expect(ms).toBeLessThan(1000);
  }
});
