import type { CSSProperties } from 'react';

export type ThemeId = 'sound' | 'watch' | 'binge' | 'receipt';

/** A card background with the colours that are safe to put on it. */
export interface Backdrop {
  bg: string;
  ink: string;
  muted: string;
  /** Used for large text and shapes only. */
  accent: string;
}

export interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
  /** body = 4.5:1, large = 3:1 (WCAG AA). */
  kind: 'body' | 'large';
}

export interface ThemeTokens {
  id: ThemeId;
  /** Used in docs and dev tools only, never shown in the UI as a brand. */
  inspiredBy: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  /** Text colour that sits on a filled accent shape (large text and icons only). */
  onAccent: string;
  /** Filled call-to-action button with small text: must pass 4.5:1. */
  cta: string;
  onCta: string;
  /** Optional decorative gradient. */
  gradient?: string;
  backdrops: Backdrop[];
  font: {
    /** CSS font-family value; the variables come from next/font in src/lib/fonts.ts. */
    display: string;
    body: string;
    displayWeight: number;
    displayTracking: string;
    displayTransform: 'none' | 'uppercase';
  };
  radius: { tile: string; frame: string; pill: string };
  motion: {
    /** Entrance ease for most elements. */
    ease: string;
    /** Ease for pops / emphasis. */
    pop: string;
    duration: number;
    stagger: number;
  };
  /** Extra declared text/background pairs beyond the automatic ones. */
  extraPairs?: ContrastPair[];
}

/** Every text/background pair a theme declares, checked by tests/unit/themes.test.ts. */
export function contrastPairs(t: ThemeTokens): ContrastPair[] {
  const pairs: ContrastPair[] = [
    { label: 'text on bg', fg: t.text, bg: t.bg, kind: 'body' },
    { label: 'muted on bg', fg: t.muted, bg: t.bg, kind: 'body' },
    { label: 'text on surface', fg: t.text, bg: t.surface, kind: 'body' },
    { label: 'muted on surface', fg: t.muted, bg: t.surface, kind: 'body' },
    { label: 'accent on bg', fg: t.accent, bg: t.bg, kind: 'large' },
    { label: 'onAccent on accent', fg: t.onAccent, bg: t.accent, kind: 'large' },
    { label: 'onCta on cta', fg: t.onCta, bg: t.cta, kind: 'body' },
  ];
  t.backdrops.forEach((b, i) => {
    pairs.push({ label: `backdrop ${i} ink`, fg: b.ink, bg: b.bg, kind: 'body' });
    pairs.push({ label: `backdrop ${i} muted`, fg: b.muted, bg: b.bg, kind: 'body' });
    pairs.push({ label: `backdrop ${i} accent`, fg: b.accent, bg: b.bg, kind: 'large' });
  });
  return [...pairs, ...(t.extraPairs ?? [])];
}

/** CSS custom properties applied on the player root next to data-theme. */
export function themeStyle(t: ThemeTokens): CSSProperties {
  return {
    '--t-bg': t.bg,
    '--t-surface': t.surface,
    '--t-text': t.text,
    '--t-muted': t.muted,
    '--t-accent': t.accent,
    '--t-on-accent': t.onAccent,
    '--t-cta': t.cta,
    '--t-on-cta': t.onCta,
    '--t-gradient': t.gradient ?? t.accent,
    '--t-font-display': t.font.display,
    '--t-font-body': t.font.body,
    '--t-display-weight': String(t.font.displayWeight),
    '--t-display-tracking': t.font.displayTracking,
    '--t-display-transform': t.font.displayTransform,
    '--t-radius-tile': t.radius.tile,
    '--t-radius-frame': t.radius.frame,
    '--t-radius-pill': t.radius.pill,
  } as CSSProperties;
}

/** Variables for one card's backdrop; cards read colours only through these. */
export function backdropStyle(b: Backdrop): CSSProperties {
  return {
    '--c-bg': b.bg,
    '--c-ink': b.ink,
    '--c-muted': b.muted,
    '--c-accent': b.accent,
  } as CSSProperties;
}
