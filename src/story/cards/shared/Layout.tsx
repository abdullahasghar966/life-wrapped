import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The content area of a card, clear of the progress chrome on top and actions below.
 * The player raises `--card-pb` on a deck's last card, where the actions wrap onto a
 * second row; exports and the shared page keep the default.
 */
export const CardBody = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string; style?: CSSProperties }
>(function CardBody({ children, className, style }, ref) {
  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        'absolute inset-0 flex flex-col px-[7cqw] pt-[24cqw] pb-[var(--card-pb,19cqw)]',
        className,
      )}
    >
      {children}
    </div>
  );
});

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      data-eyebrow
      className={`t-body text-[3.6cqw] font-bold tracking-[0.12em] text-(--c-muted) uppercase ${className ?? ''}`}
    >
      {children}
    </p>
  );
}

/** A tilted sticker pill (sound theme). */
export function Sticker({
  children,
  tilt = -6,
  filled,
  className,
}: {
  children: ReactNode;
  tilt?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      data-sticker
      style={{ rotate: `${tilt}deg` }}
      className={`t-body inline-flex items-center gap-[1.5cqw] rounded-full border-[0.6cqw] border-(--c-ink) px-[3.6cqw] py-[1.4cqw] text-[3.8cqw] font-extrabold whitespace-nowrap ${
        filled ? 'bg-(--c-ink) text-(--c-bg)' : 'text-(--c-ink)'
      } ${className ?? ''}`}
    >
      {children}
    </span>
  );
}
