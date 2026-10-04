import { LifeSummary } from './receipt/LifeSummary';
import { BingeSummary } from './binge/BingeSummary';
import { SoundSummary } from './sound/SoundSummary';
import type { CardDef } from './types';
import { WatchSummary } from './watch/WatchSummary';

/**
 * The closing card of each deck: the only cards that can be shared. Kept apart
 * from the full registry so the public /s/[id] page loads these four only.
 */
export const SUMMARY_CARDS: Record<
  'spotify.summary' | 'youtube.summary' | 'netflix.summary' | 'life.summary',
  CardDef & { backdrop: number }
> = {
  'spotify.summary': { Component: SoundSummary, backdrop: 5 },
  'youtube.summary': { Component: WatchSummary, backdrop: 0 },
  'netflix.summary': { Component: BingeSummary, backdrop: 0 },
  'life.summary': { Component: LifeSummary, backdrop: 0 },
};
