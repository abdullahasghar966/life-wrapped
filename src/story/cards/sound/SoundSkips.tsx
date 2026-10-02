'use client';
import { useRef } from 'react';
import type { SpotifySkips } from '@/engine/insights/spotify/skips';
import { fmtInt, fmtPct } from '@/lib/format';
import { gsap } from '../../gsap';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

/** Generic fast-forward chevrons (not a brand icon). */
function FastForward() {
  return (
    <svg viewBox="0 0 64 32" aria-hidden className="h-[14cqw]">
      <path data-ff d="M2 2 L28 16 L2 30 Z" fill="var(--c-ink)" />
      <path data-ff d="M32 2 L58 16 L32 30 Z" fill="var(--c-ink)" />
    </svg>
  );
}

export function SoundSkips({ result }: CardProps<SpotifySkips>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const pct = fmtPct(p.rate);
  useCardAnim(ref, (tl, { loop }) => {
    tl.from(
      '[data-flip]',
      {
        rotateX: -90,
        transformOrigin: '50% 0%',
        opacity: 0,
        duration: 0.55,
        ease: 'back.out(1.8)',
        stagger: 0.14,
      },
      0.3,
    ).from('[data-sticker]', { scale: 0, duration: 0.45, ease: 'back.out(2.4)' }, 1.2);
    loop(
      gsap.to('[data-ff]', {
        x: 6,
        duration: 0.25,
        ease: 'power2.in',
        yoyo: true,
        repeat: -1,
        stagger: 0.12,
        repeatDelay: 0.6,
      }),
    );
  });
  const line = p.mostSkipped
    ? `You skipped ${pct} of tracks. Mostly ${p.mostSkipped.artist}.`
    : `You skipped ${pct} of tracks.`;
  return (
    <CardBody ref={ref}>
      <Eyebrow>Skips</Eyebrow>
      <div className="mt-[6cqw]">
        <FastForward />
      </div>
      <div aria-hidden className="mt-[5cqw] flex gap-[2cqw] [perspective:80cqw]">
        {Array.from(pct).map((ch, i) => (
          <span
            key={i}
            data-flip
            className="t-display flex h-[38cqw] min-w-[22cqw] items-center justify-center rounded-(--t-radius-frame) bg-(--c-ink) px-[2cqw] text-[30cqw] text-(--c-bg)"
          >
            {ch}
          </span>
        ))}
      </div>
      <p className="sr-only">{pct}</p>
      <Headline className="mt-[7cqw] text-[8.6cqw] leading-[1]" delay={0.9}>
        {line}
      </Headline>
      <div className="mt-auto flex flex-wrap gap-[2.5cqw]">
        <Sticker tilt={-4}>
          {fmtInt(p.skipped)} of {fmtInt(p.started)} tracks
        </Sticker>
        {p.mostSkipped && (
          <Sticker filled tilt={3}>
            {p.mostSkipped.artist}: {fmtPct(p.mostSkipped.rate)} skipped
          </Sticker>
        )}
      </div>
    </CardBody>
  );
}
