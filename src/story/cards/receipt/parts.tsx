import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A paper receipt on a card: receipt paper (`--t-surface`) and receipt ink
 * (`--t-text`) whatever the backdrop, monospaced, with a torn bottom edge.
 * Children marked data-line print one by one (see printLines).
 */
export function ReceiptPaper({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn('relative font-mono text-(--t-text)', className)}>
      <div className={cn('bg-(--t-surface) px-[5cqw] pt-[4.5cqw] pb-[3cqw]', innerClassName)}>
        {children}
      </div>
      <TornEdge />
    </div>
  );
}

export function TornEdge({ className }: { className?: string }) {
  const teeth = 18;
  const w = 100 / teeth;
  const d = Array.from({ length: teeth }, (_, i) => `L${i * w + w / 2} 5 L${(i + 1) * w} 0`).join(
    ' ',
  );
  return (
    <svg
      viewBox="0 0 100 5"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('block h-[2.2cqw] w-full', className)}
    >
      <path d={`M0 0 ${d} Z`} fill="var(--t-surface)" />
    </svg>
  );
}

/** label ............ value */
export function Line({
  label,
  value,
  strong,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div
      data-line
      className={cn('flex items-baseline gap-[2cqw] uppercase', strong && 'font-medium', className)}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="mb-[0.9cqw] min-w-[3cqw] flex-1 border-b border-dotted border-current/45"
      />
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

export function Rule({ className }: { className?: string }) {
  return (
    <div
      data-line
      aria-hidden
      className={cn('my-[2cqw] border-t border-dashed border-current/50', className)}
    />
  );
}

/** Decorative barcode in the current text colour; bar widths come from the text. */
export function Barcode({ text, className }: { text: string; className?: string }) {
  const bars = Array.from(text.toUpperCase()).flatMap((ch) => {
    const c = ch.charCodeAt(0);
    return [1 + (c % 3), 1 + ((c >> 2) % 2)];
  });
  return (
    <div
      data-line
      aria-hidden
      className={cn('flex items-stretch justify-center gap-[0.5cqw]', className)}
    >
      {bars.map((w, i) => (
        <span
          key={i}
          className={i % 2 === 0 ? 'bg-current' : ''}
          style={{ width: `${w * 0.55}cqw` }}
        />
      ))}
    </div>
  );
}

/** The slot a receipt prints out of. */
export function PrinterSlot({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('relative z-10 h-[3.2cqw] rounded-[1.6cqw] bg-(--c-ink)', className)}
    />
  );
}

/**
 * A rubber stamp: two rings, text around the edge and a centre. Drawn in the
 * current colour so it works on any backdrop.
 */
export function Stamp({
  ring,
  children,
  className,
}: {
  ring: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative aspect-square', className)}>
      <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 size-full">
        <defs>
          <path id="stamp-ring" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="6" />
        <circle cx="100" cy="100" r="58" fill="none" stroke="currentColor" strokeWidth="3" />
        <text
          fill="currentColor"
          fontSize="17"
          fontWeight="600"
          letterSpacing="3.5"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <textPath href="#stamp-ring" startOffset="0">
            {ring}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-[24%] flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
