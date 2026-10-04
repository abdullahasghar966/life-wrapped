import type { DeckId } from '@/engine/types';
import { DECK_THEME } from './themes';
import type { ThemeId } from './themes/tokens';

export interface DeckMeta {
  id: DeckId;
  /** Shown in the UI. Platform names are used only to describe which export a deck is about. */
  title: string;
  /** "your Spotify story" for "Next: …" links. */
  next: string;
  /** One or two words, for the list of stories around the player. */
  short: string;
  theme: ThemeId;
  tagline: string;
}

export const DECK_ORDER: DeckId[] = ['spotify', 'youtube', 'netflix', 'life'];

export const DECKS: Record<DeckId, DeckMeta> = {
  spotify: {
    id: 'spotify',
    title: 'Your Spotify story',
    next: 'your Spotify story',
    short: 'Spotify',
    theme: DECK_THEME.spotify,
    tagline: 'Minutes, top artists, repeats and streaks',
  },
  youtube: {
    id: 'youtube',
    title: 'Your YouTube story',
    next: 'your YouTube story',
    short: 'YouTube',
    theme: DECK_THEME.youtube,
    tagline: 'Channels, rabbit holes and late nights',
  },
  netflix: {
    id: 'netflix',
    title: 'Your Netflix story',
    next: 'your Netflix story',
    short: 'Netflix',
    theme: DECK_THEME.netflix,
    tagline: 'Hours, binges and favourite series',
  },
  life: {
    id: 'life',
    title: 'Your online life',
    next: 'your online life',
    short: 'Online life',
    theme: DECK_THEME.life,
    tagline: 'All of it together, and what it says about you',
  },
};

export function isDeckId(v: string): v is DeckId {
  return v === 'spotify' || v === 'youtube' || v === 'netflix' || v === 'life';
}
