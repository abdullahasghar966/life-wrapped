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

/** The day as a stacked chart on ink, under a three-line verdict. */
export function LifeRhythm({ result }: CardProps<LifeRhythmProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const platforms = (['spotify', 'youtube', 'netflix'] as const).filter((k) =>
    p.hours.some((h) => h[k] > 0),
  );
  useCardAnim(ref, (tl) => {
    tl.fromTo(
      '[data-wipe]',
      { scaleX: 1, transformOrigin: '100% 50%' },
      { scaleX: 0, transformOrigin: '100% 50%', duration: 1.4, ease: 'steps(24)' },
      0.4,
    ).from('[data-legend]', { opacity: 0, duration: 0.01, stagger: 0.12 }, 1.6);
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow className="font-mono font-medium">Daily rhythm</Eyebrow>
      <Headline className="mt-[2cqw] text-[12.5cqw] leading-[0.88]">{rhythmLine(p)}</Headline>
      <div className="mt-auto">
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
        <p className="mt-[3cqw] font-mono text-[3.2cqw] text-(--c-muted)">
          Each part of the day is named after the app that stands out most in it.
        </p>
      </div>
    </CardBody>
  );
}
