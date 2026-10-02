'use client';
import { useId, useState } from 'react';

/**
 * An ⓘ button that reveals a short explanation (used wherever a number is an
 * estimate). The text is real DOM text, so screen readers and the PNG export
 * both get it when it's open.
 */
export function InfoTip({ label, children }: { label: string; children: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-[6.4cqw] items-center justify-center rounded-full border-[0.4cqw] border-(--c-muted) text-[3.6cqw] leading-none font-bold text-(--c-muted) hover:border-(--c-ink) hover:text-(--c-ink) focus-visible:outline-2 focus-visible:outline-(--c-ink)"
      >
        i
      </button>
      <span
        id={id}
        role="note"
        hidden={!open}
        className="t-body absolute top-[8cqw] left-0 z-30 w-[64cqw] rounded-(--t-radius-tile) bg-(--c-ink) p-[3.4cqw] text-[3.6cqw] leading-snug font-medium text-(--c-bg) shadow-xl"
      >
        {children}
      </span>
    </span>
  );
}
