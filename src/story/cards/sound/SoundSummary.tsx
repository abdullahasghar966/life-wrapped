'use client';
import { useRef } from 'react';
import type { SpotifySummary } from '@/engine/insights/spotify/summary';
import { fmtInt } from '@/lib/format';
import { backdropStyle } from '../../themes';
import { useCardRuntime } from '../../runtime';
import { Headline } from '../shared/Headline';
import { CardBody } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import { hingeIn } from '../../depth';
import type { CardProps } from '../types';

/** Bold multi-colour block poster: each block wears one of the theme's duotones. */
export function SoundSummary({ result }: CardProps<SpotifySummary>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useCardRuntime();
  const b = theme.backdrops;
  useCardAnim(ref, (tl) => {
    hingeIn(tl, '[data-block]', { at: 0.3, stagger: 0.1, duration: 0.65 });
  });
  const blocks = [
    p.topArtist && { label: 'Top artist', value: p.topArtist, wide: true, bd: b[0] },
    p.topTrack && { label: 'Top song', value: p.topTrack.track, wide: true, bd: b[1] },
    { label: 'Minutes', value: fmtInt(p.minutes), wide: false, bd: b[2] },
    p.streak && { label: 'Streak', value: `${p.streak} days`, wide: false, bd: b[3] },
    p.persona && { label: 'Listening style', value: p.persona, wide: true, bd: b[4] },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    wide: boolean;
    bd: (typeof b)[number];
  }>;
  return (
    <CardBody ref={ref}>
      <Headline as="h2" split="chars" className="text-[14cqw] leading-[0.9]">
        Your year in sound.
      </Headline>
      <dl className="mt-[4cqw] grid flex-1 grid-cols-2 gap-[2.5cqw]">
        {blocks.map((blk) => (
          <div
            key={blk.label}
            data-block
            style={blk.bd ? backdropStyle(blk.bd) : undefined}
            className={`flex flex-col justify-between rounded-(--t-radius-frame) bg-(--c-bg) px-[4cqw] py-[3.2cqw] text-(--c-ink) ${blk.wide ? 'col-span-2' : ''}`}
          >
            <dt className="text-[3.4cqw] font-bold tracking-[0.1em] text-(--c-muted) uppercase">
              {blk.label}
            </dt>
            <dd className="t-display mt-[2cqw] line-clamp-2 text-[8.5cqw] leading-[0.95]">
              {blk.value}
            </dd>
          </div>
        ))}
      </dl>
    </CardBody>
  );
}
