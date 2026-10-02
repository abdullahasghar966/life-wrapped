import { scaleLinear } from 'd3-scale';
import { fmtHour } from '@/lib/format';

/**
 * A 24-hour radial clock: one bar per local hour, growing outwards like an
 * equaliser. Midnight is at the top. Bars carry data-bar for the card timeline.
 */
export function RadialClock({
  hours,
  peakHour,
  className,
  label,
}: {
  hours: number[];
  peakHour: number;
  className?: string;
  label: string;
}) {
  const size = 200;
  const c = size / 2;
  const inner = 34;
  const outer = 94;
  const max = Math.max(1, ...hours);
  const len = scaleLinear()
    .domain([0, max])
    .range([3, outer - inner]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label={label}>
      <circle
        cx={c}
        cy={c}
        r={inner - 6}
        fill="none"
        stroke="var(--c-ink)"
        strokeOpacity={0.25}
        strokeWidth={1.5}
      />
      {hours.map((v, h) => {
        const angle = (h / 24) * 360;
        const l = len(v);
        const peak = h === peakHour;
        return (
          <g key={h} transform={`rotate(${angle} ${c} ${c})`}>
            <rect
              data-bar
              x={c - 3.2}
              y={c - inner - l}
              width={6.4}
              height={l}
              rx={3.2}
              fill={peak ? 'var(--c-accent)' : 'var(--c-ink)'}
              opacity={peak ? 1 : 0.85}
            />
          </g>
        );
      })}
      {[0, 6, 12, 18].map((h) => {
        const a = ((h / 24) * 2 - 0.5) * Math.PI;
        const r = inner - 15;
        return (
          <text
            key={h}
            x={c + Math.cos(a) * r}
            y={c + Math.sin(a) * r + 3}
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="700"
            fill="var(--c-ink)"
            opacity={0.8}
          >
            {fmtHour(h).replace(' ', '')}
          </text>
        );
      })}
    </svg>
  );
}
