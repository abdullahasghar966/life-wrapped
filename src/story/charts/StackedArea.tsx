import { scaleLinear } from 'd3-scale';
import { area, curveMonotoneX, stack } from 'd3-shape';
import type { PerPlatform, Platform } from '@/engine/insights/life/shared';
import { fmtHour } from '@/lib/format';
import { platformColor } from './platform';

const KEYS: Platform[] = ['spotify', 'youtube', 'netflix'];

/**
 * Hours per local hour of the day, stacked by platform. Bands get data-band; a
 * card-coloured cover with data-wipe lets the timeline sweep the chart in.
 */
export function StackedArea({
  hours,
  platforms,
  className,
  label,
}: {
  hours: Array<{ hour: number } & PerPlatform>;
  platforms: Platform[];
  className?: string;
  label: string;
}) {
  const w = 320;
  const h = 170;
  const pad = { l: 4, r: 4, t: 8, b: 20 };
  const keys = KEYS.filter((k) => platforms.includes(k));
  const series = stack<{ hour: number } & PerPlatform, Platform>().keys(keys)(hours);
  const max = Math.max(1, ...series.flatMap((s) => s.map((d) => d[1])));
  const x = scaleLinear()
    .domain([0, 23])
    .range([pad.l, w - pad.r]);
  const y = scaleLinear()
    .domain([0, max])
    .range([h - pad.b, pad.t]);
  const shape = area<[number, number] & { data: { hour: number } }>()
    .x((d) => x(d.data.hour))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(curveMonotoneX);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={label}>
      {series.map((s) => (
        <path
          key={s.key}
          data-band
          d={shape(s as unknown as Array<[number, number] & { data: { hour: number } }>) ?? ''}
          fill={platformColor(s.key)}
          fillOpacity={0.85}
        />
      ))}
      <line
        x1={pad.l}
        x2={w - pad.r}
        y1={h - pad.b}
        y2={h - pad.b}
        stroke="var(--c-muted)"
        strokeOpacity={0.5}
      />
      {[0, 6, 12, 18, 23].map((hr) => (
        <text
          key={hr}
          x={x(hr)}
          y={h - 5}
          textAnchor={hr === 0 ? 'start' : hr === 23 ? 'end' : 'middle'}
          fontSize="10"
          fontWeight="600"
          fill="var(--c-muted)"
        >
          {hr === 23 ? '11PM' : fmtHour(hr).replace(' ', '')}
        </text>
      ))}
      <rect
        data-wipe
        x={0}
        y={0}
        width={w}
        height={h - pad.b}
        fill="var(--c-bg)"
        transform="scale(0 1)"
      />
    </svg>
  );
}
