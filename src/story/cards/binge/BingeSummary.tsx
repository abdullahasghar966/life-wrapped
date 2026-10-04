'use client';
import { useRef } from 'react';
import type { NetflixSummary } from '@/engine/insights/netflix/summary';
import { fmtInt } from '@/lib/format';
import { Headline } from '../shared/Headline';
import { CardBody } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import { creditsIn } from '../../depth';
import type { CardProps } from '../types';
import { CinemaLayers, RedGlow } from './Cinema';

/** A movie poster: a big title and a credits-style billing block. */
export function BingeSummary({ result }: CardProps<NetflixSummary>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    creditsIn(tl, '[data-credit]', { at: 0.8 });
  });
  const credits = [
    ['Starring', 'You', false],
    ['Running time', `${fmtInt(p.hours)} hours`, false],
    p.topSeries && ['Featuring', p.topSeries, true],
    p.binge && ['Binge record', `${p.binge.count} episodes in one day`, true],
    ['As', `The ${p.persona}`, true],
  ].filter(Boolean) as Array<[string, string, boolean]>;
  return (
    <CardBody ref={ref} className="items-center text-center">
      <div aria-hidden className="absolute inset-0">
        <RedGlow className="top-[6%] left-1/2 size-[130cqw] -translate-x-1/2" strength={0.5} />
        <CinemaLayers />
      </div>
      <p
        data-credit
        className="relative text-[3.2cqw] font-semibold tracking-[0.3em] text-(--c-muted) uppercase"
      >
        A Life, Wrapped production
      </p>
      <Headline
        as="h2"
        split="lines"
        className="relative mt-[6cqw] text-[21cqw] leading-[0.86]"
        delay={0.1}
      >
        Your year on screen.
      </Headline>
      <dl className="relative mt-auto grid w-full grid-cols-2 gap-x-[4cqw] gap-y-[3cqw]">
        {credits.map(([label, value, wide]) => (
          <div key={label} data-credit className={wide ? 'col-span-2' : undefined}>
            <dt className="text-[2.8cqw] font-semibold tracking-[0.3em] text-(--c-muted) uppercase">
              {label}
            </dt>
            <dd className="t-display text-[6.4cqw] leading-[1]">{value}</dd>
          </div>
        ))}
      </dl>
    </CardBody>
  );
}
