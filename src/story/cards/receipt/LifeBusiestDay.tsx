'use client';
import { useRef } from 'react';
import type { LifeBusiestDay as LifeBusiestDayProps } from '@/engine/insights/life/busiestDay';
import type { Platform } from '@/engine/insights/life/shared';
import { fmt1, fmtDayMonth, fmtWeekday } from '@/lib/format';
import { DayTimeline } from '../../charts/DayTimeline';
import { PlatformTag } from '../../charts/platform';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { InfoTip } from '../shared/InfoTip';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { ESTIMATE_NOTE } from '../watch/WatchTotal';
import { Line } from './parts';

/** The biggest day: its total, its timeline and the bill per app. */
export function LifeBusiestDay({ result }: CardProps<LifeBusiestDayProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const platforms = (Object.entries(p.hoursByPlatform) as Array<[Platform, number]>)
    .filter(([, h]) => h > 0)
    .map(([k]) => k);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-segment]',
      { scaleX: 0, transformOrigin: '0% 50%', duration: 0.8, stagger: 0.04, ease: 'steps(10)' },
      0.5,
    ).from('[data-line]', { opacity: 0, duration: 0.01, stagger: 0.12 }, 1.2);
  });
  const day = fmtDayMonth(p.date);
  return (
    <CardBody ref={ref}>
      <Eyebrow className="font-mono font-medium">Busiest day · {fmtWeekday(p.date)}</Eyebrow>
      <Headline className="mt-[2cqw] text-[15cqw] leading-[0.86] text-balance">
        {`${day} was a lot.`}
      </Headline>
      <p className="t-display mt-[4cqw] flex items-center gap-[3cqw] text-[24cqw] leading-[0.8] text-(--c-accent)">
        <span>
          {p.estimated && <span aria-hidden>≈</span>}
          {p.estimated && <span className="sr-only">About </span>}
          <CountUp value={p.hours} format={(n) => fmt1(n)} />
        </span>
        {p.estimated && (
          <InfoTip label="Why this is an estimate">{`Includes YouTube. ${ESTIMATE_NOTE}`}</InfoTip>
        )}
      </p>
      <p className="mt-[1cqw] font-mono text-[3.6cqw] uppercase">hours of everything</p>
      <div className="mt-auto">
        <DayTimeline
          segments={p.segments}
          platforms={platforms}
          className="w-full"
          label={`Your activity on ${day}, by platform, from midnight to midnight.`}
        />
        <div className="mt-[3cqw] font-mono text-[3.8cqw] leading-[2.1]">
          {(Object.entries(p.hoursByPlatform) as Array<[Platform, number]>)
            .filter(([, h]) => h > 0)
            .map(([pl, h]) => (
              <Line
                key={pl}
                label={<PlatformTag platform={pl} className="normal-case" />}
                value={`${pl === 'youtube' ? '≈ ' : ''}${fmt1(h)} h`}
              />
            ))}
        </div>
      </div>
    </CardBody>
  );
}
