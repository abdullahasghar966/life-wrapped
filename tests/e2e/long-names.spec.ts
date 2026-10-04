import { expect, test, type Page } from '@playwright/test';
import { longNameExports } from './exports';
import { slide } from './helpers';

/**
 * Real exports have far longer names than the sample (100-character video titles,
 * artist lists, numbered episodes). Every card of every deck must keep its text
 * inside the frame and clear of the actions at the bottom, on a phone and a desktop.
 */
test.use({ reducedMotion: 'reduce' });

/** Visible text on the current card that overlaps other text or the actions, or leaves the frame. */
function layoutProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('[data-testid="story-frame"]')!;
    const surface = frame.querySelector<HTMLElement>('[data-card-surface]')!;
    const content = surface.querySelector<HTMLElement>('[data-card-content]')!;
    const fr = frame.getBoundingClientRect();
    // The bottom chrome: Save image, Share, Next, and the round previous/next buttons on phones.
    const actions = [...frame.querySelectorAll<HTMLElement>('button, a')]
      .filter((el) => !content.contains(el))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.top > fr.top + fr.height / 2);
    // The part of a text line that is actually shown, after every clipping ancestor.
    const shown = (r: DOMRect, el: Element) => {
      let { left, top, right, bottom } = r;
      for (let a: Element | null = el; a && a !== frame; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
          const b = a.getBoundingClientRect();
          left = Math.max(left, b.left);
          top = Math.max(top, b.top);
          right = Math.min(right, b.right);
          bottom = Math.min(bottom, b.bottom);
        }
      }
      return right - left > 1 && bottom - top > 1 ? { left, top, right, bottom } : null;
    };
    const problems = new Set<string>();
    const lines: Array<{
      v: { left: number; top: number; right: number; bottom: number };
      node: Node;
      text: string;
    }> = [];
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent?.trim();
      const el = n.parentElement;
      if (!text || !el || el.closest('svg, [aria-hidden="true"], .sr-only')) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        const v = shown(r, el);
        if (!v) continue;
        lines.push({ v, node: n, text });
        if (v.left < fr.left - 1 || v.right > fr.right + 1 || v.bottom > fr.bottom + 1) {
          problems.add(`outside the frame: ${text.slice(0, 50)}`);
        }
        for (const a of actions) {
          if (
            v.right > a.left + 2 &&
            v.left < a.right - 2 &&
            v.bottom > a.top + 2 &&
            v.top < a.bottom - 2
          ) {
            problems.add(`under the actions: ${text.slice(0, 50)}`);
          }
        }
      }
    }
    // Two different pieces of text drawn on top of each other. A line box is taller than its
    // letters (more so for big numerals), so only the middle of each box counts: tight
    // leading and a caption tucked under a giant number are fine, a row under a stat isn't.
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const a = lines[i]!;
        const b = lines[j]!;
        if (a.node === b.node) continue;
        const ink = (v: (typeof a)['v']) => {
          const height = v.bottom - v.top;
          const pad = height * (height > 40 ? 0.22 : 0.1);
          return { left: v.left, right: v.right, top: v.top + pad, bottom: v.bottom - pad };
        };
        const ia = ink(a.v);
        const ib = ink(b.v);
        const w = Math.min(ia.right, ib.right) - Math.max(ia.left, ib.left);
        const h = Math.min(ia.bottom, ib.bottom) - Math.max(ia.top, ib.top);
        if (w > 4 && h > 3)
          problems.add(`text on text: ${a.text.slice(0, 30)} ↔ ${b.text.slice(0, 30)}`);
      }
    }
    return [...problems];
  });
}

for (const [width, height, device] of [
  [390, 844, 'a phone'],
  [1280, 900, 'a desktop'],
] as const) {
  test(`long real-world names fit every card on ${device}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height });
    await page
      .context()
      .route(/^https:\/\/(open\.spotify\.com|www\.youtube-nocookie\.com)\//, (r) =>
        r.fulfill({ body: '' }),
      );
    const x = longNameExports();
    await page.goto('/start');
    await page.getByTestId('file-input').setInputFiles([
      {
        name: 'Streaming_History_Audio_2026.json',
        mimeType: 'application/json',
        buffer: x.spotify,
      },
      { name: 'watch-history.json', mimeType: 'application/json', buffer: x.youtube },
      { name: 'ViewingActivity.csv', mimeType: 'text/csv', buffer: x.netflix },
    ]);
    await expect(page.getByRole('heading', { name: 'Here’s what we found' })).toBeVisible();
    await page.getByRole('link', { name: 'Play my story' }).click();

    const seen: string[] = [];
    const problems: string[] = [];
    for (let step = 0; step < 60; step++) {
      await expect(slide(page)).toBeVisible({ timeout: 45_000 });
      // The song and video pickers pop up as the Spotify and YouTube stories start.
      for (let k = 0; k < 3 && (await page.getByRole('dialog').count()) > 0; k++) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      await page.waitForTimeout(400);
      const label = (await slide(page).getAttribute('aria-label')) ?? '';
      const deck = new URL(page.url()).pathname.split('/')[2];
      const key = `${deck} ${label}`;
      if (!seen.includes(key)) {
        seen.push(key);
        for (const p of await layoutProblems(page)) problems.push(`${key} → ${p}`);
      }
      const [n, rest] = label.split(' of ');
      if (deck === 'life' && n === rest?.split(':')[0]) break;
      await page.keyboard.press('ArrowRight');
    }
    expect(seen.length, 'every deck was played').toBeGreaterThan(30);
    expect(problems).toEqual([]);
  });
}
