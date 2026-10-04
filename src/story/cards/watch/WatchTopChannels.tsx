'use client';
import { useRef } from 'react';
import type { YoutubeTopChannels } from '@/engine/insights/youtube/topChannels';
import { fmt1, fmtInt } from '@/lib/format';
import { Thumbnail } from '../../art/Art';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

export function WatchTopChannels({ result }: CardProps<YoutubeTopChannels>) {
  const { channels } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-row]',
      {
        x: '30cqw',
        rotationY: 75,
        transformOrigin: '100% 50%',
        transformPerspective: 800,
        opacity: 0,
        duration: 0.45,
        stagger: 0.06,
      },
      0.2,
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Up next</Eyebrow>
      <Headline className="mt-[2cqw] text-[11cqw] leading-[0.95]">Your channel lineup.</Headline>
      <ol className="mt-[6cqw] flex flex-col gap-[3.6cqw]">
        {channels.map((c, i) => (
          <li key={c.channel} data-row className="flex items-center gap-[3.5cqw]">
            <Thumbnail
              name={c.channel}
              label={`${fmtInt(c.videos)} videos`}
              progress={Math.min(1, c.videos / channels[0]!.videos)}
              className="w-[28cqw] shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-[4.6cqw] leading-tight font-bold">
                <span className="sr-only">Number {i + 1}: </span>
                {c.channel}
              </span>
              <span className="mt-[1cqw] block text-[3.6cqw] text-(--c-muted)">
                #{i + 1} • ≈ {fmt1(c.hours)} hr
              </span>
            </span>
          </li>
        ))}
      </ol>
    </CardBody>
  );
}
