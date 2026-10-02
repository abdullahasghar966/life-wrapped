'use client';
import { useRef } from 'react';
import type { SpotifyMinutes } from '@/engine/insights/spotify/minutes';
import { fmtInt } from '@/lib/format';
import { variant } from '../../runtime';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const LINES = [
  'Your ears worked overtime.',
  'Your soundtrack never really stopped.',
  'That’s a lot of headphone time.',
];

export function SoundMinutes({ result }: CardProps<SpotifyMinutes>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-echo]',
      { xPercent: (i) => (i % 2 ? 40 : -40), opacity: 0, duration: 0.9, stagger: 0.12 },
      0,
    )
      .from('[data-eyebrow]', { y: 20, opacity: 0, duration: 0.4 }, 0.2)
      .from('[data-sticker]', { scale: 0, rotate: 25, duration: 0.5, ease: 'back.out(2.2)' }, 1.6);
  });
  const digits = fmtInt(p.minutes);
  return (
    <CardBody ref={ref} className="justify-center">
      <Eyebrow>Minutes listened</Eyebrow>
      <div aria-hidden className="mt-[2cqw] leading-[0.82]">
        {[0, 1].map((i) => (
          <p
            key={i}
            data-echo
            className="t-display text-[23cqw] whitespace-nowrap text-transparent [-webkit-text-stroke:0.5cqw_var(--c-ink)]"
          >
            {digits}
          </p>
        ))}
      </div>
      <p className="t-display text-[23cqw] leading-[0.85] whitespace-nowrap">
        <CountUp value={p.minutes} />
      </p>
      <p className="t-display mt-[1cqw] text-[9cqw]">minutes.</p>
      <Headline className="mt-[6cqw] text-[8cqw] leading-[1]" delay={1}>
        {variant(result.seed, LINES)}
      </Headline>
      <div className="mt-[6cqw] flex flex-wrap gap-[3cqw]">
        <Sticker tilt={-5}>≈ {fmtInt(p.perActiveDay)} min a day</Sticker>
        {p.podcastMinutes > 0 && (
          <Sticker tilt={4} filled>
            + {fmtInt(p.podcastMinutes)} podcast min
          </Sticker>
        )}
      </div>
    </CardBody>
  );
}
