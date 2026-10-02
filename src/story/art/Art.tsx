import { useId, type CSSProperties } from 'react';
import { coverArt, posterArt, thumbArt, type ArtSpec } from './generatedArt';

function PatternLayer({ s, w, h }: { s: ArtSpec; w: number; h: number }) {
  const c = s.accent;
  switch (s.pattern) {
    case 'rings':
      return (
        <g fill="none" stroke={c} strokeWidth={w * 0.035} opacity={0.55}>
          {[0.18, 0.3, 0.42].map((r) => (
            <circle key={r} cx={w * 0.78} cy={h * 0.24} r={w * r} />
          ))}
        </g>
      );
    case 'stripes':
      return (
        <g transform={`rotate(${(s.angle % 90) - 45} ${w / 2} ${h / 2})`} opacity={0.35}>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={-w + i * (w / 2.5)} y={-h} width={w * 0.12} height={h * 3} fill={c} />
          ))}
        </g>
      );
    case 'grid':
      return (
        <g fill={c} opacity={0.45}>
          {Array.from({ length: 5 }, (_, i) =>
            Array.from({ length: 5 }, (__, j) => (
              <circle
                key={`${i}-${j}`}
                cx={(i + 0.5) * (w / 5)}
                cy={(j + 0.5) * (h / 5)}
                r={w * 0.025}
              />
            )),
          )}
        </g>
      );
    case 'blob':
      return (
        <path
          opacity={0.6}
          fill={c}
          d={`M${w * 0.55},${h * 0.05} C${w * 1.05},${h * 0.1} ${w * 1.0},${h * 0.62} ${w * 0.7},${h * 0.7} C${w * 0.42},${h * 0.78} ${w * 0.3},${h * 0.4} ${w * 0.55},${h * 0.05} Z`}
        />
      );
    case 'arcs':
      return (
        <g fill="none" stroke={c} strokeWidth={w * 0.06} strokeLinecap="round" opacity={0.5}>
          <path d={`M${-w * 0.1},${h * 0.9} A${w * 0.6},${w * 0.6} 0 0 1 ${w * 1.1},${h * 0.9}`} />
          <path
            d={`M${w * 0.15},${h * 0.9} A${w * 0.35},${w * 0.35} 0 0 1 ${w * 0.85},${h * 0.9}`}
          />
        </g>
      );
  }
}

/** Square "album cover" for the sound theme. */
export function Cover({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const s = coverArt(name);
  const id = useId();
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role="img"
      aria-label={`Generated cover for ${name}`}
    >
      <defs>
        <linearGradient id={`${id}g`} gradientTransform={`rotate(${s.angle} .5 .5)`}>
          <stop offset="0" stopColor={s.from} />
          <stop offset="1" stopColor={s.to} />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <rect width="100" height="100" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="100" height="100" fill={`url(#${id}g)`} />
        <PatternLayer s={s} w={100} h={100} />
        <text
          x="8"
          y="90"
          fill={s.ink}
          fontSize="34"
          fontWeight="900"
          letterSpacing="-2"
          style={{ fontFamily: 'var(--font-figtree), system-ui, sans-serif' }}
        >
          {s.initials}
        </text>
      </g>
    </svg>
  );
}

/** 16:9 "video thumbnail" with a fake progress bar and a count pill (watch theme). */
export function Thumbnail({
  name,
  label,
  progress = 0.6,
  initials = true,
  cover = false,
  className,
  style,
}: {
  name: string;
  label?: string;
  progress?: number;
  /** Show the big initials (off for purely decorative frames). */
  initials?: boolean;
  /** Fill any box like CSS object-fit: cover. */
  cover?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const s = thumbArt(name);
  const id = useId();
  return (
    <svg
      viewBox="0 0 160 90"
      preserveAspectRatio={cover ? 'xMidYMid slice' : undefined}
      className={className}
      style={style}
      role="img"
      aria-label={`Generated thumbnail for ${name}`}
    >
      <defs>
        <linearGradient id={`${id}g`} gradientTransform={`rotate(${s.angle} .5 .5)`}>
          <stop offset="0" stopColor={s.from} />
          <stop offset="1" stopColor={s.to} />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <rect width="160" height="90" rx="9" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="160" height="90" fill={`url(#${id}g)`} />
        <PatternLayer s={s} w={160} h={90} />
        {initials && (
          <text
            x="12"
            y="62"
            fill={s.ink}
            fontSize="40"
            fontWeight="800"
            style={{ fontFamily: 'var(--font-roboto-condensed), "Arial Narrow", sans-serif' }}
          >
            {s.initials}
          </text>
        )}
        {label && (
          <g>
            <rect
              x={160 - 8 - label.length * 6.2 - 8}
              y="62"
              width={label.length * 6.2 + 8}
              height="15"
              rx="4"
              fill="rgba(0,0,0,.8)"
            />
            <text
              x={160 - 12}
              y="73"
              textAnchor="end"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="500"
              style={{ fontFamily: 'var(--font-roboto), system-ui, sans-serif' }}
            >
              {label}
            </text>
          </g>
        )}
        <rect x="0" y="86.5" width="160" height="3.5" fill="rgba(255,255,255,.3)" />
        <rect x="0" y="86.5" width={160 * progress} height="3.5" fill="#FF0033" />
      </g>
    </svg>
  );
}

/** Round channel avatar with initials (watch theme). */
export function Avatar({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  const s = thumbArt(`${name}#avatar`);
  const id = useId();
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role="img"
      aria-label={`Generated avatar for ${name}`}
    >
      <defs>
        <linearGradient id={`${id}g`} gradientTransform={`rotate(${s.angle} .5 .5)`}>
          <stop offset="0" stopColor={s.to} />
          <stop offset="1" stopColor={s.accent} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#${id}g)`} />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="34"
        fontWeight="700"
        style={{ fontFamily: 'var(--font-roboto), system-ui, sans-serif' }}
      >
        {s.initials}
      </text>
    </svg>
  );
}

/** 2:3 "poster" with the title in Bebas Neue and a Series/Film tag (binge theme). */
export function Poster({
  title,
  tag,
  className,
  style,
}: {
  title: string;
  tag?: 'Series' | 'Film';
  className?: string;
  style?: CSSProperties;
}) {
  const s = posterArt(title);
  const id = useId();
  const words = title.toUpperCase().split(/\s+/);
  const lines: string[] = [];
  for (const w of words) {
    const last = lines.at(-1);
    if (last && (last + ' ' + w).length <= 11) lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  const shown = lines.slice(0, 4);
  return (
    <svg
      viewBox="0 0 100 150"
      className={className}
      style={style}
      role="img"
      aria-label={`Generated poster for ${title}`}
    >
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={s.to} />
          <stop offset="1" stopColor={s.from} />
        </linearGradient>
        <radialGradient id={`${id}r`} cx="0.7" cy="0.25" r="0.7">
          <stop offset="0" stopColor={s.accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={s.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="150" fill={`url(#${id}g)`} />
      <rect width="100" height="150" fill={`url(#${id}r)`} />
      {shown.map((line, i) => (
        <text
          key={i}
          x="8"
          y={150 - 14 - (shown.length - 1 - i) * 17}
          fill={s.ink}
          fontSize="18"
          letterSpacing="0.5"
          style={{ fontFamily: 'var(--font-bebas), Impact, sans-serif' }}
        >
          {line}
        </text>
      ))}
      {tag && (
        <g>
          <rect x="8" y="8" width={tag.length * 5.5 + 8} height="11" fill={s.accent} />
          <text
            x="12"
            y="16.5"
            fill="#FFFFFF"
            fontSize="8"
            fontWeight="700"
            letterSpacing="0.6"
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            {tag.toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}
