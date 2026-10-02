'use client';
import { useRef } from 'react';
import type { ArchetypeId, LifePersonality as Props } from '@/engine/insights/life/personality';
import { ARCHETYPE_LABEL } from '@/engine/insights/life/personality';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

/** A simple, generic emblem for each archetype. */
const EMBLEM: Record<ArchetypeId, string> = {
  nightOwl: 'M30 10a14 14 0 1 0 10 24 12 12 0 0 1-10-24Z',
  bingeMaster: 'M10 14h30v20H10Z M18 34l-4 6 M32 34l4 6 M10 20h30',
  rabbitHoleDiver: 'M25 8a17 17 0 1 0 0.01 0 M25 16a9 9 0 1 0 0.01 0 M25 23a2 2 0 1 0 0.01 0',
  explorer: 'M25 8 32 25 25 42 18 25Z M8 25h34',
  loyalist: 'M25 40 10 26a8 8 0 0 1 15-9 8 8 0 0 1 15 9Z',
  soundtrackLife:
    'M18 36V12l18-4v24 M18 36a4 4 0 1 1-4-4 4 4 0 0 1 4 4Z M36 32a4 4 0 1 1-4-4 4 4 0 0 1 4 4Z',
};

export function LifePersonality({ result }: CardProps<Props>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const best = Math.max(...p.why.map((w) => w.score), 1);
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    tl.from(
      '[data-badge]',
      { scale: 0.4, rotate: -30, opacity: 0, duration: 1.4, ease: 'back.out(1.4)' },
      0.2,
    )
      .from('[data-why]', { opacity: 0, y: 14, duration: 0.8, stagger: 0.2 }, 1.2)
      .from(
        '[data-score]',
        { scaleX: 0, transformOrigin: '0% 50%', duration: 1, stagger: 0.2 },
        1.4,
      );
  });
  const top = p.why[0];
  return (
    <CardBody ref={ref}>
      <AuroraSky intensity={0.4} />
      <Eyebrow className="relative">Your media personality</Eyebrow>
      <div
        data-badge
        className="relative mx-auto mt-[5cqw] flex size-[38cqw] shrink-0 items-center justify-center rounded-full bg-[image:var(--t-gradient)] p-[1.2cqw]"
      >
        <div className="flex size-full flex-col items-center justify-center rounded-full bg-(--c-bg) text-center">
          <svg viewBox="0 0 50 50" aria-hidden className="size-[13cqw] text-(--c-accent)">
            <path
              d={EMBLEM[p.archetype]}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <span className="t-display mt-[1cqw] px-[3cqw] text-[5.2cqw] leading-[1]">{p.label}</span>
        </div>
      </div>
      <Headline className="relative mt-[5cqw] text-[8.4cqw] leading-[0.98]" delay={0.8}>
        {`You’re ${p.label}: ${top?.reason ?? ''}.`}
      </Headline>
      <p className="relative mt-[5cqw] text-[3.4cqw] font-semibold tracking-[0.12em] text-(--c-muted) uppercase">
        What decided it
      </p>
      <ol className="relative mt-[2cqw] flex flex-col gap-[2.6cqw]">
        {p.why.map((w, i) => (
          <li key={w.id} data-why>
            <div className="flex items-baseline justify-between gap-[3cqw] text-[3.6cqw]">
              <span className="font-bold">
                {i + 1}. {ARCHETYPE_LABEL[w.id]}
              </span>
              <span className="text-(--c-muted) tabular-nums">
                {w.score.toFixed(1)}× its threshold
              </span>
            </div>
            <p className="text-[3.2cqw] text-(--c-muted)">{w.reason}</p>
            <div className="relative mt-[1cqw] h-[1.4cqw] overflow-hidden rounded-full bg-(--c-ink)/15">
              <div
                data-score
                className="h-full rounded-full bg-[image:var(--t-gradient)]"
                style={{ width: `${Math.min(100, (w.score / best) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </CardBody>
  );
}
