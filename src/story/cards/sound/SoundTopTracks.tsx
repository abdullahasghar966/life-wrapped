'use client';
import { useRef } from 'react';
import type { SpotifyTopTracks } from '@/engine/insights/spotify/topTracks';
import { fmtInt } from '@/lib/format';
import { Cover } from '../../art/Art';
import { gsap } from '../../gsap';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { BEAT, Equalizer } from './Equalizer';

export function SoundTopTracks({ result }: CardProps<SpotifyTopTracks>) {
  const { tracks } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl, { loop }) => {
    tl.from('[data-row]', { y: '8cqw', opacity: 0, duration: 0.5, stagger: 0.09 }, 0.35);
    loop(
      gsap.to('[data-eq-bar]', {
        scaleY: () => gsap.utils.random(0.25, 1),
        duration: BEAT / 2,
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        ease: 'sine.inOut',
        stagger: 0.07,
        delay: 0.9,
      }),
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Top songs</Eyebrow>
      <Headline className="mt-[2cqw] text-[10.5cqw] leading-[0.95]">
        The songs that lived in your head.
      </Headline>
      <ol className="mt-[6cqw] flex flex-col gap-[3.2cqw]">
        {tracks.map((t, i) => (
          <li
            key={`${t.track}-${t.artist}`}
            data-row
            className={`flex items-center gap-[3cqw] rounded-(--t-radius-tile) p-[2cqw] ${i === 0 ? 'bg-(--c-ink)/10' : ''}`}
          >
            <span
              aria-hidden
              className="w-[6cqw] text-center text-[4.4cqw] font-bold text-(--c-muted)"
            >
              {i === 0 ? (
                <Equalizer
                  bars={3}
                  className="h-[5cqw]"
                  barClassName="bg-(--c-accent) w-[1.3cqw]"
                />
              ) : (
                i + 1
              )}
            </span>
            <Cover
              name={`${t.track} · ${t.artist}`}
              className="size-[13cqw] shrink-0 rounded-[1.2cqw]"
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-[4.8cqw] font-extrabold ${i === 0 ? 'text-(--c-accent)' : ''}`}
              >
                <span className="sr-only">Number {i + 1}: </span>
                {t.track}
              </span>
              <span className="block truncate text-[3.6cqw] font-medium text-(--c-muted)">
                {t.artist}
              </span>
            </span>
            <span className="text-[3.6cqw] font-semibold whitespace-nowrap text-(--c-muted)">
              {fmtInt(t.plays)} plays
            </span>
          </li>
        ))}
      </ol>
    </CardBody>
  );
}
