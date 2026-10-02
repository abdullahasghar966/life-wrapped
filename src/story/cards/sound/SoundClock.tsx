'use client';
import { useRef } from 'react';
import type { ListeningPersona, SpotifyClock } from '@/engine/insights/spotify/clock';
import { fmtHour, fmtPct } from '@/lib/format';
import { RadialClock } from '../../charts/RadialClock';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow, Sticker } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

const BADGE: Record<ListeningPersona, string> = {
  'Night Owl': 'Certified night owl.',
  'Early Bird': 'Early bird energy.',
  Daytime: 'A daytime listener.',
  Evening: 'Evenings were your soundtrack.',
};

export function SoundClock({ result }: CardProps<SpotifyClock>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-bar]',
      {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 0.5,
        ease: 'back.out(2)',
        stagger: 0.035,
      },
      0.2,
    ).from(
      '[data-sticker]',
      { scale: 0, rotate: -40, duration: 0.6, ease: 'elastic.out(1, 0.5)' },
      1.2,
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Listening clock</Eyebrow>
      <Headline className="mt-[2cqw] text-[10cqw] leading-[0.95]">
        {`Peak hour: ${fmtHour(p.peakHour)}. ${BADGE[p.persona]}`}
      </Headline>
      <div className="relative mt-[4cqw] flex flex-1 items-center justify-center">
        <RadialClock
          hours={p.hours}
          peakHour={p.peakHour}
          className="aspect-square w-[84cqw]"
          label={`Minutes listened by hour of day. Peak at ${fmtHour(p.peakHour)}.`}
        />
      </div>
      <div className="flex items-center justify-between">
        <Sticker filled tilt={-6} className="text-[5cqw]">
          {p.persona}
        </Sticker>
        <span className="text-[4cqw] font-bold text-(--c-muted)">
          {fmtPct(p.personaShare)} of your listening
        </span>
      </div>
    </CardBody>
  );
}
