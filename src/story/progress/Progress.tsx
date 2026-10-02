'use client';
import { useEffect, useRef } from 'react';
import type { ThemeId } from '../themes/tokens';

export type ProgressSubscribe = (cb: (p: number) => void) => () => void;

interface Props {
  theme: ThemeId;
  total: number;
  index: number;
  subscribe: ProgressSubscribe;
}

/**
 * Per-theme progress chrome (§10.2): rounded pills (sound), one video scrubber
 * (watch), thin segments with an episode label (binge), gradient lines (aurora).
 * Tracks use the card's ink colour so they show on light and dark backdrops.
 */
export function Progress(props: Props) {
  if (props.theme === 'watch') return <Scrubber {...props} />;
  return <Segments {...props} />;
}

const TRACK: Record<Exclude<ThemeId, 'watch'>, string> = {
  sound: 'h-[1.1cqw] rounded-full bg-(--c-ink)/30',
  binge: 'h-[0.6cqw] bg-(--c-ink)/25',
  aurora: 'h-[0.55cqw] rounded-full bg-(--c-ink)/20',
};

const BAR: Record<Exclude<ThemeId, 'watch'>, string> = {
  sound: 'rounded-full bg-(--c-ink)',
  binge: 'bg-(--t-accent)',
  aurora: 'rounded-full bg-[image:var(--t-gradient)]',
};

function Segments({ theme, total, index, subscribe }: Props) {
  const fill = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      subscribe((p) => {
        if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      }),
    [subscribe, index],
  );
  const t = theme === 'watch' ? 'sound' : theme;
  return (
    <div aria-hidden className="flex w-full flex-col gap-[1.6cqw]">
      <div className="flex w-full gap-[1cqw]">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`relative flex-1 overflow-hidden ${TRACK[t]}`}>
            <span
              ref={i === index ? fill : undefined}
              className={`absolute inset-0 origin-left ${BAR[t]}`}
              style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
            />
          </span>
        ))}
      </div>
      {theme === 'binge' && (
        <span className="t-body text-[3cqw] font-semibold tracking-wide text-(--c-muted) uppercase">
          Episode {index + 1} of {total}
        </span>
      )}
    </div>
  );
}

/** One red scrubber for the whole deck, a chapter notch per card and a round knob. */
function Scrubber({ total, index, subscribe }: Props) {
  const played = useRef<HTMLSpanElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      subscribe((p) => {
        const x = (index + p) / total;
        if (played.current) played.current.style.transform = `scaleX(${x})`;
        // The knob rides on a full-width layer, so a % translate is a % of the track.
        if (knob.current) knob.current.style.transform = `translateX(${x * 100}%)`;
      }),
    [subscribe, index, total],
  );
  return (
    <div aria-hidden className="relative h-[3cqw] w-full">
      <span className="absolute inset-x-0 top-1/2 h-[0.8cqw] -translate-y-1/2 overflow-hidden bg-(--c-ink)/25">
        <span
          ref={played}
          className="absolute inset-0 origin-left bg-(--t-accent)"
          style={{ transform: `scaleX(${index / total})` }}
        />
        {Array.from({ length: total - 1 }, (_, i) => (
          <span
            key={i}
            className="absolute inset-y-0 w-[0.6cqw] -translate-x-1/2 bg-(--c-bg)"
            style={{ left: `${((i + 1) / total) * 100}%` }}
          />
        ))}
      </span>
      <span
        ref={knob}
        className="absolute inset-0"
        style={{ transform: `translateX(${(index / total) * 100}%)` }}
      >
        <span className="absolute top-1/2 left-0 size-[3cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--t-accent)" />
      </span>
    </div>
  );
}
