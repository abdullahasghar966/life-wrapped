import { afterAll, beforeAll, expect, it } from 'vitest';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

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

it('computes every deck in under a second each', async () => {
  for (const deck of ['spotify', 'youtube', 'netflix', 'life'] as const) {
    const start = performance.now();
    const cards = await t.engine.getDeck(deck);
    const ms = performance.now() - start;
    console.info(`[budget] ${deck} deck (${cards.length} cards): ${Math.round(ms)} ms`);
    expect(ms).toBeLessThan(1000);
  }
});
