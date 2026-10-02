'use client';
import { useMemo, useRef } from 'react';
import type { SpotifyPodcasts } from '@/engine/insights/spotify/podcasts';
import { fmtInt } from '@/lib/format';
import { Cover } from '../../art/Art';
import { nameRandom } from '../../art/generatedArt';
import { gsap } from '../../gsap';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

export function SoundPodcasts({ result }: CardProps<SpotifyPodcasts>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const bars = useMemo(() => {
    const r = nameRandom(p.show);
    return Array.from({ length: 48 }, () => 0.35 + r() * 0.65);
  }, [p.show]);
  useCardAnim(ref, (tl, { loop }) => {
    tl.from(
      '[data-wave]',
      {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 0.4,
        stagger: 0.015,
        ease: 'back.out(2)',
      },
      0.2,
    ).from('[data-cover]', { scale: 0, rotate: -20, duration: 0.7, ease: 'back.out(1.8)' }, 0.3);
    loop(gsap.to('[data-ring]', { rotate: 360, duration: 24, ease: 'none', repeat: -1 }));
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Podcasts</Eyebrow>
      <div className="relative mx-auto mt-[6cqw] aspect-square w-[78cqw]">
        <svg data-ring viewBox="0 0 200 200" aria-hidden className="absolute inset-0 size-full">
          {bars.map((b, i) => (
            <g key={i} transform={`rotate(${(i / bars.length) * 360} 100 100)`}>
              <rect
                data-wave
                x="97.5"
                y={22 - b * 20}
                width="5"
                height={b * 20}
                rx="2.5"
                fill="var(--c-accent)"
              />
            </g>
          ))}
        </svg>
        <div data-cover className="absolute inset-[24%] overflow-hidden rounded-(--t-radius-frame)">
          <Cover name={p.show} className="size-full" />
        </div>
      </div>
      <Headline className="mt-[6cqw] text-[9.5cqw] leading-[0.98]" delay={0.6}>
        {`Your favourite voice: ${p.show}.`}
      </Headline>
      <div className="mt-auto flex flex-wrap gap-[2.5cqw]">
        <Sticker filled tilt={-4}>
          {fmtInt(p.showMinutes)} min
        </Sticker>
        <Sticker tilt={3}>{fmtInt(p.episodes)} episodes</Sticker>
        {p.shows > 1 && (
          <Sticker tilt={-2}>{fmtInt(p.totalMinutes)} min of podcasts in all</Sticker>
        )}
      </div>
    </CardBody>
  );
}
