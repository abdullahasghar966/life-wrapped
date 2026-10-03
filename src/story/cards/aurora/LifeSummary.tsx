'use client';
import { useRef } from 'react';
import type { Platform } from '@/engine/insights/life/shared';
import type { LifeSummary as Props } from '@/engine/insights/life/summary';
import { fmtInt, fmtPct } from '@/lib/format';
import { PLATFORM_NAME, PlatformGlyph, platformColor } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

const ORDER: Platform[] = ['spotify', 'youtube', 'netflix'];

/** A poster that brings the three palettes together. */
export function LifeSummary({ result }: CardProps<Props>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const shown = ORDER.filter((pl) => p.shares[pl] > 0);
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    tl.from(
      '[data-stripe]',
      { scaleY: 0, transformOrigin: '50% 100%', duration: 1.2, stagger: 0.15 },
      0.3,
    ).from('[data-fact]', { opacity: 0, y: 12, duration: 0.8, stagger: 0.12 }, 0.9);
  });
  return (
    <CardBody ref={ref}>
      <AuroraSky intensity={0.38} />
      <Headline as="h2" split="words" className="relative text-[15cqw] leading-[0.92]">
        Your online life, wrapped.
      </Headline>
      <div className="relative mt-[6cqw] flex h-[44cqw] items-end gap-[2.4cqw]">
        {shown.map((pl) => (
          <div key={pl} className="flex h-full flex-1 flex-col justify-end">
            <div
              data-stripe
              className="flex items-start justify-center rounded-t-(--t-radius-tile) pt-[2cqw] text-(--c-bg)"
              style={{
                height: `${Math.max(16, p.shares[pl] * 100)}%`,
                background: platformColor(pl),
              }}
            >
              <PlatformGlyph platform={pl} className="size-[6cqw]" />
            </div>
            <p className="mt-[1.6cqw] text-center text-[3.4cqw] font-semibold">
              {PLATFORM_NAME[pl]} {fmtPct(p.shares[pl])}
            </p>
          </div>
        ))}
      </div>
      <dl className="relative mt-auto grid grid-cols-2 gap-x-[4cqw] gap-y-[4cqw]">
        <div data-fact>
          <dt className="text-[3.2cqw] font-semibold tracking-[0.12em] text-(--c-muted) uppercase">
            Total
          </dt>
          <dd className="t-display text-[8cqw] leading-none">
            {p.estimated ? '≈ ' : ''}
            {fmtInt(p.hours)} h
          </dd>
        </div>
        <div data-fact>
          <dt className="text-[3.2cqw] font-semibold tracking-[0.12em] text-(--c-muted) uppercase">
            That’s
          </dt>
          <dd className="t-display text-[8cqw] leading-none">
            {p.estimated ? '≈ ' : ''}
            {fmtInt(p.days)} days
          </dd>
        </div>
        <div data-fact className="col-span-2">
          <dt className="text-[3.2cqw] font-semibold tracking-[0.12em] text-(--c-muted) uppercase">
            Personality
          </dt>
          <dd className="t-display text-gradient text-[9cqw] leading-none">{p.label}</dd>
        </div>
      </dl>
    </CardBody>
  );
}
