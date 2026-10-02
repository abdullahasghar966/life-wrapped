'use client';
import { useRef } from 'react';
import type { SpotifyTopArtists } from '@/engine/insights/spotify/topArtists';
import { fmtInt } from '@/lib/format';
import { Cover } from '../../art/Art';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

export function SoundTopArtists({ result }: CardProps<SpotifyTopArtists>) {
  const { artists } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-row]',
      { x: '70cqw', duration: 0.6, ease: 'back.out(1.5)', stagger: 0.11 },
      0.3,
    ).from('[data-rank]', { scale: 0, duration: 0.5, ease: 'back.out(3)', stagger: 0.11 }, 0.45);
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Top artists</Eyebrow>
      <Headline className="mt-[2cqw] text-[11cqw] leading-[0.95]">Your top 5. No skips.</Headline>
      <ol className="mt-[6cqw] flex flex-1 flex-col justify-between">
        {artists.map((a, i) => (
          <li key={a.name} data-row className="flex items-center gap-[3.5cqw]">
            <span
              data-rank
              aria-hidden
              className="t-display w-[15cqw] shrink-0 text-center text-[14cqw] leading-none tabular-nums"
            >
              {i + 1}
            </span>
            <Cover name={a.name} className="size-[15cqw] shrink-0 rounded-(--t-radius-tile)" />
            <span className="min-w-0">
              <span className="block truncate text-[5.6cqw] leading-tight font-extrabold">
                <span className="sr-only">Number {i + 1}: </span>
                {a.name}
              </span>
              <span className="block text-[3.6cqw] font-semibold text-(--c-muted)">
                {fmtInt(a.minutes)} minutes
              </span>
            </span>
          </li>
        ))}
      </ol>
    </CardBody>
  );
}
