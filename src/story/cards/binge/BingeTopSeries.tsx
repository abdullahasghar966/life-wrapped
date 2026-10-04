'use client';
import { useRef } from 'react';
import type { NetflixTopSeries } from '@/engine/insights/netflix/topSeries';
import { fmt1, fmtInt, shorten } from '@/lib/format';
import { Poster } from '../../art/Art';
import { gsap } from '../../gsap';
import { variant } from '../../runtime';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers } from './Cinema';

const LINES = [
  (s: string, n: string) => `${s} owned your evenings: ${n} episodes.`,
  (s: string, n: string) => `${s} was appointment viewing: ${n} episodes.`,
  (s: string, n: string) => `${s} had your full attention: ${n} episodes.`,
];

export function BingeTopSeries({ result }: CardProps<NetflixTopSeries>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    tl.from('[data-poster]', { opacity: 0, y: '6cqw', duration: 1.1, ease: 'expo.out' }, 0.1).from(
      '[data-ribbon]',
      { yPercent: -110, duration: 0.8, ease: 'expo.out' },
      0.7,
    );
    // A slow Ken Burns push-in while the card is up.
    loop(gsap.to('[data-kenburns]', { scale: 1.06, duration: 7, ease: 'none' }));
  });
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Your top series</Eyebrow>
      <div
        data-poster
        className="relative mx-auto mt-[5cqw] w-[46cqw] overflow-hidden rounded-(--t-radius-tile) shadow-[0_3cqw_8cqw_color-mix(in_srgb,var(--t-bg)_60%,transparent)]"
      >
        <div data-kenburns>
          <Poster title={p.series} tag="Series" className="block w-full" />
        </div>
        {/* A corner badge, top right, clear of the poster title. */}
        <div
          data-ribbon
          className="absolute top-0 right-[6%] flex w-[13cqw] flex-col items-center bg-(--t-accent) pt-[1.6cqw] pb-[1.2cqw] text-center leading-none font-bold text-(--t-on-accent) uppercase"
        >
          <span className="text-[2.6cqw] tracking-[0.12em]">Top</span>
          <span className="t-display text-[5.6cqw]">Pick</span>
        </div>
      </div>
      <dl className="relative mt-[6cqw] grid grid-cols-3 gap-[2cqw] text-center">
        {[
          ['Hours', fmt1(p.hours)],
          ['Episodes', fmtInt(p.episodes)],
          ['Seasons', p.seasons > 0 ? fmtInt(p.seasons) : '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <dd className="t-display text-[10cqw] leading-none">{value}</dd>
            <dt className="text-[3.2cqw] font-semibold tracking-[0.14em] text-(--c-muted) uppercase">
              {label}
            </dt>
          </div>
        ))}
      </dl>
      <Headline className="relative mt-auto text-[10cqw] leading-[0.92]" delay={0.9}>
        {variant(result.seed, LINES)(shorten(p.series, 28), fmtInt(p.episodes))}
      </Headline>
    </CardBody>
  );
}
