'use client';
import { useRef } from 'react';
import type { YoutubeNightOwl } from '@/engine/insights/youtube/nightOwl';
import { fmtHour, fmtPct } from '@/lib/format';
import { variant } from '../../runtime';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

/** The 24-hour scrubber's chapters, as [label, startHour, endHour]. */
const CHAPTERS = [
  ['Night', 0, 5, 'night'],
  ['Morning', 5, 12, 'morning'],
  ['Afternoon', 12, 17, 'afternoon'],
  ['Evening', 17, 24, 'evening'],
] as const;

const NIGHT_LINES = [
  'Sleep can wait, apparently.',
  'The algorithm knows you’re up.',
  'Just one more video.',
];

export function WatchNightOwl({ result }: CardProps<YoutubeNightOwl>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const maxPart = Math.max(...Object.values(p.dayparts), 0.01);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-chapter]',
      { scaleX: 0, transformOrigin: '0% 50%', duration: 0.3, stagger: 0.08 },
      0.1,
    )
      .from('[data-knob]', { scale: 0, duration: 0.4, ease: 'back.out(2)' }, 0.5)
      .from('[data-glow]', { opacity: 0, duration: 0.6 }, 0.6);
  });
  const night = p.nightShare >= 0.2;
  const line = night
    ? `${fmtPct(p.nightShare)} after midnight. ${variant(result.seed, NIGHT_LINES)}`
    : `Peak hour: ${fmtHour(p.peakHour)}. Right on schedule.`;
  const knob = ((p.peakHour + 0.5) / 24) * 100;
  return (
    <CardBody ref={ref}>
      <Eyebrow>Night owl</Eyebrow>
      <p className="t-display relative z-10 mt-[6cqw] text-[34cqw] leading-[0.8]">
        <CountUp value={p.nightShare * 100} suffix="%" />
      </p>
      <p className="t-display relative z-10 text-[8cqw] text-(--c-muted)">after midnight</p>

      <div className="relative mt-[12cqw]">
        {/* A heat glow over the night chapter: stronger the more you watch after midnight. */}
        <div
          data-glow
          aria-hidden
          className="pointer-events-none absolute -top-[12cqw] -left-[8cqw] h-[28cqw] w-[45%]"
          style={{
            background: `radial-gradient(closest-side, color-mix(in srgb, var(--t-accent) ${Math.round(Math.min(1, p.nightShare * 1.6) * 100)}%, transparent), transparent)`,
          }}
        />
        <div className="relative flex h-[3.4cqw] gap-[0.8cqw]">
          {CHAPTERS.map(([label, from, to, key]) => (
            <span
              key={label}
              data-chapter
              className="h-full rounded-[0.6cqw] bg-(--t-accent)"
              style={{
                width: `${((to - from) / 24) * 100}%`,
                opacity: 0.25 + 0.75 * (p.dayparts[key] / maxPart),
              }}
            />
          ))}
          <span
            data-knob
            aria-hidden
            className="absolute top-1/2 size-[6cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1cqw] border-(--c-bg) bg-(--t-accent)"
            style={{ left: `${knob}%` }}
          />
        </div>
        <dl className="relative mt-[3cqw] flex text-[3.4cqw]">
          {CHAPTERS.map(([label, from, to, key]) => (
            <div key={label} style={{ width: `${((to - from) / 24) * 100}%` }}>
              <dt className="font-bold">{label}</dt>
              <dd className="text-(--c-muted)">{fmtPct(p.dayparts[key])}</dd>
            </div>
          ))}
        </dl>
        <p className="relative mt-[3cqw] text-[3.8cqw] text-(--c-muted)">
          Peak hour: {fmtHour(p.peakHour)}
        </p>
      </div>
      <Headline className="mt-auto text-[8.4cqw] leading-[1]" delay={0.7}>
        {line}
      </Headline>
    </CardBody>
  );
}
