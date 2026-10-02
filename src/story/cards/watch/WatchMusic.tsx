'use client';
import { useRef } from 'react';
import type { YoutubeMusic } from '@/engine/insights/youtube/music';
import { fmtInt } from '@/lib/format';
import { Thumbnail } from '../../art/Art';
import { gsap } from '../../gsap';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import { BEAT, Equalizer } from '../sound/Equalizer';
import type { CardProps } from '../types';

export function WatchMusic({ result }: CardProps<YoutubeMusic>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    tl.from('[data-thumb]', { scale: 0.9, opacity: 0, duration: 0.35 }, 0).from(
      '[data-row]',
      { x: '10cqw', opacity: 0, duration: 0.3, stagger: 0.07 },
      0.4,
    );
    loop(
      gsap.to('[data-eq-bar]', {
        scaleY: () => gsap.utils.random(0.3, 1),
        duration: BEAT / 2,
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        ease: 'sine.inOut',
        stagger: 0.06,
        delay: 0.5,
      }),
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>YouTube Music</Eyebrow>
      <div data-thumb className="relative mt-[6cqw]">
        <Thumbnail name={`${p.channel} music`} progress={0.7} className="w-full" />
        <div className="absolute inset-0 flex items-end justify-center pb-[10cqw]">
          <Equalizer bars={7} className="h-[22cqw]" barClassName="bg-(--t-text) w-[3cqw]" />
        </div>
      </div>
      <ol className="mt-[6cqw] flex flex-col gap-[3cqw]">
        {p.channels.map((c, i) => (
          <li key={c.channel} data-row className="flex items-baseline justify-between gap-[3cqw]">
            <span className="text-[5cqw] font-bold">
              <span className="text-(--c-muted)">{i + 1}. </span>
              {c.channel}
            </span>
            <span className="text-[3.8cqw] text-(--c-muted)">{fmtInt(c.plays)} plays</span>
          </li>
        ))}
      </ol>
      <Headline className="mt-auto text-[8.6cqw] leading-[1]" delay={0.6}>
        {`Your YouTube Music favourite: ${p.channel}.`}
      </Headline>
    </CardBody>
  );
}
