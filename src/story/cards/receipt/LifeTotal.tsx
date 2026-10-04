'use client';
import { useRef } from 'react';
import type { Platform } from '@/engine/insights/life/shared';
import type { LifeTotal as LifeTotalProps } from '@/engine/insights/life/total';
import { fmtInt } from '@/lib/format';
import { PlatformTag } from '../../charts/platform';
import { CountUp } from '../shared/CountUp';
import { InfoTip } from '../shared/InfoTip';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { ESTIMATE_NOTE } from '../watch/WatchTotal';
import { Line } from './parts';

/** One huge number on ink, a red "that's N days" sticker and the bill per app. */
export function LifeTotal({ result }: CardProps<LifeTotalProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from('[data-big]', { yPercent: 35, opacity: 0, duration: 0.8 }, 0.1)
      .from('[data-tag]', { scale: 0, rotate: 25, duration: 0.5, ease: 'back.out(2)' }, 1)
      .from('[data-line]', { opacity: 0, duration: 0.01, stagger: 0.14 }, 1.3);
  });
  const rows = (Object.entries(p.hoursByPlatform) as Array<[Platform, number]>).filter(
    ([, h]) => h > 0,
  );
  const about = p.estimated ? '≈ ' : '';
  return (
    <CardBody ref={ref}>
      <Eyebrow className="font-mono font-medium">All your screen and headphone time</Eyebrow>
      <p
        data-big
        className="t-display mt-[7cqw] flex items-start gap-[2cqw] text-[30cqw] leading-[0.8]"
      >
        <span>
          {p.estimated && <span aria-hidden>≈</span>}
          {p.estimated && <span className="sr-only">About </span>}
          <CountUp value={p.hours} />
        </span>
        {p.estimated && (
          <InfoTip label="Why this is an estimate">{`Includes YouTube. ${ESTIMATE_NOTE}`}</InfoTip>
        )}
      </p>
      <p className="t-display text-[12cqw] leading-none">Hours online</p>
      <p
        data-tag
        style={{ rotate: '-5deg' }}
        className="t-display mt-[6cqw] self-start bg-(--c-accent) px-[3.6cqw] pt-[1.6cqw] pb-[1cqw] text-[9cqw] leading-none text-(--t-on-accent)"
      >
        That’s {about}
        {fmtInt(p.days)} days
      </p>
      <div className="mt-auto font-mono text-[4cqw] leading-[2.1]">
        {rows.map(([platform, hours]) => (
          <Line
            key={platform}
            label={<PlatformTag platform={platform} className="normal-case" />}
            value={`${platform === 'youtube' ? '≈ ' : ''}${fmtInt(hours)} h`}
          />
        ))}
      </div>
    </CardBody>
  );
}
