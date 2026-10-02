import type { ThemeTokens } from './tokens';

/** Life, Wrapped's own brand: deep indigo, aurora gradients, dreamy drifts. */
export const aurora: ThemeTokens = {
  id: 'aurora',
  inspiredBy: 'Life, Wrapped (own brand)',
  bg: '#0A0A1A',
  surface: '#14142B',
  text: '#F5F5FF',
  muted: '#A6A6C8',
  accent: '#22D3EE',
  onAccent: '#0A0A1A',
  cta: '#22D3EE',
  onCta: '#0A0A1A',
  gradient: 'linear-gradient(120deg, #7C5CFF 0%, #22D3EE 50%, #A3E635 100%)',
  backdrops: [
    { bg: '#0A0A1A', ink: '#F5F5FF', muted: '#A6A6C8', accent: '#22D3EE' },
    { bg: '#11112A', ink: '#F5F5FF', muted: '#A6A6C8', accent: '#A3E635' },
    { bg: '#160F33', ink: '#F5F5FF', muted: '#B4A9E8', accent: '#9F87FF' },
  ],
  font: {
    display: 'var(--font-space-grotesk), system-ui, sans-serif',
    body: 'var(--font-inter), system-ui, sans-serif',
    displayWeight: 700,
    displayTracking: '-0.03em',
    displayTransform: 'none',
  },
  radius: { tile: '20px', frame: '28px', pill: '999px' },
  motion: { ease: 'sine.inOut', pop: 'sine.out', duration: 1.2, stagger: 0.15 },
  extraPairs: [
    { label: 'platform green on bg', fg: '#1ED760', bg: '#0A0A1A', kind: 'large' },
    { label: 'platform red on bg', fg: '#FF3355', bg: '#0A0A1A', kind: 'large' },
    { label: 'platform amber on bg', fg: '#FFB020', bg: '#0A0A1A', kind: 'large' },
    { label: 'gradient start on bg', fg: '#7C5CFF', bg: '#0A0A1A', kind: 'large' },
    { label: 'gradient end on bg', fg: '#A3E635', bg: '#0A0A1A', kind: 'large' },
  ],
};

/** The three aurora glow colours (the stops of `gradient`). Decorative only. */
export const AURORA_GLOWS = ['#7C5CFF', '#22D3EE', '#A3E635'] as const;

/** Platform colours used by the Life deck. Always paired with a label or icon. */
export const PLATFORM_COLORS = {
  spotify: '#1ED760',
  youtube: '#FF3355',
  netflix: '#FFB020',
} as const;
