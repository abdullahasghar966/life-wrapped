'use client';
import { useRef } from 'react';
import type { Platform } from '@/engine/insights/life/shared';
import type { LifeSplit as LifeSplitProps } from '@/engine/insights/life/split';
import { fmtInt, fmtPct } from '@/lib/format';
import { PLATFORM_NAME, PlatformTag, platformColor } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { Line } from './parts';

const WINNER: Record<Platform, string> = {
  spotify: 'Music got the most of you.',
  youtube: 'YouTube got the most of you.',
  netflix: 'Netflix got the most of you.',
};

/** The winner's share, big, over one outlined bar split three ways. */
export function LifeSplit({ result }: CardProps<LifeSplitProps>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const top = p.platforms.find((x) => x.platform === p.top);
  const shown = p.platforms.filter((x) => x.share > 0);
  useCardAnim(ref, (tl) => {
    tl.from('[data-big]', { yPercent: 30, opacity: 0, duration: 0.7 }, 0.5)
      .from(
        '[data-seg]',
        { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, stagger: 0.18, ease: 'steps(8)' },
        0.9,
      )
      .from('[data-line]', { opacity: 0, duration: 0.01, stagger: 0.12 }, 1.5);
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow className="font-mono font-medium">Platform split</Eyebrow>
      <Headline className="mt-[2cqw] text-[13cqw] leading-[0.86]">{WINNER[p.top]}</Headline>
      {top && (
        <>
          <p data-big className="t-display mt-[5cqw] text-[34cqw] leading-[0.78] text-(--c-accent)">
            {fmtPct(top.share)}
          </p>
          <p className="mt-[1cqw] font-mono text-[3.6cqw] uppercase">
            of your time went to {PLATFORM_NAME[p.top]}
          </p>
        </>
      )}
      <div className="mt-auto">
        <div
          role="img"
          aria-label={`Share of your time: ${shown.map((x) => `${PLATFORM_NAME[x.platform]} ${fmtPct(x.share)}`).join(', ')}.`}
          className="flex h-[11cqw] w-full border-[0.7cqw] border-(--c-ink)"
        >
          {shown.map((x) => (
            <span
              key={x.platform}
              data-seg
              className="h-full border-r-[0.7cqw] border-(--c-ink) last:border-r-0"
              style={{ width: `${x.share * 100}%`, background: platformColor(x.platform) }}
            />
          ))}
        </div>
        <div className="mt-[4cqw] font-mono text-[3.8cqw] leading-[2.1]">
          {p.platforms.map((x) => (
            <Line
              key={x.platform}
              label={<PlatformTag platform={x.platform} className="normal-case" />}
              value={`${fmtPct(x.share)} · ${x.platform === 'youtube' ? '≈ ' : ''}${fmtInt(x.hours)} h`}
            />
          ))}
        </div>
      </div>
    </CardBody>
  );
}
