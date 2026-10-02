'use client';
import { useRef } from 'react';
import type { YoutubeSummary } from '@/engine/insights/youtube/summary';
import { fmtHour, fmtInt } from '@/lib/format';
import { Thumbnail } from '../../art/Art';
import { Headline } from '../shared/Headline';
import { CardBody } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

/** An "end screen": four tiles over a dimmed player frame. */
export function WatchSummary({ result }: CardProps<YoutubeSummary>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from('[data-dim]', { opacity: 0, duration: 0.4 }, 0).from(
      '[data-tile]',
      { scale: 0.85, opacity: 0, duration: 0.3, stagger: 0.07 },
      0.25,
    );
  });
  const tiles = [
    { label: 'Videos', value: fmtInt(p.videos), sub: `≈ ${fmtInt(p.hours)} hours` },
    p.topChannel && { label: 'Top channel', value: p.topChannel, sub: 'Most watched' },
    p.rabbitHole && {
      label: 'Rabbit hole',
      value: `${p.rabbitHole.videos} videos`,
      sub: `≈ ${Math.round(p.rabbitHole.minutes / 6) / 10} hours in a row`,
    },
    p.peakHour !== null && {
      label: 'Peak hour',
      value: fmtHour(p.peakHour),
      sub: 'Your prime time',
    },
  ].filter(Boolean) as Array<{ label: string; value: string; sub: string }>;
  return (
    <CardBody ref={ref}>
      <Headline as="h2" className="text-[11cqw] leading-[0.95]">
        That’s a wrap on your year of watching.
      </Headline>
      <div className="relative mt-[6cqw] flex-1 overflow-hidden rounded-(--t-radius-frame)">
        <Thumbnail
          name="Your year on YouTube"
          progress={1}
          initials={false}
          cover
          className="absolute inset-0 size-full"
        />
        <div data-dim aria-hidden className="absolute inset-0 bg-(--t-bg)/75" />
        <dl className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2.4cqw] p-[3cqw]">
          {tiles.map((t) => (
            <div
              key={t.label}
              data-tile
              className="flex flex-col justify-end overflow-hidden rounded-(--t-radius-tile) bg-(--t-surface) p-[3.4cqw]"
            >
              <dt className="text-[3cqw] font-semibold tracking-wide text-(--t-muted) uppercase">
                {t.label}
              </dt>
              <dd className="t-display mt-[1cqw] line-clamp-2 text-[7cqw] leading-[1] text-(--t-text)">
                {t.value}
              </dd>
              <dd className="mt-[1cqw] text-[3.2cqw] text-(--t-muted)">{t.sub}</dd>
            </div>
          ))}
        </dl>
      </div>
    </CardBody>
  );
}
