'use client';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Music2,
  Pause,
  Play,
  Settings2,
  Share2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { OptionsPatch } from '@/engine/api';
import type { InsightResult } from '@/engine/insights/types';
import type { DeckId, IngestSummary } from '@/engine/types';
import { BrandMark } from '@/components/brand';
import { downloadBlob } from '@/share/capture';
import { cardImageName } from '@/share/nativeShare';
import { ShareSheet, type CardImage } from '@/share/ShareSheet';
import { CARDS } from './cards';
import { UnlockCard } from './cards/UnlockCard';
import { CARD_MS } from './constants';
import { DECKS } from './decks';
import { cubeIn, cubeOut } from './depth';
import { ExportStage } from './ExportStage';
import { useStoryGestures } from './gestures';
import { gsap, useGSAP } from './gsap';
import { Progress, type ProgressSubscribe } from './progress/Progress';
import { useReducedMotion } from './runtime';
import { SettingsSheet } from './SettingsSheet';
import { Slide, type SlideHandle } from './Slide';
import { backdropStyle, THEMES, themeStyle } from './themes';

export type SlideItem =
  { kind: 'insight'; result: InsightResult } | { kind: 'unlock'; title: string };

export interface PlayerProps {
  deck: DeckId;
  cards: InsightResult[];
  summary: IngestSummary;
  nextDeck: DeckId | null;
  onClose: () => void;
  onNextDeck: () => void;
  onOptions: (patch: OptionsPatch) => void;
  onClear: () => void;
  /** This deck was reached from the previous one, so it turns in like a cube. */
  enterCube?: boolean;
  onEntered?: () => void;
  /** Opens the picker for a song or video to play alongside (own data only). */
  onOpenMedia?: () => void;
  mediaLabel?: string;
  /** Pauses the story while something outside the player (the media picker) is open. */
  externalPause?: boolean;
}

// Chrome reads its colours from the current card's ink/background pair, which the
// theme contrast test guarantees, so it stays legible on every backdrop.
const iconButton =
  'pointer-events-auto inline-flex size-[10cqw] max-h-11 max-w-11 items-center justify-center rounded-full bg-(--c-ink)/15 text-(--c-ink) transition-colors hover:bg-(--c-ink)/25 focus-visible:outline-2 focus-visible:outline-(--c-ink) disabled:opacity-40 [&_svg]:size-[5cqw] [&_svg]:max-h-5 [&_svg]:max-w-5';
const actionPill =
  't-body pointer-events-auto inline-flex items-center gap-2 rounded-full bg-(--c-ink) px-[4cqw] py-[2cqw] text-[3.3cqw] font-semibold text-(--c-bg) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-ink)';
// Around the frame, the app's own receipt brand (ADR-038): paper, ink, mono labels.
const outsideChip = 'border-ink bg-paper-2 border-[1.5px] px-3 py-1 font-mono uppercase';
const outsideNav =
  'border-ink bg-paper-2 text-ink hover:bg-ink hover:text-paper hidden size-12 items-center justify-center border-[1.5px] shadow-[3px_3px_0_0_var(--color-ink)] transition-colors disabled:opacity-30 disabled:hover:bg-paper-2 disabled:hover:text-ink sm:flex';
const ctaPill =
  't-body pointer-events-auto inline-flex items-center gap-2 rounded-full bg-(--t-cta) px-[4.5cqw] py-[2cqw] text-[3.4cqw] font-bold text-(--t-on-cta) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-ink)';

export function Player({
  deck,
  cards,
  summary,
  nextDeck,
  onClose,
  onNextDeck,
  onOptions,
  onClear,
  enterCube = false,
  onEntered,
  onOpenMedia,
  mediaLabel,
  externalPause = false,
}: PlayerProps) {
  const theme = THEMES[DECKS[deck].theme];
  const shell = THEMES.receipt;
  const reduced = useReducedMotion();

  const slides = useMemo<SlideItem[]>(() => {
    const items: SlideItem[] = cards.map((result) => ({ kind: 'insight', result }));
    // Platform decks end with an invitation when the combined deck isn't unlocked yet.
    if (deck !== 'life' && !summary.availableDecks.includes('life')) {
      items.push({ kind: 'unlock', title: 'Unlock your online life' });
    }
    return items;
  }, [cards, deck, summary.availableDecks]);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [userPaused, setUserPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  // The off-screen 1080 × 1920 render, for "Save image" or for the share sheet.
  const [capture, setCapture] = useState<{ purpose: 'save' | 'share'; n: number } | null>(null);
  const [sharing, setSharing] = useState<InsightResult | null>(null);
  const [shareImage, setShareImage] = useState<CardImage>({ state: 'rendering' });
  const exporting = capture?.purpose === 'save';
  // The deck-to-deck cube: entering holds the story still until the turn has finished.
  const [entering, setEntering] = useState(() => enterCube && !reduced);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const paused =
    userPaused ||
    holding ||
    settingsOpen ||
    hidden ||
    !!capture ||
    !!sharing ||
    entering ||
    leaving ||
    externalPause;

  const safeIndex = Math.min(index, slides.length - 1);
  const slide = slides[safeIndex]!;
  const total = slides.length;
  const isLast = safeIndex === total - 1;
  const autoAdvance = slide.kind === 'insight' && !slide.result.id.endsWith('.summary') && !isLast;

  const slideRef = useRef<SlideHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!entering || !sceneRef.current || !frameRef.current) return;
      cubeIn(sceneRef.current, frameRef.current, shadeRef.current).call(() => {
        setEntering(false);
        onEntered?.();
      });
    },
    { dependencies: [] },
  );

  const leaveDeck = useCallback(() => {
    if (!nextDeck || leavingRef.current) return;
    if (reduced || !sceneRef.current || !frameRef.current) {
      onNextDeck();
      return;
    }
    leavingRef.current = true;
    setLeaving(true);
    void cubeOut(sceneRef.current, frameRef.current, shadeRef.current).then(onNextDeck);
  }, [nextDeck, reduced, onNextDeck]);

  // Progress chrome listens to the current card's elapsed fraction.
  const listeners = useRef(new Set<(p: number) => void>());
  const subscribe = useCallback<ProgressSubscribe>((cb) => {
    listeners.current.add(cb);
    return () => listeners.current.delete(cb);
  }, []);
  const emit = (p: number) => listeners.current.forEach((cb) => cb(p));

  const go = useCallback(
    (to: number) => {
      if (to < 0 || leavingRef.current) return;
      if (to >= total) {
        leaveDeck();
        return;
      }
      setDirection(to >= safeIndex ? 1 : -1);
      setIndex(to);
    },
    [total, leaveDeck, safeIndex],
  );
  const next = useCallback(() => go(safeIndex + 1), [go, safeIndex]);
  const prev = useCallback(() => go(safeIndex - 1), [go, safeIndex]);

  // Auto-advance: one tween per card, paused whenever anything pauses the story.
  const timer = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    const proxy = { p: 0 };
    emit(autoAdvance ? 0 : 1);
    if (!autoAdvance) return;
    const tween = gsap.to(proxy, {
      p: 1,
      duration: CARD_MS / 1000,
      ease: 'none',
      onUpdate: () => emit(proxy.p),
      onComplete: next,
    });
    timer.current = tween;
    return () => {
      tween.kill();
      timer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the card changes
  }, [safeIndex, autoAdvance, slides]);

  useEffect(() => {
    if (paused) timer.current?.pause();
    else timer.current?.resume();
    slideRef.current?.controller.setPaused(paused);
  }, [paused, safeIndex]);

  // Pause while the tab is in the background.
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useStoryGestures(stageRef, {
    onPrev: prev,
    onNext: next,
    onHold: setHolding,
    onSwipeDown: onClose,
  });

  // Keyboard: ←/→ move, Space pauses, Esc closes. Ignored while a dialog is open
  // and when focus is on a control that uses the key itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        settingsOpen ||
        sharing ||
        externalPause ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      const t = e.target as Element | null;
      if (t?.closest('[role=dialog], input, select, textarea')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        if (t?.closest('button, a')) return;
        e.preventDefault();
        setUserPaused((p) => !p);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, settingsOpen, sharing, externalPause]);

  const backdrop =
    slide.kind === 'insight'
      ? theme.backdrops[(CARDS[slide.result.id]?.backdrop ?? safeIndex) % theme.backdrops.length]!
      : theme.backdrops[0]!;

  // A deck's last card carries three actions (save, share, and the next deck or
  // the way out), which wrap onto a second row, so its content leaves room for them.
  // The frame carries the deck's platform theme; everything around it stays in the app's own.
  const frameStyle = {
    ...themeStyle(theme),
    ...backdropStyle(backdrop),
    ...(isLast ? { '--card-pb': '27cqw' } : {}),
  } as CSSProperties;

  const label =
    slide.kind === 'insight'
      ? `${safeIndex + 1} of ${total}: ${slide.result.title}`
      : `${safeIndex + 1} of ${total}: ${slide.title}`;
  const announcement =
    slide.kind === 'insight'
      ? `${label}. ${slide.result.a11y}`
      : `${label}. Add another platform to unlock your online life story.`;

  const [exportError, setExportError] = useState(false);
  const startCapture = (purpose: 'save' | 'share') =>
    setCapture((c) => ({ purpose, n: (c?.n ?? 0) + 1 }));
  function saveImage() {
    if (slide.kind !== 'insight') return;
    setExportError(false);
    startCapture('save');
  }
  function openShare() {
    if (slide.kind !== 'insight') return;
    setSharing(slide.result);
    setShareImage({ state: 'rendering' });
    startCapture('share');
  }
  function onExported(blob: Blob | null) {
    const purpose = capture?.purpose;
    setCapture(null);
    if (purpose === 'share') {
      setShareImage(blob ? { state: 'ready', blob } : { state: 'error' });
    } else if (blob && slide.kind === 'insight') {
      downloadBlob(blob, cardImageName(slide.result.id));
    } else setExportError(true);
  }

  const sample = summary.isSample;
  const nextHref = nextDeck ? `/story/${nextDeck}${sample ? '?sample=1' : ''}` : null;
  const Card = slide.kind === 'insight' ? CARDS[slide.result.id]?.Component : null;

  return (
    <div
      data-theme={shell.id}
      data-testid="story-player"
      style={themeStyle(shell)}
      className="fixed inset-0 z-50 overflow-hidden bg-(--t-bg) text-(--t-text)"
    >
      {/* Desktop: the same receipt brand as the landing page frames every story. */}
      <Link
        href="/"
        prefetch={false}
        aria-label="Life, Wrapped home"
        className="absolute top-4 left-6 z-10 hidden sm:flex"
      >
        <BrandMark />
      </Link>
      <ol
        aria-label="Your stories"
        className="bg-paper absolute top-16 left-6 z-10 hidden flex-col gap-2 font-mono text-[0.7rem] tracking-[0.08em] uppercase lg:flex"
      >
        {summary.availableDecks.map((d, i) => (
          <li
            key={d}
            aria-current={d === deck ? 'step' : undefined}
            className={`flex items-center gap-1.5 ${d === deck ? 'text-ink font-semibold' : 'text-ink-2'}`}
          >
            <span
              aria-hidden
              className={`size-2 ${d === deck ? 'bg-red' : 'border-ink-2 border'}`}
            />
            {String(i + 1).padStart(2, '0')} {DECKS[d].short}
          </li>
        ))}
      </ol>

      {sample && (
        <p className="absolute inset-x-0 top-3 z-10 hidden justify-center sm:flex">
          <span className={`${outsideChip} text-ink-2 text-[0.7rem] tracking-[0.06em]`}>
            You&apos;re viewing sample data for Alex ·{' '}
            <Link
              href="/start"
              className="text-ink decoration-red font-semibold underline decoration-2 underline-offset-4"
            >
              Use your own data →
            </Link>
          </span>
        </p>
      )}

      <div ref={sceneRef} className="relative flex h-full items-center justify-center gap-6">
        <button
          type="button"
          onClick={prev}
          disabled={safeIndex === 0}
          aria-label="Previous card"
          className={outsideNav}
        >
          <ChevronLeft className="size-6" />
        </button>

        <div
          ref={frameRef}
          data-testid="story-frame"
          data-theme={theme.id}
          style={frameStyle}
          className="sm:ring-ink [container-type:size] relative h-dvh w-screen overflow-hidden bg-(--t-bg) sm:aspect-[9/16] sm:h-[min(90vh,920px)] sm:w-auto sm:rounded-(--t-radius-frame) sm:shadow-[8px_8px_0_0_var(--color-ink)] sm:ring-[1.5px]"
        >
          <div
            ref={stageRef}
            data-testid="story-stage"
            className="absolute inset-0 touch-pan-y select-none"
          >
            {Card || slide.kind === 'unlock' ? (
              <Slide
                key={`${deck}-${safeIndex}`}
                ref={slideRef}
                theme={theme}
                backdrop={backdrop}
                reduced={reduced}
                seed={slide.kind === 'insight' ? slide.result.seed : 0}
                direction={direction}
                label={label}
              >
                {slide.kind === 'insight' && Card ? <Card result={slide.result} /> : <UnlockCard />}
              </Slide>
            ) : null}
          </div>

          {/* Top chrome: progress, title and controls. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-[2.5cqw] p-[3.5cqw]">
            <Progress theme={theme.id} total={total} index={safeIndex} subscribe={subscribe} />
            <div className="flex items-center justify-between gap-2">
              <span className="t-body truncate text-[3.4cqw] font-semibold text-(--c-ink)">
                {DECKS[deck].title}
                {sample && <span className="ml-2 text-(--c-muted) sm:hidden">· sample</span>}
              </span>
              <div className="flex items-center gap-[2cqw]">
                {onOpenMedia && (
                  <button
                    type="button"
                    className={iconButton}
                    onClick={onOpenMedia}
                    aria-label={mediaLabel ?? 'Play something while you watch'}
                    aria-haspopup="dialog"
                  >
                    <Music2 />
                  </button>
                )}
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? 'Play' : 'Pause'}
                  aria-pressed={userPaused}
                >
                  {userPaused ? <Play /> : <Pause />}
                </button>
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Settings"
                >
                  <Settings2 />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  onClick={onClose}
                  aria-label="Close story"
                >
                  <X />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom chrome: card actions and (on phones) visible previous/next buttons. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-[3.5cqw]">
            <button
              type="button"
              className={`${iconButton} sm:hidden`}
              onClick={prev}
              disabled={safeIndex === 0}
              aria-label="Previous card"
            >
              <ChevronLeft />
            </button>
            <div className="flex flex-1 flex-wrap items-center justify-center gap-[2cqw]">
              {slide.kind === 'insight' && (
                <button
                  type="button"
                  onClick={saveImage}
                  disabled={exporting}
                  className={actionPill}
                >
                  <Download className="size-[4cqw] max-h-4 max-w-4" />{' '}
                  {exporting ? 'Saving…' : 'Save image'}
                </button>
              )}
              {slide.kind === 'insight' && (
                <button
                  type="button"
                  onClick={openShare}
                  className={actionPill}
                  aria-haspopup="dialog"
                >
                  <Share2 className="size-[4cqw] max-h-4 max-w-4" /> Share
                </button>
              )}
              {isLast && nextHref && (
                <Link
                  href={nextHref}
                  onClick={(e) => {
                    // Same in-page switch as the arrow keys; the href serves new tabs.
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    leaveDeck();
                  }}
                  className={ctaPill}
                >
                  Next: {DECKS[nextDeck!].next} →
                </Link>
              )}
              {isLast && !nextHref && (
                <button type="button" onClick={onClose} className={ctaPill}>
                  See all my stories →
                </button>
              )}
            </div>
            <button
              type="button"
              className={`${iconButton} sm:hidden`}
              onClick={next}
              disabled={isLast && !nextDeck}
              aria-label="Next card"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Darkens the face as it turns away during the deck-to-deck cube. */}
          <div
            ref={shadeRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30 bg-black opacity-0"
          />
        </div>

        <button
          type="button"
          onClick={next}
          disabled={isLast && !nextDeck}
          aria-label="Next card"
          className={outsideNav}
        >
          <ChevronRight className="size-6" />
        </button>
      </div>

      <p className="absolute inset-x-0 bottom-3 hidden justify-center sm:flex">
        {/* An explicit paper background: the Spotify wipe blob, clipped by the frame, would otherwise confuse contrast checkers. */}
        <span className="text-ink-2 bg-paper px-2 font-mono text-[0.68rem] tracking-[0.08em] uppercase">
          ← → to move · Space to pause · Esc to close · hold the card to pause
        </span>
      </p>

      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="story-announcer">
        {announcement}
      </div>
      {exportError && (
        <p role="alert" className="sr-only">
          The image couldn&apos;t be saved. Please try again.
        </p>
      )}

      {capture && slide.kind === 'insight' && Card && (
        <ExportStage
          key={capture.n}
          theme={theme}
          backdrop={backdrop}
          seed={slide.result.seed}
          onDone={onExported}
        >
          <Card result={slide.result} />
        </ExportStage>
      )}

      <ShareSheet
        result={sharing}
        isSample={summary.isSample}
        image={shareImage}
        onSaveImage={() => {
          if (sharing && shareImage.state === 'ready') {
            downloadBlob(shareImage.blob, cardImageName(sharing.id));
          }
        }}
        onRetryImage={() => {
          setShareImage({ state: 'rendering' });
          startCapture('share');
        }}
        onOpenChange={(open) => {
          if (!open) setSharing(null);
        }}
      />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        summary={summary}
        onChange={onOptions}
        onClear={onClear}
      />
    </div>
  );
}
