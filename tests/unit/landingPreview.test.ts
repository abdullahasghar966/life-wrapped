import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DECK_ORDER } from '@/story/decks';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

const FILE = path.join(process.cwd(), 'src', 'landing', 'preview.json');

/**
 * The landing page's mini story is drawn from a committed JSON so DuckDB stays
 * off the landing page (§12). This keeps that JSON equal to the real sample's
 * summary cards. After a deliberate change: UPDATE_PREVIEW=1 pnpm test:unit
 */
describe('landing preview', () => {
  let t: TestEngine;
  beforeAll(async () => {
    t = await createTestEngine();
    await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
  });
  afterAll(() => t.db.close());

  it('is the seeded sample’s summary cards', async () => {
    const preview: Record<string, unknown> = {};
    for (const deck of DECK_ORDER) {
      const card = (await t.engine.getDeck(deck)).find((c) => c.id === `${deck}.summary`)!;
      preview[deck] = card.props;
    }
    if (process.env.UPDATE_PREVIEW) writeFileSync(FILE, `${JSON.stringify(preview, null, 2)}\n`);
    expect(JSON.parse(readFileSync(FILE, 'utf8'))).toEqual(preview);
  });
});
