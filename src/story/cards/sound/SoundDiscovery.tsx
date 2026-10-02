'use client';
import { useMemo, useRef } from 'react';
import type { SpotifyDiscovery } from '@/engine/insights/spotify/discovery';
import { fmtInt } from '@/lib/format';
import { initials, nameRandom } from '../../art/generatedArt';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

export function SoundDiscovery({ result }: CardProps<SpotifyDiscovery>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  // Decorative bubbles, placed deterministically from the data so they never jump.
  const bubbles = useMemo(() => {
    const r = nameRandom(`discovery-${p.artists}-${p.newArtists}`);
    return Array.from({ length: 22 }, (_, i) => ({
      x: r() * 80,
      y: r() * 78,
      s: i < 3 ? 20 - i * 3 : 4 + r() * 8,
      filled: r() > 0.45,
      label: p.topNew[i] ? initials(p.topNew[i]!) : '',
    }));
  }, [p.artists, p.newArtists, p.topNew]);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-bubble]',
      {
        scale: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)',
        stagger: { each: 0.05, from: 'random' },
      },
      0.1,
    );
  });
  const line =
    p.newArtists === null
      ? `${fmtInt(p.artists)} artists in your rotation.`
      : `${fmtInt(p.artists)} artists. ${fmtInt(p.newArtists)} brand new to you.`;
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-x-[4cqw] top-[30cqw] h-[34cqh]">
        {bubbles.map((b, i) => (
          <span
            key={i}
            data-bubble
            className={`absolute flex items-center justify-center rounded-full text-[5cqw] font-black ${
              b.filled ? 'bg-(--c-ink) text-(--c-bg)' : 'border-[0.6cqw] border-(--c-ink)'
            }`}
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.s}cqw`, height: `${b.s}cqw` }}
          >
            {b.label}
          </span>
        ))}
      </div>
      <Eyebrow className="relative">Discovery</Eyebrow>
      <div className="relative mt-auto">
        <p className="t-display text-[24cqw] leading-[0.85]">
          <CountUp value={p.artists} />
        </p>
        <p className="t-display text-[9cqw]">artists</p>
        {p.newArtists !== null && (
          <p className="mt-[3cqw] text-[6cqw] font-extrabold">
            <span className="rounded-full bg-(--c-ink) px-[3cqw] py-[0.6cqw] text-(--c-bg)">
              {fmtInt(p.newArtists)} brand new
            </span>
          </p>
        )}
        <Headline className="mt-[5cqw] text-[7cqw] leading-[1.02]" delay={0.8}>
          {line}
        </Headline>
        {p.topNew.length > 0 && (
          <p className="mt-[2cqw] text-[3.8cqw] font-semibold text-(--c-muted)">
            New favourites: {p.topNew.join(', ')}
          </p>
        )}
      </div>
    </CardBody>
  );
}
