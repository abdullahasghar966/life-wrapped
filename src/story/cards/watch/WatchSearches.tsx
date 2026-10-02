'use client';
import { useRef } from 'react';
import type { YoutubeSearches } from '@/engine/insights/youtube/searches';
import { fmtDayMonth, fmtInt } from '@/lib/format';
import { Headline } from '../shared/Headline';
import { CardBody, Eyebrow } from '../shared/Layout';
import { useCardAnim } from '../shared/useCardAnim';
import type { CardProps } from '../types';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M15.5 15.5 L21 21" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function WatchSearches({ result }: CardProps<YoutubeSearches>) {
  const p = result.props;
  const ref = useRef<HTMLDivElement>(null);
  const top = p.topQueries[0]?.query ?? '';
  useCardAnim(ref, (tl) => {
    // Types the top query into the search bar (the real text is in the sr-only copy).
    const typed = ref.current?.querySelector<HTMLElement>('[data-typed]');
    if (typed) {
      const proxy = { n: 0 };
      typed.textContent = '';
      tl.to(
        proxy,
        {
          n: top.length,
          duration: Math.min(1.4, 0.07 * top.length),
          ease: 'none',
          onUpdate: () => {
            typed.textContent = top.slice(0, Math.round(proxy.n));
          },
        },
        0.3,
      );
    }
    tl.from('[data-caret]', { opacity: 0, duration: 0.2 }, 0.3).from(
      '[data-suggestion]',
      { y: 10, opacity: 0, duration: 0.25, stagger: 0.06 },
      '>-0.1',
    );
  });
  return (
    <CardBody ref={ref}>
      <Eyebrow>Searches</Eyebrow>
      <div className="mt-[6cqw] flex items-center gap-[3cqw] rounded-(--t-radius-pill) border-[0.5cqw] border-(--c-muted) px-[5cqw] py-[3.4cqw]">
        <SearchIcon className="size-[6cqw] shrink-0 text-(--c-muted)" />
        <span className="min-w-0 truncate text-[5.4cqw] font-medium">
          <span className="sr-only">{top}</span>
          <span data-typed aria-hidden>
            {top}
          </span>
          <span
            data-caret
            aria-hidden
            className="ml-[0.4cqw] inline-block h-[5.4cqw] w-[0.5cqw] translate-y-[0.8cqw] bg-(--c-accent)"
          />
        </span>
      </div>
      <ul className="mt-[3cqw] flex flex-col">
        {p.topQueries.slice(1, 5).map((q) => (
          <li
            key={q.query}
            data-suggestion
            className="flex items-center gap-[3cqw] px-[5cqw] py-[2.4cqw] text-[4.4cqw]"
          >
            <SearchIcon className="size-[4.6cqw] shrink-0 text-(--c-muted)" />
            <span className="min-w-0 flex-1 truncate">{q.query}</span>
            <span className="text-[3.6cqw] text-(--c-muted)">{fmtInt(q.count)}×</span>
          </li>
        ))}
      </ul>
      <p className="mt-[4cqw] text-[4cqw] text-(--c-muted)">
        {fmtInt(p.total)} searches
        {p.first && (
          <>
            {' '}
            • first: “{p.first.query}” on {fmtDayMonth(p.first.date)}
          </>
        )}
      </p>
      <Headline className="mt-auto text-[9cqw] leading-[1]" delay={1.4}>
        {`Most searched: “${top}”.`}
      </Headline>
    </CardBody>
  );
}
