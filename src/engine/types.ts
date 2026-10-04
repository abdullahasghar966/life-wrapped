export type DeckId = 'spotify' | 'youtube' | 'netflix' | 'life';
export const PLATFORM_DECKS = ['spotify', 'youtube', 'netflix'] as const;
export const ALL_DECKS: DeckId[] = ['spotify', 'youtube', 'netflix', 'life'];

export type SourceKind =
  | 'spotify_extended'
  | 'spotify_account'
  | 'youtube_watch'
  | 'youtube_search'
  | 'netflix_viewing'
  | 'youtube_html'
  | 'unknown';

export const SOURCE_LABEL: Record<SourceKind, string> = {
  spotify_extended: 'Spotify Extended streaming history',
  spotify_account: 'Spotify Account data streaming history',
  youtube_watch: 'YouTube watch history',
  youtube_search: 'YouTube search history',
  netflix_viewing: 'Netflix viewing activity',
  youtube_html: 'YouTube history (HTML)',
  unknown: 'Not a supported export file',
};

/**
 * Something to play alongside the stories (ADR-040). Only for the person's own
 * data; ids are checked against the platforms' formats before they leave the worker.
 */
export interface TopSong {
  track: string;
  artist: string;
  plays: number;
  /** Spotify track id, when the export has one (Extended history does, Account data doesn't). */
  trackId: string | null;
}

export interface TopVideo {
  videoId: string;
  title: string;
  channel: string | null;
  views: number;
}

export interface TopMedia {
  songs: TopSong[];
  videos: TopVideo[];
}

/** A reporting period in local dates, half-open: [start, end). */
export interface Period {
  id: string;
  start: string;
  end: string;
  label: string;
}

export interface EngineOptions {
  timeZone: string;
  periodId: string | null;
  includePrivateSessions: boolean;
  includeSearches: boolean;
  netflixProfile: string | null;
}

export interface IngestProgress {
  stage: 'reading' | 'parsing' | 'loading' | 'done';
  file?: string;
  filesDone: number;
  filesTotal: number;
  /** 0..1 overall. */
  fraction: number;
}

export interface FileReport {
  name: string;
  kind: SourceKind;
  status: 'ok' | 'duplicate' | 'unsupported' | 'error' | 'empty';
  rows: number;
  skipped: number;
  message?: string;
}

export interface DateRange {
  first: string;
  last: string;
}

export interface NetflixProfile {
  name: string;
  hours: number;
  views: number;
}

export interface IngestSummary {
  isSample: boolean;
  files: FileReport[];
  counts: {
    spotifyPlays: number;
    spotifyMusic: number;
    spotifyPodcast: number;
    youtubeWatches: number;
    youtubeSearches: number;
    netflixViews: number;
  };
  ranges: Partial<Record<'spotify' | 'youtube' | 'netflix', DateRange>>;
  netflixProfiles: NetflixProfile[];
  options: EngineOptions;
  period: Period | null;
  periods: Period[];
  availableDecks: DeckId[];
  /** Set when a YouTube HTML export was dropped (unsupported in v1). */
  youtubeHtmlFound: boolean;
  /** For the sample: the "today" it was generated for (data ends the day before). */
  sampleToday: string | null;
}

// ---------- Normalised rows (UTC; sensitive fields already dropped) ----------

export type SpotifyKind = 'music' | 'podcast' | 'audiobook';

export interface SpotifyRow {
  /** Playback start, epoch ms UTC. */
  ts: number;
  ms: number;
  kind: SpotifyKind;
  track: string | null;
  artist: string | null;
  album: string | null;
  uri: string | null;
  episode: string | null;
  show: string | null;
  platform: string | null;
  country: string | null;
  reasonEnd: string | null;
  skipped: boolean;
  shuffle: boolean | null;
  offline: boolean | null;
  privateSession: boolean;
  source: 'extended' | 'account';
}

export interface YoutubeWatchRow {
  ts: number;
  videoId: string | null;
  title: string | null;
  channel: string | null;
  product: 'youtube' | 'youtube_music';
  unavailable: boolean;
}

export interface YoutubeSearchRow {
  ts: number;
  query: string;
}

export type DeviceClass = 'TV' | 'Phone' | 'Tablet' | 'Computer' | 'Other';

export interface NetflixRow {
  ts: number;
  durationS: number;
  titleRaw: string;
  series: string | null;
  season: string | null;
  episode: string | null;
  isSeries: boolean;
  deviceClass: DeviceClass;
  countryCode: string | null;
  countryName: string | null;
  profile: string;
}

export interface ParseResult<T> {
  rows: T[];
  skipped: number;
}
