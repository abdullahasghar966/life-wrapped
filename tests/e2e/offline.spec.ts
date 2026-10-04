import { expect, test, type Page } from '@playwright/test';
import { spotifyExtendedExport } from './exports';
import { goToCard, slide } from './helpers';

/** Loads the site once online and waits until the service worker controls the page. */
async function installOffline(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 30_000 })
    .toBe(true);
}

test.use({ serviceWorkers: 'allow' });

test.describe('offline', () => {
  test.slow();

  test('your own export: add it, play it and go back, all without a connection', async ({
    page,
    context,
  }) => {
    await installOffline(page);
    await context.setOffline(true);

    // The test is only meaningful if the service worker is offline too: a page it
    // can't have cached must fall back to the offline page.
    await page.goto('/s/abcdefghij');
    await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible();

    await page.goto('/start');
    await page.getByTestId('file-input').setInputFiles({
      name: 'Streaming_History_Audio_2026.json',
      mimeType: 'application/json',
      buffer: spotifyExtendedExport(),
    });
    await expect(page.getByRole('heading', { name: 'Here’s what we found' })).toBeVisible();
    await page.getByRole('link', { name: 'Play my story' }).click();

    // A full page load would have lost the data and gone back to /start.
    await expect(page).toHaveURL(/\/story\/spotify$/);
    await expect(slide(page)).toHaveAttribute('aria-label', /^1 of \d+: /, { timeout: 45_000 });
    const count = Number((await slide(page).getAttribute('aria-label'))!.match(/of (\d+)/)![1]);
    await goToCard(page, count);
    await expect(page.getByRole('button', { name: 'Next card' })).toBeDisabled();

    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/start$/);
    await expect(page.getByRole('heading', { name: 'Here’s what we found' })).toBeVisible();
    await expect(page.getByTestId('platform-summary')).toContainText('Spotify');
  });

  test('the sample: every deck plays and chains without a connection', async ({
    page,
    context,
  }) => {
    await installOffline(page);
    await context.setOffline(true);

    await page.goto('/start');
    await page.getByRole('button', { name: 'Try with sample data' }).click();
    await page.getByRole('link', { name: 'Play my story' }).click();
    for (const [deck, count] of [
      ['spotify', 12],
      ['youtube', 11],
      ['netflix', 10],
      ['life', 8],
    ] as const) {
      await expect(page).toHaveURL(new RegExp(`/story/${deck}\\?sample=1$`));
      await expect(slide(page)).toHaveAttribute('aria-label', new RegExp(`^1 of ${count}:`), {
        timeout: 45_000,
      });
      await goToCard(page, count);
      if (deck !== 'life') await page.keyboard.press('ArrowRight');
    }
    await expect(page.getByRole('button', { name: 'Next card' })).toBeDisabled();
  });
});
