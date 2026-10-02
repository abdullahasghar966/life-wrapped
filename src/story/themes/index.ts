import { aurora } from './aurora';
import { binge } from './binge';
import { sound } from './sound';
import type { ThemeId, ThemeTokens } from './tokens';
import { watch } from './watch';

export const THEMES: Record<ThemeId, ThemeTokens> = { sound, watch, binge, aurora };

export const DECK_THEME = {
  spotify: 'sound',
  youtube: 'watch',
  netflix: 'binge',
  life: 'aurora',
} as const satisfies Record<string, ThemeId>;

export { PLATFORM_COLORS } from './aurora';
export * from './tokens';
