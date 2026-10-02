'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { OptionsPatch } from '@/engine/api';
import type { InsightResult } from '@/engine/insights/types';
import type { DeckId } from '@/engine/types';
import { engine, useEngineState } from '@/lib/engineStore';
import { DECK_ORDER, DECKS } from '@/story/decks';
import { Player } from '@/story/Player';
import { THEMES, themeStyle } from '@/story/themes';

export function StoryClient({ deck }: { deck: DeckId }) {
  const params = useSearchParams();
  const sample = params.get('sample') === '1';
  const asOf = params.get('asOf') ?? undefined;
  const router = useRouter();
  const { summary } = useEngineState();
  // Cards are tagged with their deck, so moving to the next deck shows a loading state.
  const [loaded, setLoaded] = useState<{ deck: DeckId; cards: InsightResult[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cards = loaded?.deck === deck ? loaded.cards : null;
  const setCards = useCallback((c: InsightResult[]) => setLoaded({ deck, cards: c }), [deck]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let s = await engine.restore();
        if (sample && (!s?.isSample || (asOf && s.sampleToday !== asOf))) {
          s = await engine.loadSample(asOf);
        }
        if (!s) {
          // Real data lives only in this tab's memory, so a reload starts over by design.
          router.replace('/start?reason=reload');
          return;
        }
        const c = await engine.getDeck(deck);
        if (!cancelled) setCards(c);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deck, sample, asOf, router, setCards]);

  const onOptions = useCallback(
    async (patch: OptionsPatch) => {
      await engine.setOptions(patch);
      setCards(await engine.getDeck(deck));
    },
    [deck, setCards],
  );

  const theme = THEMES[DECKS[deck].theme];
  const available = summary?.availableDecks ?? [];
  const nextDeck =
    DECK_ORDER.slice(DECK_ORDER.indexOf(deck) + 1).find((d) => available.includes(d)) ?? null;
  const q = summary?.isSample ? '?sample=1' : '';

  if (error || (cards && cards.length === 0) || !summary || !cards) {
    return (
      <div
        data-theme={theme.id}
        style={themeStyle(theme)}
        className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-(--t-bg) px-6 text-center text-(--t-text)"
      >
        {error ? (
          <>
            <p className="t-display text-3xl">Something went wrong</p>
            <p className="t-body max-w-sm text-(--t-muted)">{error}</p>
            <Link
              href="/start"
              className="rounded-full bg-(--t-cta) px-5 py-2 font-semibold text-(--t-on-cta)"
            >
              Back to your data
            </Link>
          </>
        ) : cards && cards.length === 0 ? (
          <>
            <p className="t-display text-3xl">Not enough data for this story</p>
            <p className="t-body max-w-sm text-(--t-muted)">
              {DECKS[deck].title} needs a bit more history for the selected period.
            </p>
            <Link
              href="/start"
              className="rounded-full bg-(--t-cta) px-5 py-2 font-semibold text-(--t-on-cta)"
            >
              Back to your data
            </Link>
          </>
        ) : (
          <p role="status" className="t-display text-3xl" data-testid="story-loading">
            Getting {DECKS[deck].title.replace('Your', 'your')} ready…
          </p>
        )}
      </div>
    );
  }

  return (
    <Player
      key={`${deck}-${summary.options.timeZone}-${summary.options.periodId}`}
      deck={deck}
      cards={cards}
      summary={summary}
      nextDeck={nextDeck}
      onClose={() => router.push('/start')}
      onNextDeck={() => nextDeck && router.push(`/story/${nextDeck}${q}`)}
      onOptions={(p) => void onOptions(p)}
      onClear={() => {
        void engine.clear().then(() => router.push('/start'));
      }}
    />
  );
}
