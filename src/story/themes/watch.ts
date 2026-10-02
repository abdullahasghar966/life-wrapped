import type { ThemeTokens } from './tokens';

/** YouTube-inspired: dark player UI, red accents, 16:9 frames, snappy UI motion. */
export const watch: ThemeTokens = {
  id: 'watch',
  inspiredBy: 'YouTube',
  bg: '#0F0F0F',
  surface: '#272727',
  text: '#F1F1F1',
  muted: '#AAAAAA',
  accent: '#FF0033',
  onAccent: '#FFFFFF',
  backdrops: [
    { bg: '#0F0F0F', ink: '#F1F1F1', muted: '#AAAAAA', accent: '#FF0033' },
    { bg: '#181818', ink: '#F1F1F1', muted: '#AAAAAA', accent: '#FF0033' },
    { bg: '#FFFFFF', ink: '#0F0F0F', muted: '#606060', accent: '#CC0029' },
    { bg: '#212121', ink: '#F1F1F1', muted: '#AAAAAA', accent: '#FF4E6B' },
  ],
  font: {
    display: 'var(--font-roboto-condensed), "Arial Narrow", sans-serif',
    body: 'var(--font-roboto), system-ui, sans-serif',
    displayWeight: 800,
    displayTracking: '-0.01em',
    displayTransform: 'none',
  },
  radius: { tile: '12px', frame: '12px', pill: '999px' },
  motion: { ease: 'power3.out', pop: 'power3.out', duration: 0.35, stagger: 0.06 },
  extraPairs: [{ label: 'white on red pill', fg: '#FFFFFF', bg: '#CC0029', kind: 'body' }],
};
