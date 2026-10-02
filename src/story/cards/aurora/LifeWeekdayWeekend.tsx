'use client';
import { useRef } from 'react';
import type { LifeWeekdayWeekend as Props } from '@/engine/insights/life/weekdayWeekend';
import type { Platform } from '@/engine/insights/life/shared';
import { fmt1, fmtPct } from '@/lib/format';
import { PLATFORM_NAME, PlatformTag, platformColor } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

const ORDER: Platform[] = ['spotify', 'youtube', 'netflix'];

function SplitBar({ label, side, max }: { label: string; side: Props['weekday']; max: number }) {
  const width = (side.perDay / Math.max(0.1, max)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[4.4cqw]">
        <span className="font-bold">{label}</span>
        <span className="text-(--c-muted) tabular-nums">{fmt1(side.perDay)} h a day</span>
      </div>
      <div
        className="mt-[2cqw] flex h-[7cqw] overflow-hidden rounded-(--t-radius-pill)"
        style={{ width: `${width}%` }}
      >
        {ORDER.filter((p) => side.shares[p] > 0).map((p) => (
          <span
            key={p}
            data-bar
            className="h-full origin-left"
            title={`${PLATFORM_NAME[p]} ${fmtPct(side.shares[p])}`}
            style={{ width: `${side.shares[p] * 100}%`, background: platformColor(p) }}
          />
        ))}
      </div>
      <p className="mt-[1.6cqw] text-[3.4cqw] text-(--c-muted)">
        {ORDER.filter((p) => side.shares[p] > 0)
          .map((p) => `${PLATFORM_NAME[p]} ${fmtPct(side.shares[p])}`)
          .join(' · ')}
      </p>
    </div>
  );
}

export function LifeWeekdayWeekend({ result }: CardProps<Props>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(p.weekday.perDay, p.weekend.perDay);
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    tl.from('[data-bar]', { scaleX: 0, duration: 1.2, stagger: 0.12 }, 0.3);
  });
  return (
    <CardBody ref={ref}>
      <AuroraSky />
      <Eyebrow className="relative">Weekday vs weekend</Eyebrow>
      <Headline className="relative mt-[2cqw] text-[11.5cqw] leading-[0.95]">
        {`Weekends belong to ${PLATFORM_NAME[p.weekendWinner]}, apparently.`}
      </Headline>
      <div className="relative mt-auto flex flex-col gap-[8cqw]">
        <SplitBar label="Weekdays" side={p.weekday} max={max} />
        <SplitBar label="Weekends" side={p.weekend} max={max} />
        <div className="flex flex-wrap gap-x-[5cqw] gap-y-[2cqw] text-[4cqw]">
          {ORDER.filter((pl) => p.weekday.shares[pl] + p.weekend.shares[pl] > 0).map((pl) => (
            <PlatformTag key={pl} platform={pl} />
          ))}
        </div>
      </div>
    </CardBody>
  );
}
