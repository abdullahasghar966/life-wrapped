'use client';
import { useRef } from 'react';
import type { LifeTotal as LifeTotalProps } from '@/engine/insights/life/total';
import type { Platform } from '@/engine/insights/life/shared';
import { fmtInt } from '@/lib/format';
import { PlatformTag } from '../../charts/platform';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { InfoTip } from '../shared/InfoTip';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import { ESTIMATE_NOTE } from '../watch/WatchTotal';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

export function LifeTotal({ result }: CardProps<LifeTotalProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    tl.from('[data-big]', { opacity: 0, y: '6cqw', duration: 1.2 }, 0.1).from(
      '[data-row]',
      { opacity: 0, x: '-6cqw', duration: 0.9, stagger: 0.15 },
      0.8,
    );
  });
  const rows = (Object.entries(p.hoursByPlatform) as Array<[Platform, number]>).filter(
    ([, h]) => h > 0,
  );
  const about = p.estimated ? '≈ ' : '';
  return (
    <CardBody ref={ref}>
      <AuroraSky />
      <Eyebrow className="relative">All your screen and headphone time</Eyebrow>
      <p
        data-big
        className="t-display relative mt-[6cqw] flex items-center gap-[3cqw] text-[26cqw] leading-[0.85]"
      >
        <span>
          {p.estimated && (
            <span aria-hidden className="text-gradient">
              ≈
            </span>
          )}
          {p.estimated && <span className="sr-only">About </span>}
          <CountUp value={p.hours} visualClassName="text-gradient" />
        </span>
        {p.estimated && (
          <InfoTip label="Why this is an estimate">{`Includes YouTube. ${ESTIMATE_NOTE}`}</InfoTip>
        )}
      </p>
      <p className="t-display relative text-[10cqw] leading-none">hours</p>
      <ul className="relative mt-[10cqw] flex flex-col gap-[3cqw] text-[4.4cqw]">
        {rows.map(([platform, hours]) => (
          <li key={platform} data-row className="flex items-center justify-between">
            <PlatformTag platform={platform} />
            <span className="font-semibold tabular-nums">
              {platform === 'youtube' ? '≈ ' : ''}
              {fmtInt(hours)} h
            </span>
          </li>
        ))}
      </ul>
      <Headline className="relative mt-auto text-[10cqw] leading-[0.98]" delay={1}>
        {`${about}${fmtInt(p.hours)} hours. That’s ${fmtInt(p.days)} days.`}
      </Headline>
    </CardBody>
  );
}
