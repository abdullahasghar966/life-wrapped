import type { ReactNode } from 'react';

/**
 * Joins class names. Not `cn`: the header is part of the client error boundary,
 * which ships with every page, and tailwind-merge would add ~9 KB to each.
 */
const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(' ');

/** The logo: a tiny receipt. Ink by default; it takes the text colour. */
export function ReceiptGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 24" aria-hidden className={cx('shrink-0', className)}>
      <path d="M2 1h16v21l-2.67-1.6L12.67 22 10 20.4 7.33 22l-2.66-1.6L2 22z" fill="currentColor" />
      <path
        d="M5.5 6.5h9M5.5 10h9M5.5 13.5h5"
        stroke="var(--color-paper)"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 whitespace-nowrap sm:gap-2.5', className)}>
      <ReceiptGlyph className="h-6 w-5" />
      <span className="font-display text-[1.3rem] leading-none tracking-[0.01em] uppercase sm:text-[1.45rem]">
        Life, Wrapped
      </span>
    </span>
  );
}

/** A torn-off receipt edge, drawn under a block of the same colour (set via text colour). */
export function TornEdge({ className, teeth = 22 }: { className?: string; teeth?: number }) {
  const w = 100 / teeth;
  const d = Array.from({ length: teeth }, (_, i) => `L${i * w + w / 2} 6 L${(i + 1) * w} 0`).join(
    ' ',
  );
  return (
    <svg
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      aria-hidden
      className={cx('block w-full', className)}
    >
      <path d={`M0 0 ${d} Z`} fill="currentColor" />
    </svg>
  );
}

/** Decorative barcode; the bar widths come from the text, so it never changes. */
export function Barcode({ text, className }: { text: string; className?: string }) {
  const bars = Array.from(text.toUpperCase()).flatMap((ch) => {
    const c = ch.charCodeAt(0);
    return [1 + (c % 3), 1 + ((c >> 2) % 2)];
  });
  return (
    <div aria-hidden className={cx('flex items-stretch gap-[2px]', className)}>
      {bars.map((w, i) =>
        i % 2 === 0 ? (
          <span key={i} className="bg-ink" style={{ width: w * 2 }} />
        ) : (
          <span key={i} style={{ width: w }} />
        ),
      )}
    </div>
  );
}

/** A dashed rule, as printed between the sections of a receipt. */
export function Dashed({ className = 'my-2' }: { className?: string }) {
  return <div aria-hidden className={cx('border-ink/40 border-t border-dashed', className)} />;
}

/** A row with a dotted leader between label and value, as on a receipt. */
export function LeaderRow({
  label,
  value,
  strong,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className={cx('flex items-baseline gap-2', strong && 'font-medium')}>
      <span className="uppercase">{label}</span>
      <span aria-hidden className="border-ink/40 mb-1 min-w-4 flex-1 border-b border-dotted" />
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
