import type { ThemeTokens } from './tokens';

/**
 * YouTube-inspired: dark player UI, red accents, 16:9 frames, snappy UI motion.
 * Some cards are YouTube red or a deep "Recap" purple, so the deck isn't all grey.
 */
export const watch: ThemeTokens = {
  id: 'watch',
  inspiredBy: 'YouTube',
  bg: '#0F0F0F',
  surface: '#272727',
  text: '#F1F1F1',
  muted: '#AAAAAA',
  accent: '#FF0033',
  onAccent: '#FFFFFF',
  // A deeper red so small white text on it passes 4.5:1.
  cta: '#CC0029',
  onCta: '#FFFFFF',
  backdrops: [
    { bg: '#0F0F0F', ink: '#F1F1F1', muted: '#AAAAAA', accent: '#FF0033' },
    // YouTube red; the accent turns yellow, because red marks would vanish on it.
    { bg: '#B80024', ink: '#FFFFFF', muted: '#FFCAD4', accent: '#FFD400' },
    { bg: '#FFFFFF', ink: '#0F0F0F', muted: '#606060', accent: '#CC0029' },
    // A deep purple, like the colourful year-end recaps.
    { bg: '#3B1E8C', ink: '#FFFFFF', muted: '#CFC4FF', accent: '#FF4E6B' },
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
};
