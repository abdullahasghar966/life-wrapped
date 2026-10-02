import { SoundClock } from './sound/SoundClock';
import { SoundDiscovery } from './sound/SoundDiscovery';
import { SoundMinutes } from './sound/SoundMinutes';
import { SoundOnRepeat } from './sound/SoundOnRepeat';
import { SoundOpener } from './sound/SoundOpener';
import { SoundPodcasts } from './sound/SoundPodcasts';
import { SoundSkips } from './sound/SoundSkips';
import { SoundStreak } from './sound/SoundStreak';
import { SoundSummary } from './sound/SoundSummary';
import { SoundTopArtist } from './sound/SoundTopArtist';
import { SoundTopArtists } from './sound/SoundTopArtists';
import { SoundTopTracks } from './sound/SoundTopTracks';
import type { CardDef } from './types';

/**
 * Insight id → card component. Backdrop indices refer to the theme's backdrop
 * list (sound: 0 lime, 1 pink, 2 blue, 3 orange, 4 deep green, 5 near-black).
 */
export const CARDS: Record<string, CardDef> = {
  'spotify.opener': { Component: SoundOpener, backdrop: 0 },
  'spotify.minutes': { Component: SoundMinutes, backdrop: 1 },
  'spotify.topArtist': { Component: SoundTopArtist, backdrop: 2 },
  'spotify.topArtists': { Component: SoundTopArtists, backdrop: 3 },
  'spotify.topTracks': { Component: SoundTopTracks, backdrop: 5 },
  'spotify.onRepeat': { Component: SoundOnRepeat, backdrop: 0 },
  'spotify.clock': { Component: SoundClock, backdrop: 4 },
  'spotify.skips': { Component: SoundSkips, backdrop: 1 },
  'spotify.discovery': { Component: SoundDiscovery, backdrop: 2 },
  'spotify.streak': { Component: SoundStreak, backdrop: 3 },
  'spotify.podcasts': { Component: SoundPodcasts, backdrop: 4 },
  'spotify.summary': { Component: SoundSummary, backdrop: 5 },
};
