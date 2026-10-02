import { scaleLinear } from 'd3-scale';
import { fmtHour } from '@/lib/format';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
/** Monday-first columns. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * A 7 × 24 heatmap shaped for a portrait card: one column per weekday, one row
 * per hour (midnight at the top), each cell a small rounded "thumbnail". Opacity
 * encodes the count; the busiest cell gets an outline.
 */
export function Heatmap({
  grid,
  peakDow,
  peakHour,
  className,
  label,
}: {
  grid: number[][];
  peakDow: number;
  peakHour: number;
  className?: string;
  label: string;
}) {
  const max = Math.max(1, ...grid.flat());
  const alpha = scaleLinear().domain([0, max]).range([0.07, 1]);
  const left = 26;
  const top = 12;
  const cw = 30;
  const ch = 8.4;
  const gx = 4;
  const gy = 2;
  const width = left + 7 * (cw + gx);
  const height = top + 24 * (ch + gy);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={label}>
      {ORDER.map((dow, col) => (
        <text
          key={`d${col}`}
          x={left + col * (cw + gx) + cw / 2}
          y={8}
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="var(--c-muted)"
        >
          {DAYS[dow]}
        </text>
      ))}
      {[0, 6, 12, 18].map((h) => (
        <text
          key={`h${h}`}
          x={left - 4}
          y={top + h * (ch + gy) + ch - 1}
          textAnchor="end"
          fontSize="7"
          fontWeight="700"
          fill="var(--c-muted)"
        >
          {fmtHour(h).replace(' ', '')}
        </text>
      ))}
      {ORDER.map((dow, col) =>
        (grid[dow] ?? []).map((v, h) => {
          const peak = dow === peakDow && h === peakHour;
          return (
            <rect
              key={`${dow}-${h}`}
              data-cell
              x={left + col * (cw + gx)}
              y={top + h * (ch + gy)}
              width={cw}
              height={ch}
              rx={2.4}
              fill="var(--c-accent)"
              fillOpacity={alpha(v)}
              stroke={peak ? 'var(--c-ink)' : 'none'}
              strokeWidth={peak ? 1.6 : 0}
            />
          );
        }),
      )}
    </svg>
  );
}
