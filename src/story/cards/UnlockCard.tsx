'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { Headline } from './shared/Headline';
import { CardBody, Eyebrow } from './shared/Layout';
import { useCardAnim } from './shared/useCardAnim';

/** Ends a platform deck when the combined "online life" deck isn't unlocked yet. */
export function UnlockCard() {
  const ref = useRef<HTMLDivElement>(null);
  useCardAnim(ref, (tl) => {
    tl.from(
      '[data-orb]',
      { scale: 0, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'back.out(1.6)' },
      0.1,
    );
  });
  return (
    <CardBody ref={ref} className="justify-center">
      <div aria-hidden className="mb-[8cqw] flex gap-[3cqw]">
        {['--c-accent', '--c-ink', '--c-muted'].map((v) => (
          <span
            key={v}
            data-orb
            className="size-[16cqw] rounded-full opacity-90"
            style={{ background: `var(${v})` }}
          />
        ))}
      </div>
      <Eyebrow>One more thing</Eyebrow>
      <Headline className="mt-[3cqw] text-[11cqw] leading-[0.95]">
        Add another platform to unlock your online life story.
      </Headline>
      <p className="mt-[5cqw] text-[4.4cqw] leading-snug font-medium text-(--c-muted)">
        Drop a YouTube, Spotify or Netflix export and we&apos;ll put all of it together, still
        without your data ever leaving this tab.
      </p>
      <Link
        href="/start"
        className="mt-[8cqw] self-start rounded-full bg-(--c-ink) px-[6cqw] py-[3cqw] text-[4.6cqw] font-bold text-(--c-bg)"
      >
        Add another export →
      </Link>
    </CardBody>
  );
}
