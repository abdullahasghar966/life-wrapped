import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { goToCard, openDeck, settled, slide } from './helpers';

test.describe('story player', () => {
  test('landing → sample story in two clicks or fewer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Try with sample data' }).first().click();
    await expect(page.getByTestId('story-player')).toBeVisible({ timeout: 45_000 });
    await expect(slide(page)).toHaveAttribute('aria-label', '1 of 12: Your year in sound');
    await expect(page.getByText(/viewing sample data for Alex/)).toBeVisible();
  });

  test('plays the Spotify deck to the end with the keyboard and chains to YouTube', async ({
    page,
  }) => {
    await openDeck(page, 'spotify');
    await goToCard(page, 12);
    await expect(page.getByTestId('story-announcer')).toContainText(
      'Your year in sound, summarised',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(slide(page)).toHaveAttribute('aria-label', /^11 of 12/);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('link', { name: 'Next: your YouTube story →' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/\/story\/youtube\?sample=1$/);
  });

  test('tap zones move back and forward', async ({ page }) => {
    await openDeck(page);
    const box = (await page.getByTestId('story-stage').boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
    await expect(slide(page)).toHaveAttribute('aria-label', /^2 of/);
    await page.mouse.click(box.x + box.width * 0.15, box.y + box.height / 2);
    await expect(slide(page)).toHaveAttribute('aria-label', /^1 of/);
  });

  test('auto-advances after 7 seconds, and Space pauses', async ({ page }) => {
    test.slow();
    await openDeck(page);
    await expect(slide(page)).toHaveAttribute('aria-label', /^2 of/, { timeout: 10_000 });
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Play' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.waitForTimeout(8_000);
    await expect(slide(page)).toHaveAttribute('aria-label', /^2 of/);
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  test('summary cards do not auto-advance', async ({ page }) => {
    test.slow();
    await openDeck(page);
    await goToCard(page, 12);
    await page.waitForTimeout(8_000);
    await expect(slide(page)).toHaveAttribute('aria-label', /^12 of 12/);
  });

  test('Esc closes the story', async ({ page }) => {
    await openDeck(page);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/start$/);
  });

  test('a reload without the sample flag goes back to /start, because nothing is saved', async ({
    page,
  }) => {
    await page.goto('/start');
    await page.getByRole('button', { name: 'Try with sample data' }).click();
    await page.getByTestId('deck-tiles').getByRole('link').first().click();
    await expect(slide(page)).toBeVisible({ timeout: 45_000 });
    await page.goto('/story/spotify');
    await expect(page).toHaveURL(/\/start\?reason=reload$/);
    await expect(page.getByText(/nothing is saved/)).toBeVisible();
  });

  test('saves a 1080 × 1920 PNG of the card', async ({ page }) => {
    await openDeck(page);
    await goToCard(page, 2);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Save image' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('life-wrapped-spotify-minutes.png');
    const chunks: Buffer[] = [];
    for await (const c of await download.createReadStream()) chunks.push(c as Buffer);
    const png = Buffer.concat(chunks);
    expect(png.readUInt32BE(16)).toBe(1080);
    expect(png.readUInt32BE(20)).toBe(1920);
  });

  test('settings change the cards', async ({ page }) => {
    await openDeck(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    const period = page.getByLabel('Period');
    expect((await period.locator('option').allTextContents())[0]).toBe('Last 12 months');
    // Index 1 is the most recent calendar year: the deck restarts on that period.
    await period.selectOption({ index: 1 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(slide(page)).toHaveAttribute('aria-label', /^1 of/);
    await expect(page.getByTestId('story-announcer')).toContainText(
      /Your year in sound: January 1, \d{4} to December 31, \d{4}/,
    );
  });

  test('has no serious accessibility violations on any card', async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openDeck(page);
    for (let i = 1; i <= 12; i++) {
      await settled(page);
      const results = await new AxeBuilder({ page }).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        serious,
        `card ${i}: ${JSON.stringify(serious.map((v) => [v.id, v.nodes.map((n) => n.target)]))}`,
      ).toEqual([]);
      if (i < 12) {
        await page.keyboard.press('ArrowRight');
        await expect(slide(page)).toHaveAttribute('aria-label', new RegExp(`^${i + 1} of `));
      }
    }
  });
});
