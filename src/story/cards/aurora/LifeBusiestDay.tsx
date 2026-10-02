'use client';
import { useRef } from 'react';
import type { LifeBusiestDay as LifeBusiestDayProps } from '@/engine/insights/life/busiestDay';
import type { Platform } from '@/engine/insights/life/shared';
import { fmt1, fmtDayMonth, fmtWeekday } from '@/lib/format';
import { DayTimeline } from '../../charts/DayTimeline';
import { PlatformTag } from '../../charts/platform';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

export function LifeBusiestDay({ result }: CardProps<LifeBusiestDayProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const platforms = (Object.entries(p.hoursByPlatform) as Array<[Platform, number]>)
    .filter(([, h]) => h > 0)
    .map(([k]) => k);
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    tl.from(
      '[data-segment]',
      { scaleX: 0, transformOrigin: '0% 50%', duration: 0.9, stagger: 0.04 },
      0.4,
    ).from('[data-row]', { opacity: 0, duration: 0.6, stagger: 0.1 }, 1);
  });
  const day = fmtDayMonth(p.date);
  return (
    <CardBody ref={ref}>
      <AuroraSky />
      <Eyebrow className="relative">Busiest day · {fmtWeekday(p.date)}</Eyebrow>
      <Headline className="relative mt-[2cqw] text-[11cqw] leading-[0.95]">
        {`${day} was a lot: ${fmt1(p.hours)} hours of everything.`}
      </Headline>
      <p className="t-display relative mt-[6cqw] text-[22cqw] leading-[0.85]">
        <CountUp value={p.hours} format={(n) => fmt1(n)} />
        <span className="ml-[2cqw] text-[8cqw] text-(--c-muted)">hours</span>
      </p>
      <div className="relative mt-auto">
        <DayTimeline
          segments={p.segments}
          platforms={platforms}
          className="w-full"
          label={`Your activity on ${day}, by platform, from midnight to midnight.`}
        />
        <ul className="mt-[4cqw] flex flex-col gap-[2cqw] text-[4cqw]">
          {(Object.entries(p.hoursByPlatform) as Array<[Platform, number]>)
            .filter(([, h]) => h > 0)
            .map(([pl, h]) => (
              <li key={pl} data-row className="flex items-center justify-between">
                <PlatformTag platform={pl} />
                <span className="text-(--c-muted) tabular-nums">
                  {pl === 'youtube' ? '≈ ' : ''}
                  {fmt1(h)} h
                </span>
              </li>
            ))}
        </ul>
      </div>
    </CardBody>
  );
}
