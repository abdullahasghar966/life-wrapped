'use client';
import { useRef } from 'react';
import type { YoutubeRewatched } from '@/engine/insights/youtube/rewatched';
import { Thumbnail } from '../../art/Art';
import { variant } from '../../runtime';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const TAGS = ['Comfort video?', 'A classic, clearly.', 'Some things just hit.'];

/** A generic circular "replay" arrow. */
function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path
        d="M24 8a16 16 0 1 1-15.2 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M4 10 L10 22 L18 12 Z" fill="currentColor" />
    </svg>
  );
}

export function WatchRewatched({ result }: CardProps<YoutubeRewatched>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from('[data-thumb]', { y: '8cqw', opacity: 0, duration: 0.35 }, 0)
      .from('[data-replay]', { rotate: -360, duration: 1, ease: 'power3.out' }, 0.2)
      .from('[data-times]', { scale: 0.5, opacity: 0, duration: 0.35, ease: 'back.out(2)' }, 0.5);
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Most rewatched</Eyebrow>
      <div data-thumb className="mt-[5cqw]">
        <Thumbnail name={p.title} label="Watched again" progress={1} className="w-[78%]" />
        <p className="mt-[3cqw] line-clamp-2 text-[5cqw] leading-tight font-bold break-words">
          {p.title}
        </p>
        {p.channel && <p className="truncate text-[3.8cqw] text-(--c-muted)">{p.channel}</p>}
      </div>
      <div className="mt-[5cqw] flex shrink-0 items-center gap-[5cqw]">
        <span data-replay className="text-(--c-accent)">
          <ReplayIcon className="size-[20cqw]" />
        </span>
        <p data-times className="t-display text-[24cqw] leading-none">
          <span aria-hidden>×</span>
          <CountUp value={p.times} duration={1.1} />
        </p>
      </div>
      {/* The title is right above, so the headline doesn't repeat it. */}
      <Headline className="mt-auto shrink-0 pt-[3cqw] text-[8cqw] leading-[1]" delay={0.7}>
        {`You watched it ${p.times} times. ${variant(result.seed, TAGS)}`}
      </Headline>
    </CardBody>
  );
}
