'use client';
import { useRef } from 'react';
import type { LifeSplit as LifeSplitProps } from '@/engine/insights/life/split';
import type { Platform } from '@/engine/insights/life/shared';
import { fmtInt, fmtPct } from '@/lib/format';
import { Donut } from '../../charts/Donut';
import { PlatformTag } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

const WINNER: Record<Platform, string> = {
  spotify: 'Music got the most of you.',
  youtube: 'YouTube got the most of you.',
  netflix: 'Netflix got the most of you.',
};

export function LifeSplit({ result }: CardProps<LifeSplitProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    tl.from('[data-donut]', { rotate: -120, scale: 0.7, opacity: 0, duration: 1.4 }, 0.1)
      .from('[data-slice-label]', { opacity: 0, duration: 0.6, stagger: 0.15 }, 1)
      .from('[data-row]', { opacity: 0, y: 10, duration: 0.6, stagger: 0.1 }, 1.1);
  });
  return (
    <CardBody ref={ref}>
      <AuroraSky />
      <Eyebrow className="relative">Platform split</Eyebrow>
      <Headline className="relative mt-[2cqw] text-[11cqw] leading-[0.95]">
        {WINNER[p.top]}
      </Headline>
      <div data-donut className="relative mx-auto mt-[4cqw] w-[84cqw]">
        <Donut
          slices={p.platforms.map(({ platform, share }) => ({ platform, share }))}
          className="w-full"
          label={`Share of your time: ${p.platforms.map((x) => `${x.platform} ${fmtPct(x.share)}`).join(', ')}.`}
        />
      </div>
      <ul className="relative mt-auto flex flex-col gap-[2.4cqw] text-[4.2cqw]">
        {p.platforms.map((x) => (
          <li key={x.platform} data-row className="flex items-center justify-between">
            <PlatformTag platform={x.platform} />
            <span className="text-(--c-muted) tabular-nums">
              {fmtPct(x.share)} · {x.platform === 'youtube' ? '≈ ' : ''}
              {fmtInt(x.hours)} h
            </span>
          </li>
        ))}
      </ul>
    </CardBody>
  );
}
