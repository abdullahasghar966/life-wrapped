'use client';
import { useRef } from 'react';
import type { SpotifyOnRepeat } from '@/engine/insights/spotify/onRepeat';
import { fmtDayMonth, fmtShortDayMonth, shorten } from '@/lib/format';
import { Cover } from '../../art/Art';
import { variant } from '../../runtime';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const TAGS = ['We get it.', 'No notes.', 'Understandable.'];

export function SoundOnRepeat({ result }: CardProps<SpotifyOnRepeat>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-date]',
      { scale: 2.4, rotate: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.6)' },
      0.2,
    )
      .from('[data-times]', { scale: 0.2, duration: 0.9, ease: 'elastic.out(1, 0.45)' }, 0.5)
      .from(
        '[data-cover]',
        { y: '20cqw', rotate: 20, opacity: 0, duration: 0.6, ease: 'back.out(2)' },
        0.9,
      );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>On repeat</Eyebrow>
      <div data-date className="mt-[5cqw] self-start">
        <Sticker filled tilt={-8} className="text-[6cqw]">
          {fmtShortDayMonth(p.date).toUpperCase()}
        </Sticker>
      </div>
      <p data-times className="t-display mt-[3cqw] origin-left text-[48cqw] leading-[0.8]">
        <span aria-hidden>×</span>
        <CountUp value={p.plays} delay={0.6} duration={1.2} />
      </p>
      <div className="mt-[4cqw] flex items-center gap-[4cqw]">
        <div data-cover className="size-[20cqw] shrink-0 overflow-hidden rounded-(--t-radius-tile)">
          <Cover name={`${p.track} · ${p.artist}`} className="size-full" />
        </div>
        <p className="min-w-0 text-[5.4cqw] leading-tight font-extrabold">
          <span className="line-clamp-2 break-words">“{p.track}”</span>
          <span className="block truncate text-[4cqw] font-semibold text-(--c-muted)">
            {p.artist}
          </span>
        </p>
      </div>
      <Headline className="mt-auto text-[8cqw] leading-[1]" delay={1.2}>
        {`${fmtDayMonth(p.date)}: “${shorten(p.track, 28)}” ×${p.plays}. ${variant(result.seed, TAGS)}`}
      </Headline>
    </CardBody>
  );
}
