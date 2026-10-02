import { expect, type Page } from '@playwright/test';

export const slide = (page: Page) => page.locator('[aria-roledescription="slide"]');

/**
 * Opens a sample deck and waits until its first card is on screen. Every page
 * boots its own DuckDB and generates the sample, so this can take a few seconds
 * when several tests run at once.
 */
export async function openDeck(page: Page, deck = 'spotify'): Promise<void> {
  await page.goto(`/story/${deck}?sample=1`);
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
