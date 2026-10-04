import type { Platform } from '@/engine/insights/life/shared';
import { PLATFORM_COLORS } from '../themes';

export const PLATFORM_NAME: Record<Platform, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  netflix: 'Netflix',
};

export const platformColor = (p: Platform) => PLATFORM_COLORS[p];

/**
 * Generic glyphs (a note, a play triangle, a film frame), never the platforms'
 * logos. Colour always comes with a glyph or a label, never on its own.
 */
export function PlatformGlyph({ platform, className }: { platform: Platform; className?: string }) {
  const d =
    platform === 'spotify'
      ? 'M9 18V6l10-2v11 M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z M19 15a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z'
      : platform === 'youtube'
        ? 'M8 5.5v13l11-6.5Z'
        : 'M4 5h16v14H4Z M4 9h16 M4 15h16 M8 5v4 M12 5v4 M16 5v4 M8 15v4 M12 15v4 M16 15v4';
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d={d}
        fill={platform === 'youtube' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={platform === 'youtube' ? 0 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A colour swatch plus glyph plus name: the legend item used everywhere in the Life deck. */
export function PlatformTag({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[1.6cqw] ${className ?? ''}`}>
      <span
        className="inline-flex size-[5.4cqw] items-center justify-center rounded-full text-(--t-on-accent) ring-[0.4cqw] ring-(--c-ink)"
        style={{ background: platformColor(platform) }}
      >
        <PlatformGlyph platform={platform} className="size-[3.4cqw]" />
      </span>
      <span className="t-body font-semibold">{PLATFORM_NAME[platform]}</span>
    </span>
  );
}
