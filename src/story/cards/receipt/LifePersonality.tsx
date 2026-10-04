'use client';
import { useRef } from 'react';
import type { ArchetypeId, LifePersonality as Props } from '@/engine/insights/life/personality';
import { ARCHETYPE_LABEL } from '@/engine/insights/life/personality';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { Line, Stamp } from './parts';

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

/** One line of character per archetype: copy, not data, so it carries no numbers. */
const TAGLINE: Record<ArchetypeId, string> = {
  nightOwl: 'Most awake when everyone else is asleep.',
  bingeMaster: 'Just one more episode. Every single time.',
  rabbitHoleDiver: 'Came for one video. Stayed for the whole hole.',
  explorer: 'Always on to the next new thing.',
  loyalist: 'Found your favourites. Stuck with them.',
  soundtrackLife: 'Everything you do has a soundtrack.',
};

/** The archetype, stamped onto red, with the three scores that decided it. */
export function LifePersonality({ result }: CardProps<Props>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const best = Math.max(...p.why.map((w) => w.score), 1);
  useCardAnim(ref, (tl) => {
    tl.from('[data-stamp]', { scale: 2.4, opacity: 0, duration: 0.42, ease: 'power4.in' }, 0.3)
      .to('[data-stamp]', { x: '0.6cqw', duration: 0.05, yoyo: true, repeat: 3 }, '>')
      .from('[data-tagline]', { opacity: 0, duration: 0.01 }, 0.95)
      .from('[data-line]', { opacity: 0, duration: 0.01, stagger: 0.1 }, 1.3)
      .from(
        '[data-score]',
        { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, stagger: 0.15, ease: 'steps(8)' },
        1.4,
      );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow className="font-mono font-medium">Your media personality</Eyebrow>
      <div className="mt-[3cqw] flex items-center gap-[5cqw]">
        <div data-stamp style={{ rotate: '-9deg' }} className="w-[36cqw] shrink-0">
          <Stamp ring="CERTIFIED · LIFE, WRAPPED · CERTIFIED · LIFE, WRAPPED · ">
            <svg viewBox="0 0 50 50" aria-hidden className="size-[9cqw]">
              <path
                d={EMBLEM[p.archetype]}
                fill="none"
                stroke="currentColor"
                strokeWidth="3.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </Stamp>
        </div>
        <p data-tagline className="t-display text-[6.4cqw] leading-[0.95] text-balance">
          {TAGLINE[p.archetype]}
        </p>
      </div>
      <Headline className="mt-[4cqw] text-[13cqw] leading-[0.84] text-balance" delay={0.8}>
        {`You’re ${p.label}.`}
      </Headline>
      <p className="mt-auto font-mono text-[3.1cqw] font-medium tracking-[0.12em] text-(--c-muted) uppercase">
        What decided it · × its bar
      </p>
      <ol className="mt-[2cqw] flex flex-col gap-[2.2cqw] font-mono">
        {p.why.map((w, i) => (
          <li key={w.id}>
            <Line
              className="text-[3.6cqw]"
              strong
              label={`${i + 1}. ${ARCHETYPE_LABEL[w.id]}`}
              value={`${w.score.toFixed(1)}×`}
            />
            {/* One line each, so a long series name can't push the list off the card. */}
            <p data-line title={w.reason} className="truncate text-[3.1cqw] text-(--c-muted)">
              {w.reason}
            </p>
            <div className="mt-[0.8cqw] h-[1.4cqw] bg-(--c-ink)/20">
              <div
                data-score
                className="h-full bg-(--c-ink)"
                style={{ width: `${Math.min(100, (w.score / best) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </CardBody>
  );
}
