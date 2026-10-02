import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ogText, renderGenericImage, renderShareImage } from '@/share/og';
import { buildShareRequest, type ValidSharePayload } from '@/share/schema';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

// OG_OUT=<dir> writes the images out for a visual check.
const OUT = process.env.OG_OUT;

async function png(res: Response, name: string): Promise<Buffer> {
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toBe('image/png');
  const buf = Buffer.from(await res.arrayBuffer());
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  if (OUT) {
    await mkdir(OUT, { recursive: true });
    await writeFile(join(OUT, `${name}.png`), buf);
  }
  return buf;
}

describe('share preview images', () => {
  let t: TestEngine;
  const payloads: ValidSharePayload[] = [];
  beforeAll(async () => {
    t = await createTestEngine();
    await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
    for (const deck of ['spotify', 'youtube', 'netflix', 'life'] as const) {
      const card = (await t.engine.getDeck(deck)).find((c) => c.shareable)!;
      payloads.push(buildShareRequest(card.share!, true)!.payload);
    }
  });
  afterAll(() => t.db.close());

  // next/og fetches fonts or emoji from third-party CDNs for glyphs it can't draw,
  // with the text in the URL. Only its own inlined WASM (a data: URL) may load.
  const realFetch = globalThis.fetch;
  const requests: string[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith('data:')) return realFetch(input, init);
    requests.push(url);
    throw new Error('network disabled in this test');
  });
  afterEach(() => {
    requests.length = 0;
  });

  it('renders every card type from the embedded fonts alone', async () => {
    for (const p of payloads) await png(await renderShareImage(p, true), p.cardType);
    await png(await renderGenericImage(), 'generic');
    expect(requests).toEqual([]);
  });

  it('leaves out names the embedded fonts cannot draw, instead of fetching a font', async () => {
    const payload: ValidSharePayload = {
      cardType: 'spotify.summary',
      theme: 'sound',
      numbers: { minutes: 1234 },
      names: { topArtist: '宇多田ヒカル', topTrack: 'Halo 🎧', persona: 'Night Owl' },
    };
    await png(await renderShareImage(payload, false), 'unsupported-names');
    expect(requests).toEqual([]);
  });

  it('checks names against the fonts’ character set', () => {
    expect(ogText('Beyoncé')).toBe('Beyoncé');
    expect(ogText('Sigur Rós – Glósóli')).toBe('Sigur Rós – Glósóli');
    expect(ogText('宇多田ヒカル')).toBeNull();
    expect(ogText('Halo 🎧')).toBeNull();
    expect(ogText('Łódź')).toBeNull();
    expect(ogText('A very long name that goes on and on', 12)).toBe('A very long…');
  });
});
