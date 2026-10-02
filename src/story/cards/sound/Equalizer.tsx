/** A row of rounded equaliser bars; cards animate [data-eq-bar] to the beat. */
export function Equalizer({
  bars = 5,
  className,
  barClassName = 'bg-(--c-ink)',
  heights = [0.55, 0.9, 0.7, 1, 0.45, 0.8, 0.6],
}: {
  bars?: number;
  className?: string;
  barClassName?: string;
  heights?: number[];
}) {
  return (
    <div aria-hidden className={`flex items-end gap-[1.2cqw] ${className ?? ''}`}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          data-eq-bar
          className={`block w-[2.2cqw] origin-bottom rounded-full ${barClassName}`}
          style={{ height: `${(heights[i % heights.length] ?? 1) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** 120 BPM = one beat every 500 ms (§10.2). */
export const BEAT = 0.5;
