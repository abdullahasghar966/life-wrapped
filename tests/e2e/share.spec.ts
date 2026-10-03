import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Request } from '@playwright/test';
import { goToCard, openDeck } from './helpers';

// Each test shares from its own made-up address, so the per-IP rate limit
// (10 an hour) never trips across tests or repeated local runs.
test.use({
  extraHTTPHeaders: { 'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 250) + 1}` },
});

/** Every request that carries a body, in order. */
function bodies(page: Page): Request[] {
  const sent: Request[] = [];
  page.on('request', (r) => {
    if (r.postDataBuffer()) sent.push(r);
  });
  return sent;
}

async function openShareDialog(page: Page, deck: 'spotify' | 'life', cards: number) {
  await openDeck(page, deck);
  await goToCard(page, cards);
  await page.getByRole('button', { name: 'Share link' }).click();
  return page.getByRole('dialog', { name: 'Share this card' });
}

test.describe('sharing', () => {
  test('previews the exact JSON, sends it only on confirm, and can be deleted', async ({
    page,
  }) => {
    test.slow();
    const sent = bodies(page);
    const dialog = await openShareDialog(page, 'spotify', 12);
    const preview = dialog.getByTestId('share-preview');
    await expect(preview).toBeVisible();
    const shown = (await preview.textContent())!;
    expect(JSON.parse(shown)).toMatchObject({
      isSample: true,
      payload: { cardType: 'spotify.summary', theme: 'sound' },
    });
    expect(sent, 'nothing leaves before Confirm').toEqual([]);

    const [post] = await Promise.all([
      page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/api/share')),
      dialog.getByRole('button', { name: 'Confirm and share' }).click(),
    ]);
    expect(post.postData(), 'the request is exactly the preview').toBe(shown);
    const link = dialog.getByTestId('share-url');
    await expect(link).toBeVisible();
    const url = new URL((await link.getAttribute('href'))!);
    expect(url.pathname).toMatch(/^\/s\/[A-Za-z0-9_-]{10}$/);
    expect(sent).toHaveLength(1);

    await page.goto(url.pathname);
    await expect(page.getByTestId('shared-card')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Someone’s year in sound');
    await expect(page.getByTestId('sample-badge')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Make your own' })).toHaveAttribute(
      'href',
      '/start',
    );
    const shownPayload = JSON.parse(shown).payload as { names: Record<string, string> };
    await expect(page.getByTestId('shared-card')).toContainText(shownPayload.names.topArtist!);

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
      [],
    );

    // The link preview image is a PNG in the card's theme.
    const og = new URL((await page.locator('meta[property="og:image"]').getAttribute('content'))!);
    const image = await page.request.get(og.pathname + og.search);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');

    // This browser made the share, so it holds the delete token.
    await page.getByRole('button', { name: 'Delete this card' }).click();
    await page.getByRole('button', { name: 'Delete it' }).click();
    await expect(page.getByTestId('share-missing')).toBeVisible();
    expect((await page.request.get(url.pathname)).status()).toBe(404);
    expect(sent, 'the share was the only request with a body').toHaveLength(1);
  });

  test('another browser sees the card but no Delete button', async ({ page, browser }) => {
    test.slow();
    const dialog = await openShareDialog(page, 'life', 8);
    await dialog.getByRole('button', { name: 'Confirm and share' }).click();
    const href = (await dialog.getByTestId('share-url').getAttribute('href'))!;

    const other = await browser.newContext();
    const visitor = await other.newPage();
    await visitor.goto(new URL(href).pathname);
    await expect(visitor.getByTestId('shared-card')).toBeVisible();
    await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(
      'Someone’s online life, wrapped',
    );
    await expect(visitor.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute(
      'href',
      '/story/life?sample=1',
    );
    await expect(visitor.getByRole('button', { name: 'Delete this card' })).toHaveCount(0);
    await other.close();
  });

  test('Cancel sends nothing', async ({ page }) => {
    const sent = bodies(page);
    const dialog = await openShareDialog(page, 'spotify', 12);
    await expect(dialog.getByTestId('share-preview')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    expect(sent).toEqual([]);
  });

  test('explains when sharing is not set up', async ({ page }) => {
    // What a deployment without DATABASE_URL answers (the API itself is unit-tested).
    await page.route('**/api/share', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ json: { enabled: false } })
        : route.abort(),
    );
    const sent = bodies(page);
    const dialog = await openShareDialog(page, 'spotify', 12);
    await expect(dialog.getByTestId('share-disabled')).toContainText('isn’t set up');
    await expect(dialog.getByRole('button', { name: 'Confirm and share' })).toHaveCount(0);
    expect(sent).toEqual([]);
  });

  test('an unknown link shows a friendly not-found page', async ({ page }) => {
    const res = await page.goto('/s/abcdefghij');
    expect(res?.status()).toBe(404);
    await expect(page.getByTestId('share-missing')).toBeVisible();
  });
});
