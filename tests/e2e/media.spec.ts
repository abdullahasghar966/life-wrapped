import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { spotifyExtendedExport, youtubeWatchExport } from './exports';
import { openDeck, slide } from './helpers';

const PLAYERS = /^https:\/\/(open\.spotify\.com|www\.youtube-nocookie\.com)\//;

/** Stands in for the platforms' players, so tests never contact Spotify or YouTube. */
async function stubPlayers(page: Page): Promise<string[]> {
  const loaded: string[] = [];
  await page.context().route(PLAYERS, (route) => {
    loaded.push(route.request().url());
    return route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Player</title><p>Player</p>',
    });
  });
  return loaded;
}

/** Every request to another origin, with whether it carried a body. */
function foreignRequests(page: Page): Array<{ url: string; body: boolean }> {
  const out: Array<{ url: string; body: boolean }> = [];
  page.context().on('request', (r) => {
    const url = new URL(r.url());
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost') {
      out.push({ url: r.url(), body: r.postDataBuffer() !== null });
    }
  });
  return out;
}

async function playOwnData(page: Page) {
  await page.goto('/start');
  await page.getByTestId('file-input').setInputFiles([
    {
      name: 'Streaming_History_Audio_2026.json',
      mimeType: 'application/json',
      buffer: spotifyExtendedExport(),
    },
    { name: 'watch-history.json', mimeType: 'application/json', buffer: youtubeWatchExport() },
  ]);
  await expect(page.getByRole('heading', { name: 'Here’s what we found' })).toBeVisible();
  await page.getByRole('link', { name: 'Play my story' }).click();
}

test.describe('playing a top song or video alongside the stories', () => {
  test('offers the top songs, loads nothing until one is picked, and plays on into the next deck', async ({
    page,
  }) => {
    test.slow();
    const loaded = await stubPlayers(page);
    const foreign = foreignRequests(page);
    await playOwnData(page);

    const songs = page.getByRole('dialog', { name: 'Add a soundtrack?' });
    await expect(songs).toBeVisible({ timeout: 45_000 });
    await expect(songs.getByTestId('media-list').locator('li')).toHaveCount(5);
    expect(loaded, 'nothing comes from Spotify before a pick').toEqual([]);
    const axe = await new AxeBuilder({ page }).include('[role=dialog]').analyze();
    expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
      [],
    );

    const first = songs.getByRole('button', { name: /^Play / }).first();
    const song = (await first.getAttribute('aria-label'))!.replace(/^Play /, '');
    await first.click();
    await expect(songs).toBeHidden();
    const dock = page.getByTestId('media-dock');
    await expect(dock).toContainText('your #1 song');
    const player = dock.locator('iframe');
    await expect(player).toHaveAttribute(
      'src',
      /^https:\/\/open\.spotify\.com\/embed\/track\/offline\d{15}$/,
    );
    await expect(player).toHaveAttribute('title', `Spotify player: ${song}`);
    await expect.poll(() => loaded.length).toBe(1);

    // The story carries on; the player stays while the next deck turns in, which offers videos.
    for (let i = 0; i < 25 && !page.url().includes('/story/youtube'); i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
    }
    await expect(page).toHaveURL(/\/story\/youtube$/);
    const videos = page.getByRole('dialog', { name: 'Watch along?' });
    await expect(videos).toBeVisible();
    await expect(videos).toContainText('This replaces the song that’s playing.');
    await expect(dock).toBeVisible();
    await videos.getByRole('button', { name: 'Play Video number 12' }).click();
    await expect(player).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/e2eVideo011?autoplay=1&playsinline=1&rel=0',
    );
    await expect(player).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    await expect(dock).toContainText('your #1 video');

    // Closing stops it; the music button brings the picker back.
    await page.getByRole('button', { name: 'Stop and close the player' }).click();
    await expect(dock).toHaveCount(0);
    await page.getByRole('button', { name: 'Play one of your most-watched videos' }).click();
    await expect(videos).toBeVisible();
    await videos.getByRole('button', { name: 'Not now' }).click();
    await expect(slide(page)).toBeVisible();

    // The only other sites contacted were the two players, without any body.
    expect(foreign.length).toBeGreaterThan(0);
    for (const r of foreign) {
      expect(r.url).toMatch(PLAYERS);
      expect(r.body).toBe(false);
    }
  });

  test('the sample offers nothing to play', async ({ page }) => {
    await openDeck(page, 'spotify');
    await page.waitForTimeout(1500);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Play one of your/ })).toHaveCount(0);
  });

  test('the CSP frames only the two players, and still blocks sending data elsewhere', async ({
    page,
  }) => {
    const res = await page.goto('/start');
    const csp = res!.headers()['content-security-policy']!;
    expect(csp).toContain('frame-src https://open.spotify.com https://www.youtube-nocookie.com;');
    expect(csp).toContain("connect-src 'self'");
  });
});
