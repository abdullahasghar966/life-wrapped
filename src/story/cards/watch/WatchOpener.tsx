'use client';
import { useRef } from 'react';
import type { YoutubeOpener } from '@/engine/insights/youtube/opener';
import { fmtDate } from '@/lib/format';
import { Thumbnail } from '../../art/Art';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { PlayerFrame, PlayTriangle } from './PlayerFrame';

export function WatchOpener({ result }: CardProps<YoutubeOpener>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    // The play triangle pops, then shrinks away as the headline takes its place.
    tl.from(
      '[data-player]',
      { y: '6cqw', z: -380, rotationX: 28, transformPerspective: 900, opacity: 0, duration: 0.55 },
      0,
    )
      .from('[data-play]', { scale: 0, duration: 0.3, ease: 'back.out(2)' }, 0.25)
      .to('[data-play]', { scale: 0.2, opacity: 0, duration: 0.3, ease: 'power3.in' }, 0.8)
      .from('[data-scrub]', { scaleX: 0, duration: 3, ease: 'none' }, 0.6)
      .from('[data-knob]', { xPercent: -100, duration: 3, ease: 'none' }, 0.6)
      .from('[data-meta]', { opacity: 0, y: 12, duration: 0.3, stagger: 0.06 }, 1.1);
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Now playing</Eyebrow>
      <PlayerFrame
        progress={0.42}
        time={`${fmtDate(p.start)} – ${fmtDate(p.end)}`}
        className="mt-[5cqw]"
      >
        <Thumbnail
          name="Your year on YouTube"
          className="absolute inset-0 size-full"
          progress={0}
          initials={false}
          cover
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            data-play
            className="flex size-[20cqw] items-center justify-center rounded-full bg-(--t-bg)/60 text-(--t-text)"
          >
            <PlayTriangle className="size-[11cqw]" />
          </span>
        </div>
      </PlayerFrame>
      <Headline as="h1" split="words" className="mt-[8cqw] text-[15cqw] leading-[0.92]" delay={0.9}>
        Now playing: your year on YouTube.
      </Headline>
      <div className="mt-auto flex items-center gap-[3cqw]" data-meta>
        <span className="size-[10cqw] rounded-full bg-(--t-accent)" aria-hidden />
        <span>
          <span className="block text-[4.4cqw] font-bold">Your watch history</span>
          <span className="block text-[3.6cqw] text-(--c-muted)">{p.periodLabel}</span>
        </span>
      </div>
    </CardBody>
  );
}
