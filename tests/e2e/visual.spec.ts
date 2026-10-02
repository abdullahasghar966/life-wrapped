import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { openDeck, settled, slide } from './helpers';

const baseline = (name: string) =>
  path.join(__dirname, 'visual.spec.ts-snapshots', `${name}-chromium-${process.platform}.png`);

/**
 * Visual snapshots of every card, with reduced motion so each frame is the final
 * layout. The sample is pinned to one date and time zone, so the data (and so the
 * pixels) never change between runs. Baselines are stored per OS because font
 * rendering differs; Linux baselines come from CI (see docs/DECISIONS.md).
 */
const AS_OF = '2026-06-15';

test.use({
  timezoneId: 'Europe/London',
  reducedMotion: 'reduce',
  viewport: { width: 1280, height: 900 },
});

const DECK_SIZES = { spotify: 12, youtube: 11, netflix: 10 } as const;

for (const [deck, count] of Object.entries(DECK_SIZES)) {
  test(`${deck} deck`, async ({ page }) => {
    // In CI a missing baseline would only be written, not compared. Linux baselines
    // are produced by the "Visual baselines" workflow and committed.
    test.skip(
      !!process.env.CI && !process.env.VISUAL_BASELINES && !existsSync(baseline(`${deck}-01`)),
      `No ${process.platform} baselines for ${deck} yet`,
    );
    test.slow();
    await openDeck(page, deck, AS_OF);
    // Paused, the progress bar stays still and nothing auto-advances mid-screenshot.
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    for (let i = 1; i <= count; i++) {
      await settled(page);
      await expect(page.getByTestId('story-frame')).toHaveScreenshot(
        `${deck}-${String(i).padStart(2, '0')}.png`,
        { animations: 'disabled' },
      );
      if (i < count) {
        await page.keyboard.press('ArrowRight');
        await expect(slide(page)).toHaveAttribute('aria-label', new RegExp(`^${i + 1} of `));
      }
    }
  });
}
