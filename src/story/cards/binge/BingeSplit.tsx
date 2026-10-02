'use client';
import { useRef } from 'react';
import type { NetflixSplit } from '@/engine/insights/netflix/split';
import { fmt1, fmtPct } from '@/lib/format';
import { Poster } from '../../art/Art';
import { RankBars } from '../../charts/RankBars';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers } from './Cinema';

export function BingeSplit({ result }: CardProps<NetflixSplit>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-rank-bar]',
      { scaleX: 0, duration: 1.2, ease: 'expo.out', stagger: 0.2 },
      0.3,
    ).from('[data-movie]', { opacity: 0, x: '8cqw', duration: 1, ease: 'expo.out' }, 0.8);
  });
  const series = p.seriesShare >= 0.5;
  const line = series
    ? `You’re a series person: ${fmtPct(p.seriesShare)} episodes.`
    : `You’re a movie person: ${fmtPct(1 - p.seriesShare)} films.`;
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Movies vs series</Eyebrow>
      <Headline className="relative mt-[2cqw] text-[13cqw] leading-[0.9]">{line}</Headline>
      <RankBars
        className="relative mt-[10cqw]"
        rows={[
          {
            label: 'Series',
            share: p.seriesShare,
            value: `${fmtPct(p.seriesShare)} · ${fmt1(p.seriesHours)} h`,
          },
          {
            label: 'Movies',
            share: 1 - p.seriesShare,
            value: `${fmtPct(1 - p.seriesShare)} · ${fmt1(p.movieHours)} h`,
            color: 'var(--c-muted)',
          },
        ]}
      />
      {p.topMovie && (
        <div data-movie className="relative mt-auto flex items-center gap-[4cqw]">
          <span className="w-[20cqw] shrink-0 overflow-hidden rounded-(--t-radius-tile)">
            <Poster title={p.topMovie.title} tag="Film" className="block w-full" />
          </span>
          <span>
            <span className="block text-[3.4cqw] font-semibold tracking-[0.14em] text-(--c-muted) uppercase">
              Top movie
            </span>
            <span className="t-display block text-[8cqw] leading-[0.95]">{p.topMovie.title}</span>
            <span className="block text-[3.6cqw] text-(--c-muted)">
              {fmt1(p.topMovie.hours)} hours
            </span>
          </span>
        </div>
      )}
    </CardBody>
  );
}
