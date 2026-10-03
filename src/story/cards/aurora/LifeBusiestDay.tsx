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
      <Headline className="relative mt-[2cqw] text-[12cqw] leading-[0.95] text-balance">
        {`${day} was a lot.`}
      </Headline>
      <p className="t-display relative mt-[6cqw] flex items-center gap-[3cqw] text-[22cqw] leading-[0.85]">
        <span>
          {p.estimated && <span aria-hidden>≈</span>}
          {p.estimated && <span className="sr-only">About </span>}
          <CountUp value={p.hours} format={(n) => fmt1(n)} />
        </span>
        {p.estimated && (
          <InfoTip label="Why this is an estimate">{`Includes YouTube. ${ESTIMATE_NOTE}`}</InfoTip>
        )}
      </p>
      <p className="t-display relative mt-[2cqw] text-[8cqw] leading-none text-(--c-muted)">
        hours of everything
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
