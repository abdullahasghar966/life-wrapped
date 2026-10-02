/**
 * Every threshold and magic number used by ingestion and insights.
 * Changing a value here changes what the decks show, so each one says why it exists.
 */

// ---------- Shared ----------

/** Dayparts in local time (§8.2): [startHour, endHourExclusive). */
export const DAYPARTS = {
  night: [0, 5],
  morning: [5, 12],
  afternoon: [12, 17],
  evening: [17, 24],
} as const;

/** "After midnight" in every deck means 00:00–04:59 local time. */
export const NIGHT_END_HOUR = 5;

/** Length of the default reporting period, ending at the latest event. */
export const DEFAULT_PERIOD_MONTHS = 12;

// ---------- Deck availability (§8.2) ----------

/** Spotify deck needs at least an hour of music. */
export const SPOTIFY_DECK_MIN_MUSIC_MS = 60 * 60_000;
/** YouTube deck needs at least 50 watches. */
export const YOUTUBE_DECK_MIN_WATCHES = 50;
/** Netflix deck needs at least 5 hours for the selected profile. */
export const NETFLIX_DECK_MIN_SECONDS = 5 * 3600;
/** The combined deck needs at least two platform decks. */
export const LIFE_DECK_MIN_PLATFORMS = 2;

// ---------- Spotify ----------

/** Spotify's own stream threshold: plays shorter than 30 s aren't "plays". */
export const SPOTIFY_PLAY_MS = 30_000;
/** Minutes card: show if at least 60 minutes of music. */
export const SPOTIFY_MINUTES_MIN = 60;
/** Top artist / top 5 artists need at least 5 distinct artists. */
export const SPOTIFY_TOP_ARTISTS_MIN = 5;
/** Top 5 songs need at least 5 distinct tracks. */
export const SPOTIFY_TOP_TRACKS_MIN = 5;
/** "On repeat": the best single-day repeat count must be at least 5 to be a story. */
export const SPOTIFY_ON_REPEAT_MIN = 5;
/** Clock / persona cards need a week of active days to mean anything. */
export const MIN_ACTIVE_DAYS_FOR_CLOCK = 7;
/** Skip card needs 200 plays so a percentage isn't noise. */
export const SPOTIFY_SKIPS_MIN_PLAYS = 200;
/** Most-skipped artist needs at least 20 plays so one bad song doesn't decide it. */
export const SPOTIFY_MOST_SKIPPED_MIN_PLAYS = 20;
/** Discovery needs at least 20 artists. */
export const SPOTIFY_DISCOVERY_MIN_ARTISTS = 20;
/** Streak card needs a streak of at least 3 days. */
export const SPOTIFY_STREAK_MIN = 3;
/** Podcast card needs an hour of podcasts. */
export const SPOTIFY_PODCAST_MIN_MS = 60 * 60_000;

// ---------- YouTube (§8.3) ----------

/** A gap up to 30 minutes is assumed to be time spent on the previous video. */
export const YT_MAX_GAP_MIN = 30;
/** When the gap is longer (or it's the last watch), assume 8 minutes. */
export const YT_DEFAULT_WATCH_MIN = 8;
/** Watches whose gaps are all ≤ 20 minutes form one session ("rabbit hole"). */
export const YT_SESSION_GAP_MIN = 20;
/** Top channel card needs at least 10 channels. */
export const YT_TOP_CHANNEL_MIN_CHANNELS = 10;
/** Top 5 channels needs 5 channels. */
export const YT_TOP5_MIN_CHANNELS = 5;
/** Rabbit hole card needs a session of at least 45 minutes. */
export const YT_RABBIT_HOLE_MIN_MIN = 45;
/** Most rewatched needs a video watched at least 3 times. */
export const YT_REWATCH_MIN = 3;
/** Weekly rhythm heatmap needs four weeks of data. */
export const YT_HEATMAP_MIN_WEEKS = 4;
/** YouTube Music card needs at least 20 music entries. */
export const YT_MUSIC_MIN_ENTRIES = 20;
/** Search card shows this many top terms. */
export const YT_TOP_SEARCH_TERMS = 5;

// ---------- Netflix ----------

/** Binge record needs at least 3 episodes of one series in one day. */
export const NF_BINGE_MIN_EPISODES = 3;
/** Top 5 titles needs 5 titles. */
export const NF_TOP5_MIN_TITLES = 5;
/** Device split needs at least two device classes. */
export const NF_DEVICES_MIN_CLASSES = 2;
/** Country card needs at least two countries. */
export const NF_COUNTRIES_MIN = 2;
/** "About N movies' worth": an average feature film is roughly two hours. */
export const NF_MOVIE_HOURS = 2;

// ---------- Life deck archetypes (§9.4) ----------

export const ARCHETYPE_THRESHOLDS = {
  /** Share of all time between 00:00 and 04:59. */
  nightOwlShare: 0.3,
  /** Most Netflix episodes of one series in a day. */
  bingeEpisodes: 5,
  /** Longest YouTube session in hours. */
  rabbitHoleHours: 3,
  /** Distinct Spotify artists… */
  explorerArtists: 300,
  /** …or distinct YouTube channels. */
  explorerChannels: 500,
  /** Top artist's share of music minutes. */
  loyalistShare: 0.15,
  /** Spotify's share of all time. */
  soundtrackShare: 0.6,
} as const;

// ---------- Sharing ----------

/** Max short names in a share payload, and their max length. */
export const SHARE_MAX_NAMES = 5;
export const SHARE_MAX_NAME_LENGTH = 80;
export const SHARE_MAX_BYTES = 4096;
