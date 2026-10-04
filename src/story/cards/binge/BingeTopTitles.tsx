'use client';
import { useRef } from 'react';
import type { NetflixTopTitles } from '@/engine/insights/netflix/topTitles';
import { fmt1, fmtInt } from '@/lib/format';
import { Poster } from '../../art/Art';
import { carouselIn } from '../../depth';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers } from './Cinema';

/** The "top 10 row" pattern: giant outlined rank numerals beside posters. */
export function BingeTopTitles({ result }: CardProps<NetflixTopTitles>) {
  const { titles } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-rank]',
      { x: '-8cqw', opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12 },
      0.2,
    );
    carouselIn(tl, '[data-rank-poster]', { at: 0.35 });
  });
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Top titles</Eyebrow>
      <Headline className="relative mt-[2cqw] text-[13cqw] leading-[0.9]">
        Your top 5, ranked.
      </Headline>
      <ol className="relative mt-[4cqw] flex flex-col gap-[2.6cqw]">
        {titles.map((t, i) => (
          <li key={t.title} className="flex items-center">
            <span
              data-rank
              aria-hidden
              className="t-display w-[17cqw] shrink-0 text-right text-[19cqw] leading-[0.8] text-transparent [-webkit-text-stroke:0.6cqw_var(--c-muted)]"
            >
              {i + 1}
            </span>
            <span
              data-rank-poster
              className="-ml-[2.4cqw] w-[11cqw] shrink-0 overflow-hidden rounded-(--t-radius-tile)"
            >
              <Poster
                title={t.title}
                tag={t.isSeries ? 'Series' : 'Film'}
                className="block w-full"
              />
            </span>
            <span className="min-w-0 pl-[4cqw]">
              <span className="block truncate text-[4.6cqw] font-bold">
                <span className="sr-only">Number {i + 1}: </span>
                {t.title}
              </span>
              <span className="block text-[3.6cqw] text-(--c-muted)">
                {fmt1(t.hours)} h{t.isSeries ? ` · ${fmtInt(t.episodes)} episodes` : ' · film'}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </CardBody>
  );
}
