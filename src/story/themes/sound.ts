import type { ThemeTokens } from './tokens';

/** Spotify-inspired: bold duotones, chunky geometric type, bouncy motion. */
export const sound: ThemeTokens = {
  id: 'sound',
  inspiredBy: 'Spotify',
  bg: '#121212',
  surface: '#1F1F1F',
  text: '#FFFFFF',
  muted: '#B3B3B3',
  accent: '#1ED760',
  onAccent: '#121212',
  backdrops: [
    { bg: '#C6F432', ink: '#121212', muted: '#2B3A06', accent: '#121212' },
    { bg: '#FF6FB5', ink: '#121212', muted: '#3A0D23', accent: '#121212' },
    { bg: '#3D5AFE', ink: '#FFFFFF', muted: '#F4F6FF', accent: '#C6F432' },
    { bg: '#FF6B35', ink: '#121212', muted: '#3A1405', accent: '#121212' },
    { bg: '#0E3B2B', ink: '#FFFFFF', muted: '#B9E8D2', accent: '#1ED760' },
    { bg: '#121212', ink: '#FFFFFF', muted: '#B3B3B3', accent: '#1ED760' },
  ],
  font: {
    display: 'var(--font-figtree), system-ui, sans-serif',
    body: 'var(--font-figtree), system-ui, sans-serif',
    displayWeight: 900,
    displayTracking: '-0.04em',
    displayTransform: 'none',
  },
  radius: { tile: '8px', frame: '16px', pill: '999px' },
  motion: { ease: 'back.out(1.7)', pop: 'elastic.out(1, 0.5)', duration: 0.6, stagger: 0.08 },
};
