'use client';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Pause,
  Play,
  Settings2,
  Share2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OptionsPatch } from '@/engine/api';
import type { InsightResult } from '@/engine/insights/types';
import type { DeckId, IngestSummary } from '@/engine/types';
import { downloadBlob } from '@/share/capture';
import { CARDS } from './cards';
import { UnlockCard } from './cards/UnlockCard';
import { CARD_MS } from './constants';
import { DECKS } from './decks';
import { ExportStage } from './ExportStage';
import { useStoryGestures } from './gestures';
import { gsap } from './gsap';
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
  onShare?: (result: InsightResult) => void;
}

// Chrome reads its colours from the current card's ink/background pair, which the
// theme contrast test guarantees, so it stays legible on every backdrop.
const iconButton =
  'pointer-events-auto inline-flex size-[10cqw] max-h-11 max-w-11 items-center justify-center rounded-full bg-(--c-ink)/15 text-(--c-ink) transition-colors hover:bg-(--c-ink)/25 focus-visible:outline-2 focus-visible:outline-(--c-ink) disabled:opacity-40 [&_svg]:size-[5cqw] [&_svg]:max-h-5 [&_svg]:max-w-5';
const actionPill =
  't-body pointer-events-auto inline-flex items-center gap-2 rounded-full bg-(--c-ink) px-[4cqw] py-[2cqw] text-[3.3cqw] font-semibold text-(--c-bg) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-ink)';
const outsideChip = 't-body rounded-full bg-(--t-surface) px-3 py-1';

export function Player({
  deck,
  cards,
  summary,
  nextDeck,
  onClose,
  onNextDeck,
  onOptions,
  onClear,
  onShare,
}: PlayerProps) {
  const theme = THEMES[DECKS[deck].theme];
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
  const [exporting, setExporting] = useState(false);
  const paused = userPaused || holding || settingsOpen || hidden || exporting;

  const safeIndex = Math.min(index, slides.length - 1);
  const slide = slides[safeIndex]!;
  const total = slides.length;
  const isLast = safeIndex === total - 1;
  const autoAdvance = slide.kind === 'insight' && !slide.result.id.endsWith('.summary') && !isLast;

  const slideRef = useRef<SlideHandle>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Progress chrome listens to the current card's elapsed fraction.
  const listeners = useRef(new Set<(p: number) => void>());
  const subscribe = useCallback<ProgressSubscribe>((cb) => {
    listeners.current.add(cb);
    return () => listeners.current.delete(cb);
  }, []);
  const emit = (p: number) => listeners.current.forEach((cb) => cb(p));

  const go = useCallback(
    (to: number) => {
      if (to < 0) return;
      if (to >= total) {
        if (nextDeck) onNextDeck();
        return;
      }
      setDirection(to >= safeIndex ? 1 : -1);
      setIndex(to);
    },
    [total, nextDeck, onNextDeck, safeIndex],
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
      if (settingsOpen || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
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
  }, [next, prev, onClose, settingsOpen]);

  const backdrop =
    slide.kind === 'insight'
      ? theme.backdrops[(CARDS[slide.result.id]?.backdrop ?? safeIndex) % theme.backdrops.length]!
      : theme.backdrops[0]!;

  const label =
    slide.kind === 'insight'
      ? `${safeIndex + 1} of ${total}: ${slide.result.title}`
      : `${safeIndex + 1} of ${total}: ${slide.title}`;
  const announcement =
    slide.kind === 'insight'
      ? `${label}. ${slide.result.a11y}`
      : `${label}. Add another platform to unlock your online life story.`;

  const [exportError, setExportError] = useState(false);
  function saveImage() {
    if (slide.kind !== 'insight') return;
    setExportError(false);
    setExporting(true);
  }
  function onExported(blob: Blob | null) {
    setExporting(false);
    if (blob && slide.kind === 'insight') {
      downloadBlob(blob, `life-wrapped-${slide.result.id.replace('.', '-')}.png`);
    } else setExportError(true);
  }

  const sample = summary.isSample;
  const nextHref = nextDeck ? `/story/${nextDeck}${sample ? '?sample=1' : ''}` : null;
  const Card = slide.kind === 'insight' ? CARDS[slide.result.id]?.Component : null;

  return (
    <div
      data-theme={theme.id}
      data-testid="story-player"
      style={themeStyle(theme)}
      className="fixed inset-0 z-50 overflow-hidden bg-(--t-bg) text-(--t-text)"
    >
      {/* Desktop: a soft wash of the current card's colour behind the frame (a gradient, not a costly blur). */}
      <div
        aria-hidden
        className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--c-bg)_30%,var(--t-bg))_0%,var(--t-bg)_70%)] sm:block"
        style={backdropStyle(backdrop)}
      />

      {sample && (
        <p className="absolute inset-x-0 top-3 z-10 hidden justify-center sm:flex">
          <span className={`${outsideChip} text-sm text-(--t-muted)`}>
            You&apos;re viewing sample data for Alex ·{' '}
            <Link
              href="/start"
              className="font-semibold text-(--t-text) underline underline-offset-4"
            >
              Use your own data →
            </Link>
          </span>
        </p>
      )}

      <div className="relative flex h-full items-center justify-center gap-6">
        <button
          type="button"
          onClick={prev}
          disabled={safeIndex === 0}
          aria-label="Previous card"
          className="hidden size-12 items-center justify-center rounded-full bg-(--t-text)/10 text-(--t-text) transition hover:bg-(--t-text)/20 disabled:opacity-30 sm:flex"
        >
          <ChevronLeft className="size-6" />
        </button>

        <div
          data-testid="story-frame"
          style={backdropStyle(backdrop)}
          className="[container-type:size] relative h-dvh w-screen overflow-hidden sm:aspect-[9/16] sm:h-[min(90vh,920px)] sm:w-auto sm:rounded-(--t-radius-frame) sm:shadow-2xl"
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
              {slide.kind === 'insight' && slide.result.shareable && onShare && (
                <button type="button" onClick={() => onShare(slide.result)} className={actionPill}>
                  <Share2 className="size-[4cqw] max-h-4 max-w-4" /> Share link
                </button>
              )}
              {isLast && nextHref && (
                <Link
                  href={nextHref}
                  className="t-body pointer-events-auto inline-flex items-center gap-2 rounded-full bg-(--t-cta) px-[4.5cqw] py-[2cqw] text-[3.4cqw] font-bold text-(--t-on-cta) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-ink)"
                >
                  Next: {DECKS[nextDeck!].next} →
                </Link>
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
        </div>

        <button
          type="button"
          onClick={next}
          disabled={isLast && !nextDeck}
          aria-label="Next card"
          className="hidden size-12 items-center justify-center rounded-full bg-(--t-text)/10 text-(--t-text) transition hover:bg-(--t-text)/20 disabled:opacity-30 sm:flex"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>

      <p className="absolute inset-x-0 bottom-3 hidden justify-center sm:flex">
        <span className={`${outsideChip} text-xs text-(--t-muted)`}>
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

      {exporting && slide.kind === 'insight' && Card && (
        <ExportStage theme={theme} backdrop={backdrop} seed={slide.result.seed} onDone={onExported}>
          <Card result={slide.result} />
        </ExportStage>
      )}

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
