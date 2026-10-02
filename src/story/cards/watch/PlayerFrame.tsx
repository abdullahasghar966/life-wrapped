import type { ReactNode } from 'react';

/**
 * A generic 16:9 video player: dark surface, a red scrubber with a round knob and
 * a time readout. No platform logo or icons; the play triangle is a plain shape.
 */
export function PlayerFrame({
  children,
  progress = 0.35,
  time,
  className,
}: {
  children?: ReactNode;
  progress?: number;
  time?: string;
  className?: string;
}) {
  return (
    <div
      data-player
      className={`relative aspect-video w-full overflow-hidden rounded-(--t-radius-frame) bg-(--t-surface) ${className ?? ''}`}
    >
      {children}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-(--t-bg)/70 to-transparent px-[3cqw] pt-[6cqw] pb-[2.4cqw]">
        <div className="relative h-[1cqw] bg-(--t-text)/30">
          <div
            data-scrub
            className="absolute inset-0 origin-left bg-(--t-accent)"
            style={{ transform: `scaleX(${progress})` }}
          />
          <div
            data-knob
            className="absolute inset-0"
            style={{ transform: `translateX(${progress * 100}%)` }}
          >
            <span className="absolute top-1/2 left-0 size-[3cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--t-accent)" />
          </div>
        </div>
        {time && (
          <p className="mt-[1.6cqw] text-[3cqw] font-medium text-(--t-text) tabular-nums">{time}</p>
        )}
      </div>
    </div>
  );
}

export function PlayTriangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={className}>
      <path d="M12 7 L33 20 L12 33 Z" fill="currentColor" strokeLinejoin="round" />
    </svg>
  );
}
