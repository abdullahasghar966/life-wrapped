'use client';
import { useId, useRef } from 'react';
import type { NetflixDevices } from '@/engine/insights/netflix/devices';
import { fmt1, fmtPct } from '@/lib/format';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';
import { CinemaLayers } from './Cinema';

/** Generic device outlines (no brands), drawn in a 100 × 100 box. */
const SHAPES: Record<string, string> = {
  TV: 'M6 14 h88 a4 4 0 0 1 4 4 v52 a4 4 0 0 1 -4 4 h-88 a4 4 0 0 1 -4 -4 v-52 a4 4 0 0 1 4 -4 Z M38 74 h24 v8 h10 v6 h-44 v-6 h10 Z',
  Phone:
    'M34 4 h32 a8 8 0 0 1 8 8 v76 a8 8 0 0 1 -8 8 h-32 a8 8 0 0 1 -8 -8 v-76 a8 8 0 0 1 8 -8 Z',
  Tablet:
    'M20 8 h60 a8 8 0 0 1 8 8 v68 a8 8 0 0 1 -8 8 h-60 a8 8 0 0 1 -8 -8 v-68 a8 8 0 0 1 8 -8 Z',
  Computer: 'M14 16 h72 a4 4 0 0 1 4 4 v46 h-80 v-46 a4 4 0 0 1 4 -4 Z M2 70 h96 l-6 10 h-84 Z',
  Other:
    'M18 18 h64 a6 6 0 0 1 6 6 v52 a6 6 0 0 1 -6 6 h-64 a6 6 0 0 1 -6 -6 v-52 a6 6 0 0 1 6 -6 Z',
};

const PHRASE: Record<string, string> = {
  TV: 'on the big screen',
  Phone: 'on your phone',
  Tablet: 'on a tablet',
  Computer: 'on a computer',
  Other: 'on other devices',
};

function Device({ kind, share }: { kind: string; share: number }) {
  const id = useId();
  const d = SHAPES[kind] ?? SHAPES.Other!;
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="w-full">
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="var(--t-surface)" />
      <g clipPath={`url(#${id})`}>
        <rect
          data-fill
          x="0"
          y={100 - share * 100}
          width="100"
          height={share * 100}
          fill="var(--c-accent)"
        />
      </g>
      <path d={d} fill="none" stroke="var(--c-muted)" strokeWidth="1.5" />
    </svg>
  );
}

export function BingeDevices({ result }: CardProps<NetflixDevices>) {
  const { classes } = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const top = classes[0]!;
  const max = Math.max(...classes.map((c) => c.share));
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-fill]',
      { scaleY: 0, transformOrigin: '50% 100%', duration: 1.4, ease: 'expo.out', stagger: 0.15 },
      0.3,
    );
  });
  return (
    <CardBody ref={ref}>
      <div aria-hidden className="absolute inset-0">
        <CinemaLayers />
      </div>
      <Eyebrow className="relative">Where you watch</Eyebrow>
      <Headline className="relative mt-[2cqw] text-[13cqw] leading-[0.9]">
        {`${fmtPct(top.share)} ${PHRASE[top.device] ?? 'on one device'}.`}
      </Headline>
      <ul
        className="relative mt-[10cqw] grid gap-[5cqw]"
        style={{ gridTemplateColumns: `repeat(${Math.min(4, classes.length)}, minmax(0, 1fr))` }}
      >
        {classes.slice(0, 4).map((c) => (
          <li key={c.device} className="flex flex-col items-center">
            {/* Fill height is relative to the most-used device, so small shares stay visible. */}
            <Device kind={c.device} share={c.share / max} />
            <span className="t-display mt-[2cqw] text-[9cqw] leading-none">{fmtPct(c.share)}</span>
            <span className="text-center text-[3.4cqw] leading-tight text-(--c-muted)">
              {c.device} · {fmt1(c.hours)} h
            </span>
          </li>
        ))}
      </ul>
    </CardBody>
  );
}
