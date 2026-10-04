'use client';
import { useRef } from 'react';
import type { Platform } from '@/engine/insights/life/shared';
import type { LifeWeekdayWeekend as Props } from '@/engine/insights/life/weekdayWeekend';
import { fmt1, fmtPct } from '@/lib/format';
import { PLATFORM_NAME, PlatformTag, platformColor } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const ORDER: Platform[] = ['spotify', 'youtube', 'netflix'];

function SplitBar({ label, side, max }: { label: string; side: Props['weekday']; max: number }) {
  const width = (side.perDay / Math.max(0.1, max)) * 100;
  const shown = ORDER.filter((p) => side.shares[p] > 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="t-display text-[9cqw] leading-none">{label}</span>
        <span className="font-mono text-[3.6cqw] uppercase tabular-nums">
          {fmt1(side.perDay)} h a day
        </span>
      </div>
      <div className="mt-[2cqw] flex h-[8cqw]" style={{ width: `${width}%` }}>
        {shown.map((p) => (
          <span
            key={p}
            data-bar
            className="h-full origin-left border-r-[0.7cqw] border-(--c-bg) last:border-r-0"
            title={`${PLATFORM_NAME[p]} ${fmtPct(side.shares[p])}`}
            style={{ width: `${side.shares[p] * 100}%`, background: platformColor(p) }}
          />
        ))}
      </div>
      <p className="mt-[1.6cqw] font-mono text-[3.2cqw] text-(--c-muted) uppercase">
        {shown.map((p) => `${PLATFORM_NAME[p]} ${fmtPct(side.shares[p])}`).join(' · ')}
      </p>
    </div>
  );
}

/** Weekdays against weekends: two bars on ink, scaled to time per day. */
export function LifeWeekdayWeekend({ result }: CardProps<Props>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(p.weekday.perDay, p.weekend.perDay);
  useCardAnim(ref, (tl) => {
    tl.from('[data-bar]', { scaleX: 0, duration: 0.6, stagger: 0.12, ease: 'steps(10)' }, 0.4);
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow className="font-mono font-medium">Weekday vs weekend</Eyebrow>
      <Headline className="mt-[2cqw] text-[14cqw] leading-[0.86]">
        {`Weekends belong to ${PLATFORM_NAME[p.weekendWinner]}, apparently.`}
      </Headline>
      <div className="mt-auto flex flex-col gap-[7cqw]">
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
