// Records the README's demo GIF from the sample story on a running build.
// Usage: pnpm build && pnpm start, then: node scripts/record-demo.mjs [baseUrl]
// Frames are Playwright screenshots (each card's entrance, then a hold on the
// finished card), encoded with gifenc so no ffmpeg is needed.
import { chromium } from '@playwright/test';
import gifenc from 'gifenc';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const { applyPalette, GIFEncoder, quantize } = gifenc; // CommonJS package

const BASE = process.argv[2] ?? 'http://localhost:3000';
const OUT = 'docs/media/story.gif';
const SIZE = { width: 360, height: 640 };
const FPS = 10;
const ENTRANCE_MS = 1300;
// The tour ends on the personality card, which prints its list for longer.
const LAST_ENTRANCE_MS = 2600;
const HOLD_MS = 700;

// Which cards to show from each deck (1-based), in order.
const TOUR = [
  ['spotify', 12, [1, 2, 3, 7, 12]],
  ['youtube', 11, [1, 5, 11]],
  ['netflix', 10, [1, 5, 10]],
  ['life', 8, [1, 3, 7]],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
const shots = [];

const label = () =>
  page
    .locator('[data-testid="story-player"] [aria-roledescription="slide"]')
    .getAttribute('aria-label');

async function waitForCard(n) {
  await page
    .locator(`[data-testid="story-player"] [aria-roledescription="slide"][aria-label^="${n} of "]`)
    .waitFor({ timeout: 30_000 });
}

/** The opening frame is a finished card, so a still preview of the GIF looks right. */
async function still(ms) {
  await page.waitForTimeout(ENTRANCE_MS);
  shots.push({ png: await page.screenshot(), at: performance.now(), hold: ms });
}

async function capture(ms = ENTRANCE_MS) {
  const start = performance.now();
  while (performance.now() - start < ms) {
    const t = performance.now();
    shots.push({ png: await page.screenshot(), at: t });
    const wait = 1000 / FPS - (performance.now() - t);
    if (wait > 0) await page.waitForTimeout(wait);
  }
  shots.at(-1).hold = HOLD_MS;
}

await page.goto(`${BASE}/story/spotify?sample=1&asOf=2026-06-15`);
for (const [deck, count, cards] of TOUR) {
  await waitForCard(1);
  let current = 1;
  for (const n of cards) {
    while (current < n) {
      await page.keyboard.press('ArrowRight');
      current++;
      await waitForCard(current);
    }
    await page.waitForTimeout(40);
    if (shots.length === 0) await still(1200);
    else await capture(deck === 'life' && n === cards.at(-1) ? LAST_ENTRANCE_MS : ENTRANCE_MS);
    console.log(`captured ${await label()}`);
  }
  if (deck !== 'life') {
    while (current < count) {
      await page.keyboard.press('ArrowRight');
      current++;
      await waitForCard(current);
    }
    await page.keyboard.press('ArrowRight'); // on to the next deck
    await page.waitForURL(/\/story\/(youtube|netflix|life)/);
  }
}
await browser.close();

if (process.env.DEBUG_FRAMES) {
  mkdirSync('.scratch/frames', { recursive: true });
  shots.forEach(
    (s, i) =>
      i % 12 === 0 && writeFileSync(`.scratch/frames/${String(i).padStart(3, '0')}.png`, s.png),
  );
}

const gif = GIFEncoder();
for (let i = 0; i < shots.length; i++) {
  const { png, at, hold = 0 } = shots[i];
  const { data, width, height } = PNG.sync.read(png);
  const palette = quantize(data, 128);
  const next = shots[i + 1];
  const delay = Math.round((next && !hold ? next.at - at : 1000 / FPS) + hold);
  gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay });
}
gif.finish();
mkdirSync('docs/media', { recursive: true });
writeFileSync(OUT, gif.bytes());
const seconds =
  shots.reduce(
    (s, x, i) => s + (shots[i + 1] && !x.hold ? shots[i + 1].at - x.at : 100) + (x.hold ?? 0),
    0,
  ) / 1000;
console.log(
  `${OUT}: ${shots.length} frames, ${seconds.toFixed(1)} s, ${(gif.bytes().length / 1e6).toFixed(1)} MB`,
);
