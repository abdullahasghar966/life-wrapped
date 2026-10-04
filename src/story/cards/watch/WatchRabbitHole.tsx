'use client';
import { useRef } from 'react';
import { UNAVAILABLE_TITLE } from '@/engine/insights/youtube/rabbitHole';
import type { RabbitHole } from '@/engine/insights/youtube/shared';
import { fmtClock, fmtDayMonth, shorten } from '@/lib/format';
import { Thumbnail } from '../../art/Art';
import { CountUp } from '../shared/CountUp';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

export function WatchRabbitHole({ result }: CardProps<RabbitHole>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  // Show the first few videos of the chain; the count says how deep it went.
  const shown = p.chain.slice(0, 5);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-line]',
      { scaleY: 0, transformOrigin: '50% 0%', duration: 1.4, ease: 'power2.inOut' },
      0.1,
    )
      .from('[data-hop]', { x: '-12cqw', opacity: 0, duration: 0.3, stagger: 0.18 }, 0.2)
      .from('[data-end]', { scale: 0.6, opacity: 0, duration: 0.35, ease: 'back.out(2)' }, 1.3);
  });
  const first = p.firstTitle ?? UNAVAILABLE_TITLE;
  return (
    <CardBody ref={ref}>
      <Eyebrow>Rabbit hole · {fmtDayMonth(p.date)}</Eyebrow>
      {/* The chain, then the count below it, in normal flow: they can't overlap, however long the titles. */}
      <div className="relative mt-[4cqw] min-h-0 shrink overflow-hidden">
        <span
          data-line
          aria-hidden
          className="absolute top-[2cqw] bottom-[2cqw] left-[4.5cqw] w-[1.2cqw] rounded-full bg-(--t-accent)"
        />
        <ol className="relative flex flex-col gap-[2cqw]">
          {shown.map((v, i) => (
            <li key={i} data-hop className="flex items-center gap-[3cqw]">
              <span className="relative z-10 flex size-[10cqw] shrink-0 items-center justify-center rounded-full bg-(--t-cta) text-[3.4cqw] font-bold text-(--t-on-cta)">
                {i + 1}
              </span>
              <Thumbnail
                name={v.title ?? `removed-${i}`}
                className="w-[20cqw] shrink-0"
                progress={1}
              />
              <span className="line-clamp-2 min-w-0 text-[3.6cqw] leading-tight font-semibold break-words">
                {v.title ?? UNAVAILABLE_TITLE}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p data-end className="mt-[3cqw] flex shrink-0 items-baseline gap-[2.4cqw]">
        <span className="t-display text-[14cqw] leading-none">
          <CountUp value={p.videos} />
        </span>
        <span className="text-[4.2cqw] font-semibold text-(--c-muted)">
          videos • {fmtClock(p.startMinute)} → {fmtClock(p.endMinute)}
        </span>
      </p>
      <Headline className="mt-auto shrink-0 pt-[3cqw] text-[7cqw] leading-[1.05]" delay={1}>
        {`It started with “${shorten(first, 40)}”. ${p.videos} videos later it was ${fmtClock(p.endMinute)}.`}
      </Headline>
    </CardBody>
  );
}
