import { expect, test } from '@playwright/test';

test('the engine worker runs a DuckDB query in the browser', async ({ page }) => {
  await page.goto('/debug');
  await expect(page.getByTestId('duckdb-answer')).toHaveText('42', { timeout: 30_000 });
});

test('landing page shows the headline, CTAs and disclaimer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Your whole online life, wrapped',
  );
  await expect(page.getByRole('link', { name: 'Try with sample data' }).first()).toBeVisible();
  await expect(page.getByText(/not affiliated with or endorsed by Spotify/)).toBeVisible();
});
