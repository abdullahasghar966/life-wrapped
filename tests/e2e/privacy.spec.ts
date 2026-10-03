import { expect, test, type BrowserContext, type Request } from '@playwright/test';
import path from 'node:path';
import { goToCard, slide } from './helpers';

const fx = (p: string) => path.join(__dirname, '..', 'fixtures', p);

/** Every request made by the context's pages and their workers, in order. */
function record(context: BrowserContext): Request[] {
  const all: Request[] = [];
  context.on('request', (r) => all.push(r));
  return all;
}

// Real behaviour, including the offline worker's precaching.
test.use({ serviceWorkers: 'allow' });

const DECKS = [
  ['spotify', 12],
  ['youtube', 11],
  ['netflix', 10],
  ['life', 8],
] as const;

/**
 * The privacy proof (§14): ingest real-format exports and the sample, play every
 * deck to the end and save an image, while recording all network traffic.
 */
test('nothing leaves the device while you use the app', async ({ page, context, baseURL }) => {
  test.slow();
  const requests = record(context);

  await page.goto('/');
  await page.goto('/start');
  await page
    .getByTestId('file-input')
    .setInputFiles([
      fx('spotify/Streaming_History_Audio_2025.json'),
      fx('spotify/endsong_0.json'),
      fx('spotify/StreamingHistory_music_0.json'),
      fx('spotify/StreamingHistory_podcast_0.json'),
      fx('youtube/watch-history.json'),
      fx('youtube/historial-de-reproducciones.json'),
      fx('youtube/search-history.json'),
      fx('netflix/ViewingActivity.csv'),
    ]);
  await expect(page.getByRole('heading', { name: 'Here’s what we found' })).toBeVisible();
  await expect(page.getByTestId('platform-summary')).toContainText('YouTube');

  await page.getByRole('button', { name: 'Clear my data' }).click();
  await page.getByRole('button', { name: 'Try with sample data' }).click();
  await page.getByRole('link', { name: 'Play my story' }).click();

  for (const [deck, count] of DECKS) {
    await expect(page).toHaveURL(new RegExp(`/story/${deck}\\?sample=1$`));
    await expect(slide(page)).toHaveAttribute('aria-label', new RegExp(`^1 of ${count}:`), {
      timeout: 45_000,
    });
    if (deck === 'spotify') {
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Save image' }).click();
      await download;
    }
    await goToCard(page, count);
    if (deck !== 'life') await page.keyboard.press('ArrowRight');
  }
  await expect(page.getByRole('button', { name: 'Next card' })).toBeDisabled();

  const origin = new URL(baseURL!).origin;
  const urls = requests.map((r) => r.url());
  // The recorder sees worker traffic too: DuckDB's WASM is fetched by a nested worker.
  expect(urls.some((u) => u.includes('/duckdb/') && u.endsWith('.wasm'))).toBe(true);

  const foreign = urls.filter((u) => {
    const url = new URL(u);
    return url.protocol !== 'data:' && url.protocol !== 'blob:' && url.origin !== origin;
  });
  expect(foreign, 'requests to other origins').toEqual([]);

  const withBody = requests
    .filter((r) => r.postDataBuffer() !== null)
    .map((r) => `${r.method()} ${r.url()}`);
  expect(withBody, 'requests that carry data').toEqual([]);
});

test('the Content Security Policy blocks requests to other origins', async ({ page }) => {
  const res = await page.goto('/start');
  const csp = res!.headers()['content-security-policy']!;
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain("default-src 'self'");

  const outcome = await page.evaluate(async () => {
    const violation = new Promise<string>((resolve) =>
      document.addEventListener('securitypolicyviolation', (e) => resolve(e.effectiveDirective), {
        once: true,
      }),
    );
    try {
      await fetch('https://example.com/collect', { method: 'POST', body: 'listening history' });
      return 'sent';
    } catch {
      return `blocked by ${await violation}`;
    }
  });
  expect(outcome).toBe('blocked by connect-src');
});
