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
      <div data-thumb className="mt-[6cqw]">
        <Thumbnail name={p.title} label="Watched again" progress={1} className="w-full" />
        <p className="mt-[3cqw] text-[5cqw] leading-tight font-bold">{p.title}</p>
        {p.channel && <p className="text-[3.8cqw] text-(--c-muted)">{p.channel}</p>}
      </div>
      <div className="mt-[8cqw] flex items-center gap-[5cqw]">
        <span data-replay className="text-(--t-accent)">
          <ReplayIcon className="size-[26cqw]" />
        </span>
        <p data-times className="t-display text-[30cqw] leading-none">
          <span aria-hidden>×</span>
          <CountUp value={p.times} duration={1.1} />
        </p>
      </div>
      <Headline className="mt-auto text-[8cqw] leading-[1]" delay={0.7}>
        {`You watched “${p.title}” ${p.times} times. ${variant(result.seed, TAGS)}`}
      </Headline>
    </CardBody>
  );
}
