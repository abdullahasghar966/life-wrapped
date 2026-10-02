'use client';
import { useRef } from 'react';
import type { NetflixCountries } from '@/engine/insights/netflix/countries';
import { fmt1 } from '@/lib/format';
import { variant } from '../../runtime';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers, RedGlow } from './Cinema';

const TAGS = ['Passport approved.', 'Have remote, will travel.', 'The story followed you.'];

export function BingeCountries({ result }: CardProps<NetflixCountries>) {
  const { countries } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-chip]',
      { y: '6cqw', opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.15 },
      0.3,
    );
  });
  const n = countries.length;
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <RedGlow className="top-[45%] left-1/2 size-[110cqw] -translate-x-1/2" strength={0.35} />
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Around the world</Eyebrow>
      <p className="t-display relative mt-[4cqw] text-[50cqw] leading-[0.8]">{n}</p>
      <p className="t-display relative text-[10cqw] leading-none text-(--c-muted)">countries</p>
      <ul className="relative mt-[8cqw] flex flex-col gap-[3cqw]">
        {countries.slice(0, 5).map((c) => (
          <li
            key={c.code}
            data-chip
            className="flex items-center gap-[4cqw] border-[0.4cqw] border-(--c-muted) px-[4cqw] py-[2.4cqw]"
          >
            <span className="t-display text-[9cqw] leading-none">{c.code}</span>
            <span className="flex-1 text-[4.6cqw] font-semibold">{c.name ?? c.code}</span>
            <span className="text-[3.8cqw] text-(--c-muted)">{fmt1(c.hours)} h</span>
          </li>
        ))}
      </ul>
      <Headline className="relative mt-auto text-[11cqw] leading-[0.92]" delay={0.9}>
        {`Streaming from ${n} countries. ${variant(result.seed, TAGS)}`}
      </Headline>
    </CardBody>
  );
}
