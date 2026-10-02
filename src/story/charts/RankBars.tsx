import type { ReactNode } from 'react';

export interface RankBar {
  label: string;
  /** 0..1 of the row's track. */
  share: number;
  value: ReactNode;
  /** CSS colour for the bar; defaults to the card accent. */
  color?: string;
}

/**
 * Horizontal proportional bars with direct labels (never colour alone). Bars
 * carry data-rank-bar so card timelines can grow them with scaleX.
 */
export function RankBars({ rows, className }: { rows: RankBar[]; className?: string }) {
  return (
    <ul className={`flex flex-col gap-[4cqw] ${className ?? ''}`}>
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-[3cqw]">
            <span className="text-[4.6cqw] font-bold">{r.label}</span>
            <span className="text-[4cqw] font-semibold text-(--c-muted)">{r.value}</span>
          </div>
          <div className="mt-[1.6cqw] h-[3cqw] overflow-hidden bg-(--c-ink)/15">
            <div
              data-rank-bar
              className="h-full origin-left"
              style={{
                transform: `scaleX(${Math.max(0.005, Math.min(1, r.share))})`,
                background: r.color ?? 'var(--c-accent)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
