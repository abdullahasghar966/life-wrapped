'use client';
import { useRef } from 'react';
import type { NetflixLateNight } from '@/engine/insights/netflix/lateNight';
import { fmtClock, fmtDayMonth, fmtPct } from '@/lib/format';
import { variant } from '../../runtime';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers, RedGlow } from './Cinema';

const TAGS = [
  'One more episode.',
  'Tomorrow is a problem for tomorrow.',
  'Just to see how it ends.',
];

export function BingeLateNight({ result }: CardProps<NetflixLateNight>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const time = fmtClock(p.latestMinute);
  useCardAnim(ref, (tl) => {
    tl.from('[data-moon]', { opacity: 0, scale: 0.8, duration: 1.6, ease: 'expo.out' }, 0)
      .from('[data-glow]', { opacity: 0, duration: 1.4 }, 0.2)
      // A TV-light flicker on the timestamp, then it holds steady.
      .fromTo(
        '[data-time]',
        { opacity: 0.2 },
        { opacity: 1, duration: 0.08, repeat: 7, yoyo: true, ease: 'none' },
        0.6,
      )
      .set('[data-time]', { opacity: 1 });
  });
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <RedGlow className="top-[40%] -left-[20%] size-[120cqw]" strength={0.4} />
        <div
          data-moon
          className="absolute top-[21%] right-[9cqw] size-[24cqw] rounded-full bg-(--c-ink) opacity-90 shadow-[0_0_14cqw_2cqw_color-mix(in_srgb,var(--c-ink)_25%,transparent)]"
        >
          <div className="absolute top-[-10%] right-[-16%] size-[24cqw] rounded-full bg-(--c-bg)" />
        </div>
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Latest night · {fmtDayMonth(p.date)}</Eyebrow>
      <p
        data-time
        className="t-display relative mt-[30cqw] text-[30cqw] leading-[0.82] [text-shadow:0_0_5cqw_var(--c-accent)]"
      >
        {time}
      </p>
      <p className="relative mt-[4cqw] text-[4.4cqw]">
        You pressed play on <span className="font-bold">{p.title}</span>.
      </p>
      <p className="relative mt-[2cqw] text-[4cqw] text-(--c-muted)">
        {fmtPct(p.nightShare)} of your viewing happened after midnight.
      </p>
      <Headline className="relative mt-auto text-[9.6cqw] leading-[0.95]" delay={1}>
        {`Latest night: ${time}. ${variant(result.seed, TAGS)}`}
      </Headline>
    </CardBody>
  );
}
