'use client';
import { useRef } from 'react';
import type { LifeOpener as LifeOpenerProps } from '@/engine/insights/life/opener';
import { PlatformTag, platformColor } from '../../charts/platform';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { AuroraSky } from './AuroraSky';
import { auroraDrift } from './useAuroraDrift';

/** Three platform orbs orbit, then drift together into one glow. */
export function LifeOpener({ result }: CardProps<LifeOpenerProps>) {
  const { platforms } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    auroraDrift(ref.current, loop);
    // Orbs start spread on a triangle and drift to the centre while the ring turns.
    const startX = ['-22cqw', '22cqw', '0cqw'];
    const startY = ['14cqw', '14cqw', '-24cqw'];
    tl.from('[data-orbit]', { rotate: -240, duration: 2.6, ease: 'sine.inOut' }, 0)
      .from(
        '[data-orb]',
        {
          x: (i: number) => startX[i] ?? '0cqw',
          y: (i: number) => startY[i] ?? '0cqw',
          duration: 2.6,
          ease: 'sine.inOut',
        },
        0,
      )
      .from('[data-core]', { scale: 0, opacity: 0, duration: 1.2, ease: 'sine.out' }, 1.9)
      .from('[data-tag]', { opacity: 0, y: 12, duration: 0.8, stagger: 0.15 }, 2.2);
  });
  return (
    <CardBody ref={ref}>
      <AuroraSky />
      <Eyebrow className="relative">Your online life</Eyebrow>
      <div className="relative mx-auto mt-[10cqw] size-[64cqw]">
        <div data-orbit className="absolute inset-0">
          {platforms.map((p) => (
            <span
              key={p}
              data-orb
              aria-hidden
              className="absolute top-1/2 left-1/2 size-[30cqw] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${platformColor(p)}, color-mix(in srgb, ${platformColor(p)} 30%, transparent) 70%)`,
              }}
            />
          ))}
        </div>
        <span
          data-core
          aria-hidden
          className="absolute top-1/2 left-1/2 size-[18cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--c-ink) opacity-80 blur-[3cqw]"
        />
      </div>
      <Headline
        as="h1"
        split="words"
        className="relative mt-[10cqw] text-[14cqw] leading-[0.95]"
        delay={1.4}
      >
        Now, all of it together.
      </Headline>
      <div className="relative mt-auto flex flex-wrap gap-x-[5cqw] gap-y-[2cqw] text-[4cqw]">
        {platforms.map((p) => (
          <span key={p} data-tag>
            <PlatformTag platform={p} />
          </span>
        ))}
      </div>
    </CardBody>
  );
}
