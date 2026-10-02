import { ARCHETYPE_LABEL, type ArchetypeId } from '@/engine/insights/life/personality';
import type { Platform } from '@/engine/insights/life/shared';
import lifeSummary, { type LifeSummary } from '@/engine/insights/life/summary';
import netflixSummary, {
  type NetflixPersona,
  type NetflixSummary,
} from '@/engine/insights/netflix/summary';
import type { ListeningPersona } from '@/engine/insights/spotify/clock';
import spotifySummary, { type SpotifySummary } from '@/engine/insights/spotify/summary';
import type { InsightResult } from '@/engine/insights/types';
import youtubeSummary, { type YoutubeSummary } from '@/engine/insights/youtube/summary';
import type { ShareCardType, ValidSharePayload } from './schema';

const PLATFORM_BY_LABEL: Record<string, Platform> = {
  Spotify: 'spotify',
  YouTube: 'youtube',
  Netflix: 'netflix',
};

const ARCHETYPE_BY_LABEL = Object.fromEntries(
  Object.entries(ARCHETYPE_LABEL).map(([id, label]) => [label, id]),
) as Record<string, ArchetypeId>;

/** How a shared card is introduced, on the page and in link previews. */
export const SHARE_TITLES: Record<ShareCardType, string> = {
  'spotify.summary': 'A year in sound',
  'youtube.summary': 'A year of watching',
  'netflix.summary': 'A year on screen',
  'life.summary': 'An online life, wrapped',
};

/**
 * Rebuilds a summary card's result from a shared payload, so /s/[id] renders the
 * very same card component as the story. Fields that weren't shared stay empty
 * rather than being guessed.
 */
export function toInsightResult(payload: ValidSharePayload): InsightResult {
  const n = payload.numbers as Record<string, number | undefined>;
  const s = payload.names as Record<string, string | undefined>;
  const base = {
    id: payload.cardType,
    order: 0,
    title: SHARE_TITLES[payload.cardType],
    shareable: false,
    seed: 0,
  };
  switch (payload.cardType) {
    case 'spotify.summary': {
      const props: SpotifySummary = {
        minutes: n.minutes ?? 0,
        topArtist: s.topArtist ?? null,
        topTrack: s.topTrack ? { track: s.topTrack, artist: s.topArtist ?? '' } : null,
        persona: (s.persona as ListeningPersona | undefined) ?? null,
        streak: n.streak ?? null,
      };
      return { ...base, deck: 'spotify', props, a11y: spotifySummary.a11yText(props) };
    }
    case 'youtube.summary': {
      const props: YoutubeSummary = {
        videos: n.videos ?? 0,
        hours: n.hours ?? 0,
        topChannel: s.topChannel ?? null,
        rabbitHole:
          n.rabbitHoleVideos !== undefined
            ? { videos: n.rabbitHoleVideos, minutes: n.rabbitHoleMinutes ?? 0 }
            : null,
        peakHour: n.peakHour ?? null,
      };
      return { ...base, deck: 'youtube', props, a11y: youtubeSummary.a11yText(props) };
    }
    case 'netflix.summary': {
      const props: NetflixSummary = {
        hours: n.hours ?? 0,
        topSeries: s.topSeries ?? null,
        // The card shows the record's length only, so the series name isn't shared.
        binge: n.bingeEpisodes ? { series: '', count: n.bingeEpisodes } : null,
        persona: (s.persona as NetflixPersona | undefined) ?? 'Binger',
      };
      return { ...base, deck: 'netflix', props, a11y: netflixSummary.a11yText(props) };
    }
    case 'life.summary': {
      const shares = {
        spotify: n.spotifyShare ?? 0,
        youtube: n.youtubeShare ?? 0,
        netflix: n.netflixShare ?? 0,
      };
      const archetype = ARCHETYPE_BY_LABEL[s.archetype ?? ''] ?? 'nightOwl';
      const props: LifeSummary = {
        hours: n.hours ?? 0,
        days: n.days ?? 0,
        // YouTube time is always an estimate, so any YouTube share makes the total one.
        estimated: shares.youtube > 0,
        shares,
        top: PLATFORM_BY_LABEL[s.top ?? ''] ?? 'spotify',
        archetype,
        label: s.archetype ?? ARCHETYPE_LABEL[archetype],
      };
      return { ...base, deck: 'life', props, a11y: lifeSummary.a11yText(props) };
    }
  }
}
