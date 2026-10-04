'use client';
import { useRef } from 'react';
import type { LifeOpener as LifeOpenerProps } from '@/engine/insights/life/opener';
import { PLATFORM_NAME, PlatformGlyph } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { Line, PrinterSlot, ReceiptPaper, Rule } from './parts';

/** A receipt prints out of a slot, one line per app, then the headline lands. */
export function LifeOpener({ result }: CardProps<LifeOpenerProps>) {
  const { platforms } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-print]',
      {
        yPercent: -101,
        rotationX: 32,
        transformOrigin: '50% 0%',
        transformPerspective: 900,
        duration: 1.3,
        ease: 'steps(13)',
      },
      0.15,
    ).from('[data-line]', { opacity: 0, duration: 0.01, stagger: 0.11 }, 0.45);
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow className="font-mono font-medium">Your online life</Eyebrow>
      <PrinterSlot className="-mx-[1.5cqw] mt-[6cqw]" />
      <div className="-mt-[1.6cqw] overflow-hidden px-[4cqw]">
        <div data-print>
          <ReceiptPaper className="text-[3.9cqw] leading-[1.7]">
            <p data-line className="text-center font-medium tracking-[0.2em]">
              LIFE, WRAPPED
            </p>
            <p data-line className="text-center text-[3.1cqw] tracking-[0.12em] uppercase">
              {platforms.length} apps · 1 story
            </p>
            <Rule />
            {platforms.map((pl) => (
              <Line
                key={pl}
                label={
                  <span className="inline-flex items-center gap-[1.6cqw]">
                    <PlatformGlyph platform={pl} className="size-[3.8cqw]" />
                    {PLATFORM_NAME[pl]}
                  </span>
                }
                value="Included"
              />
            ))}
            <Rule />
            <p data-line className="text-center text-[3.1cqw] tracking-[0.12em] uppercase">
              Read on this device
            </p>
          </ReceiptPaper>
        </div>
      </div>
      <Headline
        as="h1"
        split="words"
        className="mt-auto text-[18cqw] leading-[0.84] text-balance"
        delay={1.2}
      >
        Now, all of it together.
      </Headline>
    </CardBody>
  );
}
