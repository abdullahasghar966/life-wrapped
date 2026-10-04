import { binge } from './binge';
import { receipt } from './receipt';
import { sound } from './sound';
import type { ThemeId, ThemeTokens } from './tokens';
import { watch } from './watch';

export const THEMES: Record<ThemeId, ThemeTokens> = { sound, watch, binge, receipt };

export const DECK_THEME = {
  spotify: 'sound',
  youtube: 'watch',
  netflix: 'binge',
  life: 'receipt',
} as const satisfies Record<string, ThemeId>;

export { PLATFORM_COLORS } from './receipt';
export * from './tokens';
