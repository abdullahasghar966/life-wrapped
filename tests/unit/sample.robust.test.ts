import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createEngine } from '@/engine/api';
import type { Db } from '@/engine/db/types';
import { createNodeDb } from '../helpers/nodeDb';

/**
 * The sample is generated relative to "today" in the viewer's time zone, so a
 * recruiter opening it on any date, anywhere, must still get every card.
 */
const CASES: Array<[tz: string, now: string]> = [
  ['Asia/Karachi', '2026-10-02T07:00:00Z'],
  ['America/Los_Angeles', '2026-03-09T18:00:00Z'], // the day after US DST starts
  ['Europe/Berlin', '2026-11-01T01:30:00Z'],
  ['Australia/Sydney', '2027-01-01T00:00:00Z'], // Southern-hemisphere summer, new year
];

const EXPECTED = { spotify: 12, youtube: 11, netflix: 10, life: 8 } as const;

let db: Db;
beforeAll(async () => {
  db = await createNodeDb();
});
afterAll(() => db.close());

describe('the sample shows every card on any date in any time zone', () => {
  for (const [tz, now] of CASES) {
    it(`${tz} on ${now.slice(0, 10)}`, async () => {
      const engine = createEngine({ createDb: async () => db, now: () => Date.parse(now) });
      await engine.loadSample(undefined, { timeZone: tz });
      for (const deck of ['spotify', 'youtube', 'netflix', 'life'] as const) {
        const cards = await engine.getDeck(deck);
        expect(cards.length, `${deck}: ${cards.map((c) => c.id).join(', ')}`).toBe(EXPECTED[deck]);
      }
      const rabbit = (await engine.getDeck('youtube')).find((c) => c.id === 'youtube.rabbitHole');
      expect(rabbit?.props).toMatchObject({ videos: 41, endMinute: 192 });
      const binge = (await engine.getDeck('netflix')).find((c) => c.id === 'netflix.binge');
      expect(binge?.props).toMatchObject({ count: 9 });
    });
  }
});
