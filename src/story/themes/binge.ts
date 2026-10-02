import type { ThemeTokens } from './tokens';

/** Netflix-inspired: black, red glows, condensed all-caps titles, cinematic motion. */
export const binge: ThemeTokens = {
  id: 'binge',
  inspiredBy: 'Netflix',
  bg: '#000000',
  surface: '#181818',
  text: '#FFFFFF',
  muted: '#B3B3B3',
  // Large text and shapes only: its contrast on black is under 4.5:1.
  accent: '#E50914',
  onAccent: '#FFFFFF',
  backdrops: [
    { bg: '#000000', ink: '#FFFFFF', muted: '#B3B3B3', accent: '#E50914' },
    { bg: '#141414', ink: '#FFFFFF', muted: '#B3B3B3', accent: '#E50914' },
    { bg: '#0B0B0B', ink: '#F5F5F1', muted: '#A9A9A9', accent: '#FF3B44' },
  ],
  font: {
    display: 'var(--font-bebas), Impact, sans-serif',
    body: 'var(--font-inter), system-ui, sans-serif',
    displayWeight: 400,
    displayTracking: '0.02em',
    displayTransform: 'uppercase',
  },
  radius: { tile: '2px', frame: '4px', pill: '2px' },
  motion: { ease: 'expo.out', pop: 'expo.out', duration: 1, stagger: 0.12 },
};
