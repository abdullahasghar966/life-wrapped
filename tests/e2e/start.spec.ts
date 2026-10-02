import { expect, test } from '@playwright/test';
import path from 'node:path';

const fx = (p: string) => path.join(__dirname, '..', 'fixtures', p);

test.describe('/start', () => {
  test('summarises the real-format fixtures', async ({ page }) => {
    await page.goto('/start');
    await page
      .getByTestId('file-input')
      .setInputFiles([
        fx('spotify/Streaming_History_Audio_2025.json'),
        fx('spotify/endsong_0.json'),
        fx('youtube/watch-history.json'),
        fx('youtube/historial-de-reproducciones.json'),
        fx('netflix/ViewingActivity.csv'),
      ]);
    await expect(page.getByRole('heading', { name: 'Here’s what we found' })).toBeVisible();
    const reports = page.getByTestId('file-reports');
    await expect(reports).toContainText('Recognised as Spotify Extended · 5 rows · 2 skipped');
    await expect(reports).toContainText('Recognised as Spotify Extended · 2 rows · 0 skipped');
    await expect(reports).toContainText('Recognised as YouTube watch history · 5 rows · 1 skipped');
    await expect(reports).toContainText(
      'Recognised as Netflix viewing activity · 12 rows · 3 skipped',
    );
    await expect(page.getByTestId('platform-summary')).toContainText('YouTube: 10 watches');
    await expect(page.getByRole('radio', { name: /Alex/ })).toBeChecked();
  });

  test('explains the YouTube HTML export', async ({ page }) => {
    await page.goto('/start');
    await page.getByTestId('file-input').setInputFiles([fx('youtube/watch-history.html')]);
    await expect(page.getByText('Your YouTube history is in HTML')).toBeVisible();
    await expect(page.getByText(/set History to JSON/)).toBeVisible();
  });

  test('loads the sample quickly and offers every deck', async ({ page }) => {
    await page.goto('/start');
    const t0 = Date.now();
    await page.getByRole('button', { name: 'Try with sample data' }).click();
    await expect(page.getByRole('heading', { name: 'Here’s what we found' })).toBeVisible();
    // Budgets are asserted in the serial perf spec; parallel workers make timings noisy here.
    test.info().annotations.push({ type: 'sample-load-ms', description: String(Date.now() - t0) });
    await expect(page.getByText(/viewing sample data for Alex/)).toBeVisible();
    const tiles = page.getByTestId('deck-tiles').getByRole('link');
    await expect(tiles).toHaveCount(4);
    await page.getByRole('button', { name: 'Clear my data' }).click();
    await expect(page.getByRole('button', { name: 'Try with sample data' })).toBeVisible();
  });
});
