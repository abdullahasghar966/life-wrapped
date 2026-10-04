'use client';
import { useRef } from 'react';
import type { Platform } from '@/engine/insights/life/shared';
import type { LifeSummary as Props } from '@/engine/insights/life/summary';
import { fmtInt, fmtPct } from '@/lib/format';
import { PLATFORM_NAME, platformColor } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { Barcode, Line, ReceiptPaper, Rule } from './parts';

const ORDER: Platform[] = ['spotify', 'youtube', 'netflix'];

/** The whole year as one printed receipt: the card made to be shared. */
export function LifeSummary({ result }: CardProps<Props>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const shown = ORDER.filter((pl) => p.shares[pl] > 0);
  const about = p.estimated ? '≈ ' : '';
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-print]',
      {
        yPercent: -18,
        rotationX: 40,
        transformOrigin: '50% 0%',
        transformPerspective: 900,
        opacity: 0,
        duration: 0.9,
        ease: 'steps(9)',
      },
      0.5,
    )
      .from('[data-line]', { opacity: 0, duration: 0.01, stagger: 0.09 }, 0.8)
      .from(
        '[data-seg]',
        { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, stagger: 0.15, ease: 'steps(8)' },
        1,
      );
  });
  return (
    <CardBody ref={ref}>
      <Headline as="h2" split="words" className="text-[14cqw] leading-[0.84] text-balance">
        Your online life, wrapped.
      </Headline>
      <div data-print style={{ rotate: '-1.5deg' }} className="mt-auto">
        <ReceiptPaper className="text-[3.5cqw] leading-[1.6]">
          <p data-line className="text-center font-medium tracking-[0.2em]">
            LIFE, WRAPPED
          </p>
          <p data-line className="text-center text-[2.8cqw] tracking-[0.12em] uppercase">
            Your year, itemised
          </p>
          <Rule />
          {shown.map((pl) => (
            <Line key={pl} label={PLATFORM_NAME[pl]} value={fmtPct(p.shares[pl])} />
          ))}
          <div data-line className="mt-[1.4cqw] flex h-[3cqw] border-[0.5cqw] border-current">
            {shown.map((pl) => (
              <span
                key={pl}
                data-seg
                className="h-full border-r-[0.5cqw] border-current last:border-r-0"
                style={{ width: `${p.shares[pl] * 100}%`, background: platformColor(pl) }}
              />
            ))}
          </div>
          <Rule />
          <Line strong label="Total" value={`${about}${fmtInt(p.hours)} h`} />
          <Line label="That’s" value={`${about}${fmtInt(p.days)} days`} />
          <Line strong label="You are" value={p.label} />
          <Barcode text={p.label} className="mt-[2.4cqw] h-[6cqw]" />
          <p
            data-line
            className="mt-[1.2cqw] text-center text-[2.8cqw] tracking-[0.14em] uppercase"
          >
            Thank you for scrolling
          </p>
        </ReceiptPaper>
      </div>
    </CardBody>
  );
}
