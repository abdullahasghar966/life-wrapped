'use client';
import { useRef } from 'react';
import type { BingeRecord as BingeRecordProps } from '@/engine/insights/netflix/shared';
import { fmtShortDayMonth } from '@/lib/format';
import { variant } from '../../runtime';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers } from './Cinema';

const TAGS = ['Snacks were involved.', 'No regrets.', 'The couch remembers.'];

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        data-hand
        d="M24 24 L24 10"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M24 24 L33 29" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BingeRecord({ result }: CardProps<BingeRecordProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const shown = p.episodes.slice(0, 9);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-tile]',
      { y: '-6cqw', opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.12 },
      0.2,
    ).fromTo(
      '[data-hand]',
      { rotate: 0, transformOrigin: '50% 100%' },
      { rotate: 720, duration: 1.6, ease: 'power2.inOut' },
      0.2,
    );
  });
  const date = fmtShortDayMonth(p.date);
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Binge record · {date}</Eyebrow>
      <div className="relative mt-[2cqw] flex items-end gap-[4cqw]">
        <p className="t-display text-[26cqw] leading-[0.8]">
          <CountUp value={p.count} duration={1.4} />
        </p>
        <p className="t-display pb-[1cqw] text-[7.4cqw] leading-[0.95] text-(--c-muted)">
          episodes
          <br />
          in one day
        </p>
        <ClockIcon className="mb-[1cqw] ml-auto size-[15cqw] text-(--c-accent)" />
      </div>
      <ol className="relative mt-[4cqw] flex flex-col gap-[1cqw]">
        {shown.map((e, i) => (
          <li
            key={i}
            data-tile
            className="flex items-center gap-[3cqw] border-l-[1.2cqw] border-(--c-accent) bg-(--t-surface) px-[3cqw] py-[0.9cqw]"
          >
            <span className="t-display w-[5cqw] text-[4.6cqw] leading-none text-(--c-muted)">
              {i + 1}
            </span>
            <span className="min-w-0 truncate text-[3.4cqw]">
              {e.season && <span className="text-(--t-muted)">{e.season} · </span>}
              <span className="font-semibold text-(--t-text)">{e.episode ?? p.series}</span>
            </span>
          </li>
        ))}
      </ol>
      <Headline className="relative mt-auto text-[8.4cqw] leading-[0.95]" delay={1.2}>
        {`${date}: ${p.count} episodes of ${p.series}. ${variant(result.seed, TAGS)}`}
      </Headline>
    </CardBody>
  );
}
