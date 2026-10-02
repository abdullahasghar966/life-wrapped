import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { allInsights } from '@/engine/insights/registry';
import type { InsightResult } from '@/engine/insights/types';
import type { DeckId } from '@/engine/types';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

/**
 * Every insight runs against the seeded sample (fixed seed, time zone and "now"),
 * and its result object is snapshotted. A changed number means a changed story,
 * so snapshot updates should be reviewed like code.
 */
let t: TestEngine;
const decks: Partial<Record<DeckId, InsightResult[]>> = {};

beforeAll(async () => {
  t = await createTestEngine();
  await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
  for (const d of ['spotify', 'youtube', 'netflix', 'life'] as const)
    decks[d] = await t.engine.getDeck(d);
});
afterAll(() => t.db.close());

describe('every registered insight', () => {
  it('appears in the sample, so the sample exercises every card', () => {
    const shown = Object.values(decks).flatMap((d) => d!.map((c) => c.id));
    expect(shown.sort()).toEqual(
      allInsights()
        .map((d) => d.id)
        .sort(),
    );
  });

  it('decks have 8–12 cards in order and end with a shareable summary', () => {
    for (const [deck, cards] of Object.entries(decks)) {
      expect(cards!.length, deck).toBeGreaterThanOrEqual(8);
      expect(cards!.length, deck).toBeLessThanOrEqual(12);
      expect(cards!.map((c) => c.order)).toEqual(
        [...cards!.map((c) => c.order)].sort((a, b) => a - b),
      );
      const last = cards!.at(-1)!;
      expect(last.id.endsWith('.summary')).toBe(true);
      expect(last.shareable).toBe(true);
      expect(cards!.filter((c) => c.shareable)).toHaveLength(1);
    }
  });

  it('every card has one plain sentence for screen readers', () => {
    for (const card of Object.values(decks).flat()) {
      expect(card!.a11y.length, card!.id).toBeGreaterThan(10);
      expect(card!.a11y, card!.id).not.toMatch(/undefined|NaN|null/);
    }
  });
});

for (const deck of ['spotify', 'youtube', 'netflix', 'life'] as const) {
  describe(`${deck} deck`, () => {
    for (const def of allInsights().filter((d) => d.deck === deck)) {
      it(def.id, () => {
        const card = decks[deck]!.find((c) => c.id === def.id);
        expect(card, `${def.id} should be shown for the sample`).toBeDefined();
        expect({ props: card!.props, a11y: card!.a11y, share: card!.share }).toMatchSnapshot();
      });
    }
  });
}

describe('planted sample moments reach the cards', () => {
  const props = (deck: DeckId, id: string) =>
    decks[deck]!.find((c) => c.id === id)!.props as Record<string, unknown>;

  it('Spotify', () => {
    expect(props('spotify', 'spotify.onRepeat')).toMatchObject({ track: 'Paper Moons', plays: 27 });
    expect(props('spotify', 'spotify.streak')).toMatchObject({ days: 63 });
    expect(props('spotify', 'spotify.clock')).toMatchObject({ persona: 'Night Owl' });
    expect(props('spotify', 'spotify.topArtist')).toMatchObject({ artist: 'Nova Vale' });
    expect((props('spotify', 'spotify.discovery').newArtists as number) > 0).toBe(true);
  });

  it('YouTube', () => {
    expect(props('youtube', 'youtube.rabbitHole')).toMatchObject({
      videos: 41,
      firstTitle: 'How do magnets work?',
      endMinute: 3 * 60 + 12,
      crossesMidnight: true,
    });
    expect(props('youtube', 'youtube.rewatched')).toMatchObject({
      title: 'Rain on a tin roof',
      times: 14,
    });
    expect(props('youtube', 'youtube.weekly')).toMatchObject({ peakDow: 5, peakHour: 23 });
    expect(
      (props('youtube', 'youtube.searches').topQueries as Array<{ query: string }>)[0]?.query,
    ).toBe('easy pasta');
  });

  it('Netflix', () => {
    expect(props('netflix', 'netflix.binge')).toMatchObject({
      series: 'Midnight Harbor',
      count: 9,
    });
    expect(props('netflix', 'netflix.topSeries')).toMatchObject({ series: 'Midnight Harbor' });
    expect(props('netflix', 'netflix.lateNight')).toMatchObject({ latestMinute: 3 * 60 + 47 });
  });

  it('Life', () => {
    expect(props('life', 'life.rhythm')).toMatchObject({
      dayparts: { morning: 'spotify', night: 'youtube' },
      weekends: 'netflix',
    });
  });
});
