'use client';
import { useRef } from 'react';
import type { SpotifyStreak } from '@/engine/insights/spotify/streak';
import { fmtDate } from '@/lib/format';
import { variant } from '../../runtime';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const TAGS = ['Not one silent day.', 'Every single day.', 'Consistency is a vibe.'];

export function SoundStreak({ result }: CardProps<SpotifyStreak>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const days = Math.min(p.days, 84);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-day]',
      {
        scale: 0.2,
        opacity: 0.15,
        duration: 0.25,
        ease: 'back.out(3)',
        stagger: Math.min(0.03, 1.6 / days),
      },
      0.3,
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Longest streak</Eyebrow>
      <div className="mt-[2cqw] flex items-end gap-[3cqw]">
        <p className="t-display text-[34cqw] leading-[0.8]">
          <CountUp value={p.days} duration={1.8} />
        </p>
        <p className="t-display pb-[3cqw] text-[9cqw] leading-[0.9]">
          days in
          <br />a row
        </p>
      </div>
      <div aria-hidden className="mt-[6cqw] grid grid-cols-12 gap-[1.4cqw]">
        {Array.from({ length: days }, (_, i) => (
          <span key={i} data-day className="aspect-square rounded-[1.4cqw] bg-(--c-ink)" />
        ))}
      </div>
      <Headline className="mt-auto text-[8cqw] leading-[1]" delay={1.4}>
        {`${p.days} days in a row. ${variant(result.seed, TAGS)}`}
      </Headline>
      <div className="mt-[3cqw]">
        <Sticker tilt={-3}>
          {fmtDate(p.start)} → {fmtDate(p.end)}
        </Sticker>
      </div>
    </CardBody>
  );
}
