/**
 * Deterministic artwork from a name (ADR-005). Exports contain no images, and
 * fetching real covers would leak listening history, so every cover, thumbnail,
 * poster and avatar is generated: hash → palette + pattern + initials.
 * The same name always produces the same art, everywhere in the app.
 */

export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A small PRNG seeded by the name, so one name gives a stable sequence of choices. */
export function nameRandom(name: string): () => number {
  let a = hashString(name) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initials(name: string): string {
  const words = name
    .replace(/^(the|a|an)\s+/i, '')
    .split(/[\s&\-–—:,.]+/)
    .filter((w) => /\p{L}|\p{N}/u.test(w));
  const letters = words
    .slice(0, 2)
    .map((w) => Array.from(w.replace(/[^\p{L}\p{N}]/gu, ''))[0] ?? '');
  return letters.join('').toUpperCase() || '♪';
}

export type Pattern = 'rings' | 'stripes' | 'grid' | 'blob' | 'arcs';
const PATTERNS: Pattern[] = ['rings', 'stripes', 'grid', 'blob', 'arcs'];

export interface ArtSpec {
  from: string;
  to: string;
  accent: string;
  ink: string;
  pattern: Pattern;
  angle: number;
  initials: string;
}

/** Bright duotones for square music covers. */
const COVER_PALETTES: Array<[string, string, string, string]> = [
  ['#C6F432', '#1ED760', '#121212', '#121212'],
  ['#FF6FB5', '#FF9F1C', '#121212', '#121212'],
  ['#3D5AFE', '#7C4DFF', '#C6F432', '#FFFFFF'],
  ['#FF6B35', '#FFD23F', '#121212', '#121212'],
  ['#0E3B2B', '#1ED760', '#C6F432', '#FFFFFF'],
  ['#9B5DE5', '#F15BB5', '#FEE440', '#FFFFFF'],
  ['#00BBF9', '#00F5D4', '#121212', '#121212'],
  ['#2B2D42', '#EF233C', '#EDF2F4', '#FFFFFF'],
];

/** Dark, saturated gradients for 16:9 thumbnails and round avatars. */
const THUMB_PALETTES: Array<[string, string, string, string]> = [
  ['#1A1A2E', '#3A0CA3', '#FF0033', '#FFFFFF'],
  ['#0F2027', '#2C5364', '#FFB703', '#FFFFFF'],
  ['#232526', '#414345', '#FF4E6B', '#FFFFFF'],
  ['#141E30', '#243B55', '#4CC9F0', '#FFFFFF'],
  ['#2D0B00', '#8E2C00', '#FFD166', '#FFFFFF'],
  ['#0B3D2E', '#14746F', '#B7E4C7', '#FFFFFF'],
  ['#3C1053', '#AD5389', '#FFE5EC', '#FFFFFF'],
  ['#1F1C2C', '#928DAB', '#FFFFFF', '#FFFFFF'],
];

/** Moody cinema gradients for 2:3 posters. */
const POSTER_PALETTES: Array<[string, string, string, string]> = [
  ['#140405', '#5C0A10', '#E50914', '#F5F5F1'],
  ['#05080F', '#1B2A49', '#E50914', '#F5F5F1'],
  ['#0B0B0B', '#3A2E1F', '#FFB020', '#F5F5F1'],
  ['#070B0A', '#1D3B33', '#E50914', '#F5F5F1'],
  ['#0D0614', '#3B1C4A', '#FF3B44', '#F5F5F1'],
  ['#100C08', '#4A2511', '#F2A541', '#F5F5F1'],
];

function spec(name: string, palettes: Array<[string, string, string, string]>): ArtSpec {
  const r = nameRandom(name);
  const [from, to, accent, ink] = palettes[Math.floor(r() * palettes.length)]!;
  return {
    from,
    to,
    accent,
    ink,
    pattern: PATTERNS[Math.floor(r() * PATTERNS.length)]!,
    angle: Math.floor(r() * 360),
    initials: initials(name),
  };
}

export const coverArt = (name: string) => spec(name, COVER_PALETTES);
export const thumbArt = (name: string) => spec(name, THUMB_PALETTES);
export const posterArt = (name: string) => spec(name, POSTER_PALETTES);
