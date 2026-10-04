'use client';
import { useRef } from 'react';
import type { NetflixOpener } from '@/engine/insights/netflix/opener';
import { fmtDate } from '@/lib/format';
import { Headline } from '../shared/Headline';
import { CardBody } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers, RedGlow } from './Cinema';

export function BingeOpener({ result }: CardProps<NetflixOpener>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    // Fade up from black, the letterbox opens, a red light sweeps across.
    tl.from(
      '[data-scene]',
      { opacity: 0, z: -260, transformPerspective: 900, duration: 1.4, ease: 'expo.out' },
      0,
    )
      .from(
        '[data-bar-top]',
        { scaleY: 6, transformOrigin: '50% 0%', duration: 1.1, ease: 'expo.inOut' },
        0.1,
      )
      .from(
        '[data-bar-bottom]',
        { scaleY: 6, transformOrigin: '50% 100%', duration: 1.1, ease: 'expo.inOut' },
        0.1,
      )
      .fromTo(
        '[data-sweep]',
        { xPercent: -160 },
        { xPercent: 260, duration: 1.6, ease: 'power2.inOut' },
        0.7,
      )
      .from('[data-meta]', { opacity: 0, duration: 1 }, 1.4);
  });
  return (
    <CardBody ref={ref} className="justify-center px-0">
      <div data-scene aria-hidden className="absolute inset-0">
        <RedGlow className="top-[30%] left-1/2 size-[140cqw] -translate-x-1/2" strength={0.45} />
        <CinemaLayers />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          data-sweep
          className="absolute -inset-y-[10%] left-0 w-[40%] rotate-[14deg] opacity-60"
          style={{
            background:
              'linear-gradient(90deg, transparent, color-mix(in srgb, var(--c-accent) 70%, transparent), transparent)',
          }}
        />
      </div>
      <div data-bar-top aria-hidden className="absolute inset-x-0 top-0 h-[12cqh] bg-(--c-bg)" />
      <div
        data-bar-bottom
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[12cqh] bg-(--c-bg)"
      />
      <div className="relative px-[8cqw]">
        <Headline as="h1" split="lines" className="text-[21cqw] leading-[0.86]" delay={0.9}>
          Previously on… you.
        </Headline>
        <p
          data-meta
          className="mt-[5cqw] text-[3.8cqw] font-semibold tracking-[0.2em] text-(--c-muted) uppercase"
        >
          {fmtDate(p.start)} – {fmtDate(p.end)}
        </p>
      </div>
    </CardBody>
  );
}
