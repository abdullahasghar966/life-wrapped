import { BingeCountries } from './binge/BingeCountries';
import { BingeDevices } from './binge/BingeDevices';
import { BingeHours } from './binge/BingeHours';
import { BingeLateNight } from './binge/BingeLateNight';
import { BingeOpener } from './binge/BingeOpener';
import { BingeRecord } from './binge/BingeRecord';
import { BingeSplit } from './binge/BingeSplit';
import { BingeSummary } from './binge/BingeSummary';
import { BingeTopSeries } from './binge/BingeTopSeries';
import { BingeTopTitles } from './binge/BingeTopTitles';
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
import { WatchMusic } from './watch/WatchMusic';
import { WatchNightOwl } from './watch/WatchNightOwl';
import { WatchOpener } from './watch/WatchOpener';
import { WatchRabbitHole } from './watch/WatchRabbitHole';
import { WatchRewatched } from './watch/WatchRewatched';
import { WatchSearches } from './watch/WatchSearches';
import { WatchSummary } from './watch/WatchSummary';
import { WatchTopChannel } from './watch/WatchTopChannel';
import { WatchTopChannels } from './watch/WatchTopChannels';
import { WatchTotal } from './watch/WatchTotal';
import { WatchWeekly } from './watch/WatchWeekly';

/**
 * Insight id → card component. Backdrop indices refer to the theme's backdrop list:
 * - sound: 0 lime, 1 pink, 2 blue, 3 orange, 4 deep green, 5 near-black
 * - watch: 0 player black, 1 dark grey, 2 white "page", 3 raised grey
 * - binge: 0 black, 1 near-black, 2 deep black with a brighter red
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

  'youtube.opener': { Component: WatchOpener, backdrop: 0 },
  'youtube.total': { Component: WatchTotal, backdrop: 1 },
  'youtube.topChannel': { Component: WatchTopChannel, backdrop: 0 },
  'youtube.topChannels': { Component: WatchTopChannels, backdrop: 3 },
  'youtube.rabbitHole': { Component: WatchRabbitHole, backdrop: 0 },
  'youtube.rewatched': { Component: WatchRewatched, backdrop: 1 },
  'youtube.nightOwl': { Component: WatchNightOwl, backdrop: 0 },
  'youtube.weekly': { Component: WatchWeekly, backdrop: 3 },
  'youtube.searches': { Component: WatchSearches, backdrop: 2 },
  'youtube.music': { Component: WatchMusic, backdrop: 1 },
  'youtube.summary': { Component: WatchSummary, backdrop: 0 },

  'netflix.opener': { Component: BingeOpener, backdrop: 0 },
  'netflix.hours': { Component: BingeHours, backdrop: 0 },
  'netflix.topSeries': { Component: BingeTopSeries, backdrop: 1 },
  'netflix.topTitles': { Component: BingeTopTitles, backdrop: 0 },
  'netflix.binge': { Component: BingeRecord, backdrop: 2 },
  'netflix.split': { Component: BingeSplit, backdrop: 1 },
  'netflix.lateNight': { Component: BingeLateNight, backdrop: 0 },
  'netflix.devices': { Component: BingeDevices, backdrop: 1 },
  'netflix.countries': { Component: BingeCountries, backdrop: 2 },
  'netflix.summary': { Component: BingeSummary, backdrop: 0 },
};
