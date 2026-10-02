'use client';
import { useRef } from 'react';
import type { SpotifyOpener } from '@/engine/insights/spotify/opener';
import { fmtDate } from '@/lib/format';
import { gsap } from '../../gsap';
import { Headline } from '../shared/Headline';
import { CardBody, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { BEAT, Equalizer } from './Equalizer';

export function SoundOpener({ result }: CardProps<SpotifyOpener>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    tl.from(
      '[data-blob]',
      { scale: 0, duration: 0.8, ease: 'elastic.out(1, 0.55)', stagger: 0.12 },
      0.15,
    )
      .from(
        '[data-eq-bar]',
        { scaleY: 0.05, duration: 0.45, ease: 'back.out(2.5)', stagger: 0.06 },
        0.5,
      )
      .from('[data-sticker]', { scale: 0, rotate: -30, duration: 0.5, ease: 'back.out(2)' }, 1.1);
    loop(
      gsap.to('[data-eq-bar]', {
        scaleY: () => gsap.utils.random(0.35, 1),
        duration: BEAT / 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        stagger: { each: 0.08, from: 'random' },
        delay: 1,
      }),
    );
    loop(
      gsap.to('[data-blob]', {
        y: '-=3cqw',
        duration: BEAT * 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.25,
      }),
    );
  });
  return (
    <CardBody ref={ref} className="justify-between">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          data-blob
          className="absolute top-[22cqw] -right-[20cqw] size-[62cqw] rounded-full bg-(--c-ink)"
        />
        <div
          data-blob
          className="absolute top-[52cqh] -left-[14cqw] h-[22cqw] w-[56cqw] rotate-[-14deg] rounded-full border-[1.2cqw] border-(--c-ink)"
        />
        <div
          data-blob
          className="absolute right-[10cqw] bottom-[30cqh] size-[14cqw] rounded-full bg-(--c-ink)"
        />
      </div>
      <Equalizer bars={7} className="relative h-[22cqw]" />
      <div className="relative">
        <Headline as="h1" split="chars" className="text-[17cqw] text-(--c-ink)">
          Your year in sound.
        </Headline>
        <div className="mt-[5cqw]">
          <Sticker filled tilt={-4}>
            {fmtDate(p.start)} – {fmtDate(p.end)}
          </Sticker>
        </div>
      </div>
    </CardBody>
  );
}
