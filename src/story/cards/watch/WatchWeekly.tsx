'use client';
import { useRef } from 'react';
import { DAY_NAMES, type YoutubeWeekly } from '@/engine/insights/youtube/weekly';
import { fmtHour } from '@/lib/format';
import { Heatmap } from '../../charts/Heatmap';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

export function WatchWeekly({ result }: CardProps<YoutubeWeekly>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    // Columns cascade in, one weekday after another.
    tl.from(
      '[data-cell]',
      { opacity: 0, duration: 0.2, stagger: { each: 0.003, from: 'start' } },
      0.2,
    );
  });
  const prime = `${DAY_NAMES[p.peakDow]} at ${fmtHour(p.peakHour)}`;
  return (
    <CardBody ref={ref}>
      <Eyebrow>Weekly rhythm</Eyebrow>
      <Headline className="mt-[2cqw] text-[10cqw] leading-[0.95]">{`${prime}: your prime time.`}</Headline>
      <div className="mt-[5cqw]">
        <Heatmap
          grid={p.grid}
          peakDow={p.peakDow}
          peakHour={p.peakHour}
          className="w-full"
          label={`Videos watched by day of week and hour. Busiest: ${prime}.`}
        />
      </div>
      <p className="mt-[3cqw] text-[3.6cqw] text-(--c-muted)">
        One tile per hour of each weekday. Brighter means more videos.
      </p>
    </CardBody>
  );
}
