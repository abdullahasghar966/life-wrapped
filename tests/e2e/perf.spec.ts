import { expect, test } from '@playwright/test';

/**
 * Browser timing budgets (§15). This file runs in its own Playwright project
 * after every other spec has finished, one test at a time, so other workers'
 * DuckDB instances don't skew the timings (ADR-019).
 */
test.describe.configure({ mode: 'serial' });

function record(type: string, ms: number) {
  test.info().annotations.push({ type, description: `${Math.round(ms)} ms` });
  console.info(`[budget] ${type}: ${Math.round(ms)} ms`);
}

test('landing → the first card of the sample story in under 5 seconds', async ({ page }) => {
  await page.goto('/');
  const start = Date.now();
  await page.getByRole('link', { name: 'Try with sample data' }).first().click();
  // waitFor reacts to the DOM change itself; expect() would only notice at its next retry.
  await page
    .locator('[data-testid="story-player"] [aria-roledescription="slide"][aria-label^="1 of "]')
    .waitFor({ timeout: 30_000 });
  const ms = Date.now() - start;
  record('landing-to-story', ms);
  expect(ms).toBeLessThan(5_000);
});

test('the sample is generated and loaded in under 3 seconds', async ({ page }) => {
  await page.goto('/start');
  // Booting DuckDB is part of the landing → story budget above; this one is
  // ingestion (§15), timed once /start has warmed the engine up.
  await page.locator('[data-engine-warm="true"]').waitFor({ timeout: 30_000 });
  const start = Date.now();
  await page.getByRole('button', { name: 'Try with sample data' }).click();
  await page.getByRole('heading', { name: 'Here’s what we found' }).waitFor({ timeout: 30_000 });
  const ms = Date.now() - start;
  record('sample-load', ms);
  expect(ms).toBeLessThan(3_000);
});
