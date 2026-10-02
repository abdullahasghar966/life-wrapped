'use client';
import { useRef } from 'react';
import type { NetflixHours } from '@/engine/insights/netflix/hours';
import { fmtInt } from '@/lib/format';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers, RedGlow } from './Cinema';

export function BingeHours({ result }: CardProps<NetflixHours>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const share = Math.min(1, p.days / Math.max(1, p.periodDays));
  useCardAnim(ref, (tl) => {
    tl.from('[data-number]', { scale: 1.15, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.1)
      .from('[data-glow]', { opacity: 0, duration: 1.4 }, 0.2)
      .from(
        '[data-continue]',
        { scaleX: 0, transformOrigin: '0% 50%', duration: 1.4, ease: 'expo.out' },
        0.9,
      );
  });
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <RedGlow className="top-[18%] left-1/2 size-[120cqw] -translate-x-1/2" strength={0.5} />
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Hours watched</Eyebrow>
      <p
        data-number
        className="t-display relative mt-[4cqw] text-[52cqw] leading-[0.8] [text-shadow:0_0_6cqw_var(--c-accent)]"
      >
        <CountUp value={p.hours} duration={1.8} />
      </p>
      <p className="t-display relative text-[11cqw] leading-none">hours</p>
      <div className="relative mt-[10cqw]">
        <p className="text-[3.6cqw] font-semibold tracking-[0.14em] text-(--c-muted) uppercase">
          Continue watching
        </p>
        <div className="mt-[2cqw] h-[1.6cqw] bg-(--c-ink)/25">
          <div
            data-continue
            className="h-full origin-left bg-(--c-accent)"
            style={{ transform: `scaleX(${share})` }}
          />
        </div>
        <p className="mt-[2cqw] text-[3.8cqw] text-(--c-muted)">
          You pressed play on {fmtInt(p.days)} of {fmtInt(p.periodDays)} days · {fmtInt(p.titles)}{' '}
          titles
        </p>
      </div>
      <Headline className="relative mt-auto text-[12cqw] leading-[0.9]" delay={1}>
        {`${fmtInt(p.hours)} hours. About ${fmtInt(p.movieEquivalents)} movies’ worth.`}
      </Headline>
    </CardBody>
  );
}
