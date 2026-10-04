'use client';
import { useRef } from 'react';
import type { SpotifyTopArtist } from '@/engine/insights/spotify/topArtist';
import { fmtDate, fmtInt } from '@/lib/format';
import { Cover } from '../../art/Art';
import { gsap } from '../../gsap';
import { variant } from '../../runtime';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const LINES = [
  (a: string) => `You and ${a} had a thing this year.`,
  (a: string) => `${a} was the main character.`,
  (a: string) => `It was always going to be ${a}.`,
];

export function SoundTopArtist({ result }: CardProps<SpotifyTopArtist>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    tl.from(
      '[data-record]',
      {
        x: '-40cqw',
        rotate: -120,
        rotationX: 70,
        transformPerspective: 800,
        duration: 1,
        ease: 'back.out(1.4)',
      },
      0.1,
    )
      .from(
        '[data-cover]',
        {
          scale: 0.5,
          rotationY: -180,
          z: -200,
          transformPerspective: 800,
          opacity: 0,
          duration: 0.9,
          ease: 'back.out(1.6)',
        },
        0.25,
      )
      .from(
        '[data-sticker]',
        { scale: 0, duration: 0.45, ease: 'back.out(2.4)', stagger: 0.15 },
        1.1,
      );
    loop(
      gsap.to('[data-record]', {
        rotate: '+=360',
        duration: 4,
        ease: 'none',
        repeat: -1,
        delay: 1,
      }),
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Your top artist</Eyebrow>
      <div className="relative mx-auto mt-[6cqw] h-[64cqw] w-[78cqw]">
        <div
          data-record
          aria-hidden
          className="absolute top-[4cqw] right-0 size-[56cqw] rounded-full bg-[repeating-radial-gradient(circle,var(--t-bg)_0_1.2cqw,var(--t-surface)_1.2cqw_1.6cqw)]"
        >
          <div className="absolute inset-[38%] rounded-full bg-(--c-accent)" />
          <div className="absolute inset-[48%] rounded-full bg-(--t-bg)" />
        </div>
        <div
          data-cover
          className="absolute top-0 left-0 size-[60cqw] overflow-hidden rounded-(--t-radius-tile) shadow-2xl"
        >
          <Cover name={p.artist} className="size-full" />
        </div>
      </div>
      <p className="t-display mt-[6cqw] text-[11cqw] leading-[0.95]">{p.artist}</p>
      <Headline className="mt-[3cqw] text-[6.4cqw] leading-[1.05] font-extrabold" delay={0.6}>
        {variant(result.seed, LINES)(p.artist)}
      </Headline>
      <div className="mt-auto flex flex-wrap gap-[2.5cqw]">
        <Sticker filled tilt={-5}>
          {fmtInt(p.minutes)} min
        </Sticker>
        <Sticker tilt={3}>{fmtInt(p.plays)} plays</Sticker>
        {p.firstPlay && <Sticker tilt={-2}>since {fmtDate(p.firstPlay)}</Sticker>}
      </div>
    </CardBody>
  );
}
