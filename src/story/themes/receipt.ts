import type { ThemeTokens } from './tokens';

/**
 * Life, Wrapped's own brand (ADR-036): a printed receipt of your year. Paper,
 * ink and one red; extra-condensed capitals; stepped "printer" motion. The
 * combined deck and the app shell share it.
 */
export const receipt: ThemeTokens = {
  id: 'receipt',
  inspiredBy: 'Life, Wrapped (own brand)',
  bg: '#F3EFE6',
  // Receipt paper: every receipt is this colour, with `text` on it, on any backdrop.
  surface: '#FFFDF8',
  text: '#16130F',
  muted: '#5A534A',
  accent: '#FF3D12',
  onAccent: '#16130F',
  cta: '#16130F',
  onCta: '#F3EFE6',
  backdrops: [
    // Paper, ink and red. Red on paper clears 3:1, so it's only for display-size type.
    { bg: '#F3EFE6', ink: '#16130F', muted: '#5A534A', accent: '#FF3D12' },
    { bg: '#16130F', ink: '#F3EFE6', muted: '#BDB3A4', accent: '#FF3D12' },
    { bg: '#FF3D12', ink: '#16130F', muted: '#3F1205', accent: '#16130F' },
  ],
  font: {
    display: 'var(--font-archivo), "Arial Narrow", sans-serif',
    body: 'var(--font-plex-sans), system-ui, sans-serif',
    displayWeight: 900,
    displayTracking: '0',
    displayTransform: 'uppercase',
  },
  radius: { tile: '3px', frame: '14px', pill: '0px' },
  motion: { ease: 'power4.out', pop: 'back.out(2)', duration: 0.6, stagger: 0.07 },
  extraPairs: [
    { label: 'muted on receipt paper', fg: '#5A534A', bg: '#FFFDF8', kind: 'body' },
    // Platform colours fill shapes on the ink backdrop, always next to a label.
    { label: 'platform green on ink', fg: '#1ED760', bg: '#16130F', kind: 'large' },
    { label: 'platform red on ink', fg: '#FF3355', bg: '#16130F', kind: 'large' },
    { label: 'platform amber on ink', fg: '#FFB020', bg: '#16130F', kind: 'large' },
    { label: 'ink on platform green', fg: '#16130F', bg: '#1ED760', kind: 'large' },
    { label: 'ink on platform red', fg: '#16130F', bg: '#FF3355', kind: 'large' },
    { label: 'ink on platform amber', fg: '#16130F', bg: '#FFB020', kind: 'large' },
  ],
};

/**
 * Platform colours used by the Life deck (§9.4). Always paired with a label or
 * glyph; on paper they get an ink outline, because their contrast with paper is low.
 */
export const PLATFORM_COLORS = {
  spotify: '#1ED760',
  youtube: '#FF3355',
  netflix: '#FFB020',
} as const;
