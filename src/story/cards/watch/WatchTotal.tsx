'use client';
import { useRef } from 'react';
import type { YoutubeTotal } from '@/engine/insights/youtube/total';
import { fmtInt } from '@/lib/format';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { InfoTip } from '../shared/InfoTip';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

export const ESTIMATE_NOTE =
  "YouTube doesn't include watch time in its exports, so we estimate it from the gaps between videos.";

export function WatchTotal({ result }: CardProps<YoutubeTotal>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from('[data-stat]', { y: '10cqw', opacity: 0, duration: 0.35, stagger: 0.08 }, 0.1).from(
      '[data-meta]',
      { opacity: 0, duration: 0.3 },
      0.6,
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Your year in videos</Eyebrow>
      <div className="mt-[6cqw] flex flex-col gap-[3cqw]">
        <p data-stat className="t-display text-[27cqw] leading-[0.85]">
          <CountUp value={p.videos} />
        </p>
        <p data-stat className="t-display text-[9cqw] leading-none text-(--c-muted)">
          videos
        </p>
        <p
          data-stat
          className="t-display mt-[4cqw] flex items-center gap-[3cqw] text-[18cqw] leading-[0.85]"
        >
          <span>
            <span aria-hidden>≈ </span>
            <span className="sr-only">About </span>
            <CountUp value={p.hours} />
          </span>
          <InfoTip label="How we estimate watch time">{ESTIMATE_NOTE}</InfoTip>
        </p>
        <p data-stat className="t-display text-[9cqw] leading-none text-(--c-muted)">
          hours
        </p>
      </div>
      <p
        data-meta
        className="mt-[7cqw] text-[4.2cqw] text-(--c-muted)"
        aria-label={`${fmtInt(p.videos)} videos, about ${fmtInt(p.hours)} hours, on ${fmtInt(p.activeDays)} days`}
      >
        {fmtInt(p.videos)} videos • ≈ {fmtInt(p.hours)} hr • {fmtInt(p.activeDays)} days
      </p>
      <Headline className="mt-auto text-[8cqw] leading-[1]" delay={0.6}>
        {`${fmtInt(p.videos)} videos. About ${fmtInt(p.hours)} hours.`}
      </Headline>
    </CardBody>
  );
}
