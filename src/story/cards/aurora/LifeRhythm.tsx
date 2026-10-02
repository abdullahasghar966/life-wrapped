'use client';
import { useRef } from 'react';
import type { LifeRhythm as LifeRhythmProps } from '@/engine/insights/life/rhythm';
import type { Platform } from '@/engine/insights/life/shared';
import { PlatformTag } from '../../charts/platform';
import { StackedArea } from '../../charts/StackedArea';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

const NOUN: Record<Platform, string> = { spotify: 'music', youtube: 'YouTube', netflix: 'Netflix' };

/** "Mornings: music. Nights: YouTube. Weekends: Netflix." built from the data. */
export function rhythmLine(p: LifeRhythmProps): string {
  const parts = [
    p.dayparts.morning && `Mornings: ${NOUN[p.dayparts.morning]}.`,
    p.dayparts.night && `Nights: ${NOUN[p.dayparts.night]}.`,
    p.weekends && `Weekends: ${NOUN[p.weekends]}.`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Your day, hour by hour.';
}

export function LifeRhythm({ result }: CardProps<LifeRhythmProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const platforms = (['spotify', 'youtube', 'netflix'] as const).filter((k) =>
    p.hours.some((h) => h[k] > 0),
  );
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    tl.fromTo(
      '[data-wipe]',
      { scaleX: 1, transformOrigin: '100% 50%' },
      { scaleX: 0, transformOrigin: '100% 50%', duration: 1.8, ease: 'sine.inOut' },
      0.3,
    ).from('[data-legend]', { opacity: 0, duration: 0.8, stagger: 0.12 }, 1.2);
  });
  return (
    <CardBody ref={ref}>
      <AuroraSky />
      <Eyebrow className="relative">Daily rhythm</Eyebrow>
      <Headline className="relative mt-[2cqw] text-[10.5cqw] leading-[0.98]">
        {rhythmLine(p)}
      </Headline>
      <div className="relative mt-auto">
        <StackedArea
          hours={p.hours}
          platforms={platforms}
          className="w-full"
          label="Hours of activity by hour of the day, stacked by platform."
        />
        <ul className="mt-[4cqw] flex flex-wrap gap-x-[5cqw] gap-y-[2cqw] text-[4cqw]">
          {platforms.map((pl) => (
            <li key={pl} data-legend>
              <PlatformTag platform={pl} />
            </li>
          ))}
        </ul>
        <p className="mt-[3cqw] text-[3.4cqw] text-(--c-muted)">
          Each part of the day is named after the platform that stands out most in it.
        </p>
      </div>
    </CardBody>
  );
}
