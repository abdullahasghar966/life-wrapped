import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { gzipSync } from 'node:zlib';

/** §15: at most 150 KB of JavaScript (gzipped) before the visitor does anything. */
const LANDING_JS_BUDGET = 150 * 1024;

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => [v.id, v.nodes.map((n) => n.target)]);
}

test.describe('app pages', () => {
  for (const path of ['/', '/start', '/privacy', '/offline']) {
    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 390, height: 844 },
    ]) {
      test(`${path} at ${viewport.width}px has no serious accessibility violations`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(await seriousViolations(page)).toEqual([]);
      });
    }
  }

  test('an unknown address gets a friendly 404', async ({ page }) => {
    const res = await page.goto('/no-such-page');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('There’s nothing here');
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('the landing page stays within its JavaScript budget', async ({ page }) => {
    const bodies: Array<Promise<{ url: string; body: Buffer }>> = [];
    page.on('response', (res) => {
      if (res.request().resourceType() !== 'script') return;
      bodies.push(res.body().then((body) => ({ url: res.url(), body })));
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Give idle-time work (link prefetching) a moment to start.
    await page.waitForTimeout(1500);
    await page.waitForLoadState('networkidle');
    const scripts = await Promise.all(bodies);
    const gzipped = scripts.reduce((n, s) => n + gzipSync(s.body).length, 0);
    test
      .info()
      .annotations.push({ type: 'landing-js-gzip-kb', description: (gzipped / 1024).toFixed(1) });
    expect(gzipped).toBeLessThanOrEqual(LANDING_JS_BUDGET);
    // DuckDB, GSAP and the story player load only after the visitor starts.
    expect(scripts.filter((s) => /duckdb|worker/i.test(s.url))).toEqual([]);
    expect(scripts.filter((s) => s.body.includes('GreenSock'))).toEqual([]);
  });

  test('the landing preview moves on by itself and can be paused', async ({ page }) => {
    await page.goto('/');
    const current = page.locator('[aria-roledescription="slide"]:not([aria-hidden="true"])');
    await expect(current).toHaveAttribute('aria-label', '1 of 4: Spotify');
    await expect(current).toHaveAttribute('aria-label', '2 of 4: YouTube', { timeout: 6_000 });
    await page.getByRole('button', { name: 'Pause the preview' }).click();
    await page.waitForTimeout(4_500);
    await expect(current).toHaveAttribute('aria-label', '2 of 4: YouTube');
  });

  test('with reduced motion the preview stays put and the dots switch cards', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const current = page.locator('[aria-roledescription="slide"]:not([aria-hidden="true"])');
    await page.waitForTimeout(4_500);
    await expect(current).toHaveAttribute('aria-label', '1 of 4: Spotify');
    await page.getByRole('button', { name: 'Show the Netflix card' }).click();
    await expect(current).toHaveAttribute('aria-label', '3 of 4: Netflix');
  });
});
