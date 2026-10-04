import { expect, type BrowserContext, type Page } from '@playwright/test';

/** The current card of the story player (the landing preview has slides too). */
export const slide = (page: Page) =>
  page.getByTestId('story-player').locator('[aria-roledescription="slide"]');

/**
 * Opens a sample deck and waits until its first card is on screen. Every page
 * boots its own DuckDB and generates the sample, so this can take a few seconds
 * when several tests run at once.
 */
export async function openDeck(page: Page, deck = 'spotify', asOf?: string): Promise<void> {
  await page.goto(`/story/${deck}?sample=1${asOf ? `&asOf=${asOf}` : ''}`);
  await expect(slide(page)).toHaveAttribute('aria-label', /^1 of /, { timeout: 45_000 });
}

/** Waits until the current card's entrance (even the 200 ms reduced-motion fade) has finished. */
export async function settled(page: Page): Promise<void> {
  const surface = page.locator('[data-card-surface]').first();
  await expect
    .poll(() => surface.evaluate((el) => getComputedStyle(el).opacity), { timeout: 5_000 })
    .toBe('1');
}

/** Moves to card n (1-based) with the keyboard, waiting for each card. */
export async function goToCard(page: Page, n: number): Promise<void> {
  for (let i = 2; i <= n; i++) {
    await page.keyboard.press('ArrowRight');
    await expect(slide(page)).toHaveAttribute('aria-label', new RegExp(`^${i} of `));
  }
}

/** What the stubbed share sheet received (see stubShareSheet). */
export interface SharedData {
  title?: string;
  text?: string;
  url?: string;
  files: { name: string; type: string; width: number; height: number }[];
}

/**
 * Replaces the device share sheet (headless Chromium has none) with a stub that
 * records what it was handed, or, with `supported: false`, removes it the way
 * most desktop browsers lack it.
 */
export async function stubShareSheet(
  target: Page | BrowserContext,
  { supported = true } = {},
): Promise<void> {
  await target.addInitScript((supported: boolean) => {
    if (!supported) {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
      return;
    }
    const w = window as unknown as { __shared: unknown[] };
    w.__shared = [];
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        const files = await Promise.all(
          (data.files ?? []).map(async (f) => {
            const bitmap = await createImageBitmap(f);
            return { name: f.name, type: f.type, width: bitmap.width, height: bitmap.height };
          }),
        );
        w.__shared.push({ title: data.title, text: data.text, url: data.url, files });
      },
    });
  }, supported);
}

/** Everything the stubbed share sheet has received so far. */
export const sharedData = (page: Page) =>
  page.evaluate(() => (window as unknown as { __shared: SharedData[] }).__shared);
