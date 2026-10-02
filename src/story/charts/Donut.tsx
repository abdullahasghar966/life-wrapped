import { arc, pie } from 'd3-shape';
import type { Platform } from '@/engine/insights/life/shared';
import { fmtPct } from '@/lib/format';
import { PLATFORM_NAME, platformColor } from './platform';

export interface DonutSlice {
  platform: Platform;
  share: number;
}

/**
 * A donut with direct labels on each slice (name + percentage), so colour is
 * never the only cue. Slices carry data-slice for the card timeline.
 */
export function Donut({
  slices,
  className,
  label,
}: {
  slices: DonutSlice[];
  className?: string;
  label: string;
}) {
  const size = 240;
  const r = size / 2;
  const inner = r * 0.56;
  const outer = r * 0.92;
  const arcs = pie<DonutSlice>()
    .value((d) => d.share)
    .sort(null)
    .padAngle(0.02)(slices);
  const shape = arc<(typeof arcs)[number]>().innerRadius(inner).outerRadius(outer).cornerRadius(4);
  const labelArc = arc<(typeof arcs)[number]>()
    .innerRadius(outer + 2)
    .outerRadius(outer + 2);
  return (
    // Wide side margins leave room for the outside labels on the left and right slices.
    <svg
      viewBox={`-84 -18 ${size + 168} ${size + 36}`}
      className={className}
      role="img"
      aria-label={label}
    >
      <g transform={`translate(${r} ${r})`}>
        {arcs.map((a) => (
          <path
            key={a.data.platform}
            data-slice
            d={shape(a) ?? ''}
            fill={platformColor(a.data.platform)}
          />
        ))}
        {arcs
          .filter((a) => a.data.share >= 0.04)
          .map((a) => {
            const [x, y] = labelArc.centroid(a);
            const mid = (a.startAngle + a.endAngle) / 2;
            const anchor = Math.sin(mid) >= 0 ? 'start' : 'end';
            return (
              <g key={`l-${a.data.platform}`} data-slice-label>
                <text
                  x={x * 1.06}
                  y={y * 1.06}
                  textAnchor={anchor}
                  fontSize="13"
                  fontWeight="700"
                  fill="var(--c-ink)"
                >
                  {PLATFORM_NAME[a.data.platform]}
                </text>
                <text
                  x={x * 1.06}
                  y={y * 1.06 + 15}
                  textAnchor={anchor}
                  fontSize="12"
                  fontWeight="500"
                  fill="var(--c-muted)"
                >
                  {fmtPct(a.data.share)}
                </text>
              </g>
            );
          })}
      </g>
    </svg>
  );
}
