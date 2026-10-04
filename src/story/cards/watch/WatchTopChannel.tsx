'use client';
import { useRef } from 'react';
import type { YoutubeTopChannel } from '@/engine/insights/youtube/topChannel';
import { fmtDate, fmtInt, fmtPct, isLongName, shorten } from '@/lib/format';
import { Avatar } from '../../art/Art';
import { thumbArt } from '../../art/generatedArt';
import { variant } from '../../runtime';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const TAGS = [
  'Basically your roommate.',
  'They should know your name by now.',
  'A very loyal viewer.',
];

export function WatchTopChannel({ result }: CardProps<YoutubeTopChannel>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const art = thumbArt(p.channel);
  useCardAnim(ref, (tl) => {
    tl.from('[data-banner]', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.35 }, 0)
      .from('[data-avatar]', { scale: 0, duration: 0.35, ease: 'back.out(2)' }, 0.2)
      .from('[data-pill]', { x: '-10cqw', opacity: 0, duration: 0.3 }, 0.45)
      .from('[data-line]', { y: 14, opacity: 0, duration: 0.3, stagger: 0.06 }, 0.5);
  });
  return (
    <CardBody ref={ref} className="pt-[20cqw]">
      <Eyebrow>Top channel</Eyebrow>
      <div className="relative mt-[4cqw]">
        <div
          data-banner
          aria-hidden
          className="h-[30cqw] w-full rounded-(--t-radius-frame)"
          style={{ background: `linear-gradient(${art.angle}deg, ${art.from}, ${art.to})` }}
        />
        <div
          data-avatar
          className="absolute -bottom-[11cqw] left-[4cqw] size-[24cqw] rounded-full ring-[1.2cqw] ring-(--c-bg)"
        >
          <Avatar name={p.channel} className="size-full" />
        </div>
      </div>
      <div className="mt-[14cqw]">
        <p
          data-line
          className={`t-display line-clamp-2 leading-[0.95] break-words ${isLongName(p.channel) ? 'text-[8cqw]' : 'text-[11cqw]'}`}
        >
          {p.channel}
        </p>
        <p data-line className="mt-[2cqw] text-[4cqw] text-(--c-muted)">
          {fmtInt(p.videos)} videos watched • {fmtPct(p.share)} of your viewing • since{' '}
          {fmtDate(p.firstWatch)}
        </p>
        <span
          data-pill
          className="mt-[4cqw] inline-flex rounded-(--t-radius-pill) bg-(--c-ink) px-[4cqw] py-[1.8cqw] text-[3.8cqw] font-bold text-(--c-bg)"
        >
          Most watched
        </span>
      </div>
      <Headline className="mt-auto text-[8.4cqw] leading-[1]" delay={0.5}>
        {`${shorten(p.channel, 28)}: ${fmtInt(p.videos)} videos. ${variant(result.seed, TAGS)}`}
      </Headline>
    </CardBody>
  );
}
