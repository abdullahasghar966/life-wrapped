'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OptionsPatch } from '@/engine/api';
import type { InsightResult } from '@/engine/insights/types';
import type { DeckId, TopMedia } from '@/engine/types';
import { BrandMark } from '@/components/brand';
import { engine, useEngineState } from '@/lib/engineStore';
import { MediaDock } from '@/media/MediaDock';
import { MediaPicker, type MediaKind, type Playing } from '@/media/MediaPicker';
import { DECK_ORDER, DECKS, isDeckId } from '@/story/decks';
import { Player } from '@/story/Player';
import { THEMES, themeStyle } from '@/story/themes';

type Loaded = Partial<Record<DeckId, InsightResult[]>>;

const NO_MEDIA: TopMedia = { songs: [], videos: [] };
/** Each picker pops up once per tab; the music button opens it again (ADR-040). */
const offered = new Set<MediaKind>();

export function StoryClient({ deck: initialDeck }: { deck: DeckId }) {
  // Moving to the next deck only changes the URL (history.pushState): the data
  // lives in this tab's worker, so a page load (say, offline) would lose it.
  const segment = usePathname().split('/')[2];
  const deck = segment && isDeckId(segment) ? segment : initialDeck;
  const params = useSearchParams();
  const sample = params.get('sample') === '1';
  const asOf = params.get('asOf') ?? undefined;
  const router = useRouter();
  const { summary } = useEngineState();
  // Cards per deck. The next deck is fetched ahead, so the cube turn between decks
  // never stops on a loading screen. Changing an option starts the map over.
  const [loaded, setLoaded] = useState<Loaded>({});
  const generation = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [enterCube, setEnterCube] = useState<DeckId | null>(null);
  const cards = loaded[deck] ?? null;
  // Songs and videos to play alongside: own data only, fetched from the worker.
  const [fetchedMedia, setFetchedMedia] = useState<TopMedia>(NO_MEDIA);
  const [picker, setPicker] = useState<MediaKind | null>(null);
  const [playing, setPlaying] = useState<Playing | null>(null);
  const media = summary && !summary.isSample ? fetchedMedia : NO_MEDIA;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let s = await engine.restore();
        if (sample && (!s?.isSample || (asOf && s.sampleToday !== asOf))) {
          s = await engine.loadSample(asOf);
        }
        if (cancelled) return;
        if (!s) {
          // Real data lives only in this tab's memory, so a reload starts over by design.
          router.replace('/start?reason=reload');
          return;
        }
        const gen = generation.current;
        const c = await engine.getDeck(deck);
        // Keep a prefetched copy: a new array would restart the first card's timer.
        if (!cancelled && gen === generation.current) {
          setLoaded((m) => (m[deck] ? m : { ...m, [deck]: c }));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deck, sample, asOf, router]);

  const onOptions = useCallback(
    async (patch: OptionsPatch) => {
      const gen = ++generation.current;
      await engine.setOptions(patch);
      const c = await engine.getDeck(deck);
      if (gen === generation.current) setLoaded({ [deck]: c });
    },
    [deck],
  );

  useEffect(() => {
    document.title = `${DECKS[deck].title} · Life, Wrapped`;
  }, [deck]);

  useEffect(() => {
    if (!summary || summary.isSample) return;
    let cancelled = false;
    engine.topMedia().then(
      (m) => {
        if (!cancelled) setFetchedMedia(m);
      },
      () => {
        /* no picker then; the stories don't depend on it */
      },
    );
    return () => {
      cancelled = true;
    };
  }, [summary]);

  const available = summary?.availableDecks ?? [];
  const nextDeck =
    DECK_ORDER.slice(DECK_ORDER.indexOf(deck) + 1).find((d) => available.includes(d)) ?? null;
  const q = summary?.isSample ? '?sample=1' : '';

  // Fetch the next deck while this one plays.
  const ready = !!cards;
  useEffect(() => {
    if (!ready || !nextDeck || loaded[nextDeck]) return;
    const gen = generation.current;
    let cancelled = false;
    engine.getDeck(nextDeck).then(
      (c) => {
        if (!cancelled && gen === generation.current) {
          setLoaded((m) => (m[nextDeck] ? m : { ...m, [nextDeck]: c }));
        }
      },
      () => {
        /* the deck loads normally when it is opened */
      },
    );
    return () => {
      cancelled = true;
    };
  }, [ready, nextDeck, loaded]);

  // The Spotify story offers songs and the YouTube story videos, once each, as they start.
  const offerKind: MediaKind | null =
    deck === 'spotify' && media.songs.length > 0
      ? 'songs'
      : deck === 'youtube' && media.videos.length > 0
        ? 'videos'
        : null;
  useEffect(() => {
    if (!ready || !offerKind || offered.has(offerKind) || !navigator.onLine) return;
    const id = window.setTimeout(() => {
      offered.add(offerKind);
      setPicker(offerKind);
    }, 700);
    return () => window.clearTimeout(id);
  }, [ready, offerKind]);
  const buttonKind: MediaKind | null =
    (deck === 'youtube' ? (['videos', 'songs'] as const) : (['songs', 'videos'] as const)).find(
      (k) => media[k].length > 0,
    ) ?? null;

  const goNextDeck = useCallback(() => {
    if (!nextDeck) return;
    setEnterCube(nextDeck);
    window.history.pushState(null, '', `/story/${nextDeck}${q}`);
  }, [nextDeck, q]);

  const shell = THEMES.receipt;

  // The player for a picked song or video sits outside the story, so it keeps
  // playing through loading screens and from one deck to the next.
  const extras = (
    <>
      {playing && <MediaDock playing={playing} onClose={() => setPlaying(null)} />}
      <MediaPicker
        kind={picker}
        media={media}
        playing={playing}
        onPick={(p) => {
          setPlaying(p);
          setPicker(null);
        }}
        onOpenChange={(open) => {
          if (!open) setPicker(null);
        }}
      />
    </>
  );

  if (error || (cards && cards.length === 0) || !summary || !cards) {
    return (
      <>
        <div
          data-theme={shell.id}
          style={themeStyle(shell)}
          className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-(--t-bg) px-6 text-center text-(--t-text)"
        >
          <span className="absolute top-4 left-6 hidden sm:flex">
            <BrandMark />
          </span>
          {error ? (
            <>
              <p className="t-display text-3xl">Something went wrong</p>
              <p className="t-body max-w-sm text-(--t-muted)">{error}</p>
              <Link
                href="/start"
                className="bg-(--t-cta) px-5 py-2.5 font-semibold text-(--t-on-cta)"
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
                className="bg-(--t-cta) px-5 py-2.5 font-semibold text-(--t-on-cta)"
              >
                Back to your data
              </Link>
            </>
          ) : (
            <>
              <PrintingSlip />
              <p role="status" className="t-display text-4xl" data-testid="story-loading">
                Getting {DECKS[deck].title.replace('Your', 'your')} ready…
              </p>
            </>
          )}
        </div>
        {extras}
      </>
    );
  }

  return (
    <>
      <Player
        key={`${deck}-${summary.options.timeZone}-${summary.options.periodId}`}
        deck={deck}
        cards={cards}
        summary={summary}
        nextDeck={nextDeck}
        enterCube={enterCube === deck}
        onEntered={() => setEnterCube(null)}
        onClose={() => router.push('/start')}
        onNextDeck={goNextDeck}
        onOptions={(p) => void onOptions(p)}
        onClear={() => {
          offered.clear();
          void engine.clear().then(() => router.push('/start'));
        }}
        onOpenMedia={buttonKind ? () => setPicker(buttonKind) : undefined}
        mediaLabel={
          buttonKind === 'videos'
            ? 'Play one of your most-watched videos'
            : 'Play one of your most-played songs'
        }
        externalPause={picker !== null}
      />
      {extras}
    </>
  );
}

/** A receipt slip printing line by line while a story is prepared (stepped, like a printer). */
function PrintingSlip() {
  return (
    <div aria-hidden className="bg-paper-2 border-ink w-40 overflow-hidden border-[1.5px] p-3">
      <div className="flex animate-[slip-print_1.6s_steps(6)_infinite] flex-col gap-2">
        {[80, 55, 70, 40, 65, 50].map((w, i) => (
          <span key={i} className="bg-ink h-1.5" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
