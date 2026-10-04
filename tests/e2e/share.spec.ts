import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Request } from '@playwright/test';
import { goToCard, openDeck, sharedData, stubShareSheet } from './helpers';

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

async function openShareSheet(page: Page, deck: 'spotify' | 'life', card: number) {
  await openDeck(page, deck);
  await goToCard(page, card);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  return page.getByRole('dialog', { name: 'Share this card' });
}

/** Opens the share sheet on a summary card and starts making a link. */
async function openShareDialog(page: Page, deck: 'spotify' | 'life', card: number) {
  const dialog = await openShareSheet(page, deck, card);
  await dialog.getByRole('button', { name: 'Create a link…' }).click();
  return dialog;
}

test.describe('sharing the image', () => {
  test('hands the card image to the device share sheet and uploads nothing', async ({ page }) => {
    await stubShareSheet(page);
    const sent = bodies(page);
    const dialog = await openShareSheet(page, 'spotify', 2);
    await expect(dialog.getByTestId('share-image-preview')).toBeVisible();
    // Only summary cards can become links.
    await expect(dialog.getByRole('button', { name: 'Create a link…' })).toHaveCount(0);

    const axe = await new AxeBuilder({ page }).include('[role=dialog]').analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
      [],
    );

    await dialog.getByRole('button', { name: 'Share image…' }).click();
    await expect(dialog.getByText('Sent to the app you picked.')).toBeVisible();
    expect(await sharedData(page)).toEqual([
      {
        title: 'Minutes listened',
        text: 'Made with Life, Wrapped',
        files: [
          {
            name: 'life-wrapped-spotify-minutes.png',
            type: 'image/png',
            width: 1080,
            height: 1920,
          },
        ],
      },
    ]);
    expect(sent, 'nothing is uploaded').toEqual([]);

    // The story stays paused behind the sheet and carries on where it was.
    await dialog.getByRole('button', { name: 'Close' }).first().click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByTestId('story-player').locator('[aria-roledescription="slide"]'),
    ).toHaveAttribute('aria-label', /^2 of /);
  });

  test('without a share sheet, saves the image instead', async ({ page }) => {
    await stubShareSheet(page, { supported: false });
    const dialog = await openShareSheet(page, 'spotify', 2);
    await expect(dialog.getByText(/can’t pass pictures to other apps/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Share image…' })).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'Save image' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('life-wrapped-spotify-minutes.png');
  });
});

test.describe('sharing a link', () => {
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
    await stubShareSheet(page);
    const dialog = await openShareDialog(page, 'life', 8);
    await dialog.getByRole('button', { name: 'Confirm and share' }).click();
    const href = (await dialog.getByTestId('share-url').getAttribute('href'))!;
    await dialog.getByRole('button', { name: 'Share link…' }).click();
    await expect
      .poll(() => sharedData(page))
      .toContainEqual({
        title: 'Your online life, wrapped',
        text: 'Made with Life, Wrapped',
        url: href,
        files: [],
      });

    const other = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    await stubShareSheet(other, { supported: false });
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
    // Without a share sheet, the button copies the link.
    await visitor.getByRole('button', { name: 'Share this card' }).click();
    await expect(visitor.getByRole('button', { name: 'Link copied' })).toBeVisible();
    expect(await visitor.evaluate(() => navigator.clipboard.readText())).toBe(href);
    await other.close();
  });

  test('Cancel sends nothing', async ({ page }) => {
    const sent = bodies(page);
    const dialog = await openShareDialog(page, 'spotify', 12);
    await expect(dialog.getByTestId('share-preview')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog.getByTestId('share-preview')).toBeHidden();
    await expect(dialog.getByRole('button', { name: 'Create a link…' })).toBeVisible();
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
