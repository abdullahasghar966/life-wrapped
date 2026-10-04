import type { Platform } from '@/engine/insights/life/shared';
import { fmtHour } from '@/lib/format';
import { PLATFORM_NAME, platformColor } from './platform';

const LANES: Platform[] = ['spotify', 'youtube', 'netflix'];

/**
 * One day on a 24-hour axis, one lane per platform, with a block for each
 * stretch of activity. Lanes are labelled by name. Segments carry data-segment.
 */
export function DayTimeline({
  segments,
  platforms,
  className,
  label,
}: {
  segments: Array<{ platform: Platform; start: number; end: number }>;
  platforms: Platform[];
  className?: string;
  label: string;
}) {
  const lanes = LANES.filter((p) => platforms.includes(p));
  const w = 320;
  const left = 62;
  const laneH = 26;
  const gap = 10;
  const top = 4;
  const h = top + lanes.length * (laneH + gap) + 16;
  const x = (min: number) => left + (Math.min(1440, Math.max(0, min)) / 1440) * (w - left - 4);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} role="img" aria-label={label}>
      {lanes.map((p, i) => {
        const y = top + i * (laneH + gap);
        return (
          <g key={p}>
            <text x={0} y={y + laneH / 2 + 4} fontSize="11" fontWeight="700" fill="var(--c-ink)">
              {PLATFORM_NAME[p]}
            </text>
            <rect
              x={left}
              y={y}
              width={w - left - 4}
              height={laneH}
              rx={6}
              fill="var(--c-ink)"
              fillOpacity={0.08}
            />
            {segments
              .filter((s) => s.platform === p && s.end > s.start)
              .map((s, j) => (
                <rect
                  key={j}
                  data-segment
                  x={x(s.start)}
                  y={y + 3}
                  width={Math.max(2, x(s.end) - x(s.start))}
                  height={laneH - 6}
                  rx={2}
                  fill={platformColor(p)}
                  stroke="var(--c-ink)"
                  strokeWidth={1.2}
                />
              ))}
          </g>
        );
      })}
      {[0, 6, 12, 18, 24].map((hr) => (
        <text
          key={hr}
          x={left + (hr / 24) * (w - left - 4)}
          y={h - 2}
          textAnchor={hr === 0 ? 'start' : hr === 24 ? 'end' : 'middle'}
          fontSize="10"
          fontWeight="600"
          fill="var(--c-muted)"
        >
          {fmtHour(hr % 24).replace(' ', '')}
        </text>
      ))}
    </svg>
  );
}
