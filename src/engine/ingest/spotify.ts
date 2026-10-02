import { z } from 'zod';
import { SPOTIFY_PLAY_MS } from '../insights/constants';
import type { ParseResult, SpotifyKind, SpotifyRow } from '../types';
import { minimise } from './minimise';
import { parseUtc } from './time';

const str = z.string().nullish();
const bool = z.boolean().nullish();
const num = z.number().nullish();

// Every field optional and nullable; unknown fields are stripped by Zod.
const ExtendedRow = z.object({
  ts: str,
  ms_played: num,
  master_metadata_track_name: str,
  master_metadata_album_artist_name: str,
  master_metadata_album_album_name: str,
  spotify_track_uri: str,
  episode_name: str,
  episode_show_name: str,
  spotify_episode_uri: str,
  audiobook_title: str,
  audiobook_uri: str,
  audiobook_chapter_title: str,
  audiobook_chapter_uri: str,
  platform: str,
  conn_country: str,
  reason_start: str,
  reason_end: str,
  shuffle: bool,
  skipped: bool,
  offline: bool,
  incognito_mode: bool,
});

const AccountRow = z.object({
  endTime: str,
  msPlayed: num,
  artistName: str,
  trackName: str,
  podcastName: str,
  episodeName: str,
});

const clean = (s: string | null | undefined) => {
  const t = s?.trim();
  return t ? t : null;
};

export function parseSpotifyExtended(data: unknown[]): ParseResult<SpotifyRow> {
  const rows: SpotifyRow[] = [];
  let skipped = 0;
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') {
      skipped++;
      continue;
    }
    const parsed = ExtendedRow.safeParse(minimise('spotify', raw as Record<string, unknown>));
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const r = parsed.data;
    const end = parseUtc(r.ts);
    const ms = r.ms_played ?? NaN;
    if (!Number.isFinite(end) || !Number.isFinite(ms) || ms < 0) {
      skipped++;
      continue;
    }
    const track = clean(r.master_metadata_track_name);
    const episode = clean(r.episode_name);
    const show = clean(r.episode_show_name);
    const book = clean(r.audiobook_title);
    let kind: SpotifyKind;
    if (track) kind = 'music';
    else if (episode || show) kind = 'podcast';
    else if (book || clean(r.audiobook_uri)) kind = 'audiobook';
    else {
      skipped++;
      continue;
    }
    rows.push({
      // `ts` is when playback stopped; start ≈ ts − ms_played (same rule as Account data).
      ts: end - ms,
      ms,
      kind,
      track,
      artist: kind === 'music' ? clean(r.master_metadata_album_artist_name) : null,
      album: kind === 'music' ? clean(r.master_metadata_album_album_name) : null,
      uri: clean(r.spotify_track_uri),
      episode: kind === 'audiobook' ? clean(r.audiobook_chapter_title) : episode,
      show: kind === 'audiobook' ? book : show,
      platform: clean(r.platform),
      country: clean(r.conn_country),
      reasonEnd: clean(r.reason_end),
      skipped: r.skipped === true || r.reason_end === 'fwdbtn',
      shuffle: r.shuffle ?? null,
      offline: r.offline ?? null,
      privateSession: r.incognito_mode === true,
      source: 'extended',
    });
  }
  return { rows, skipped };
}

export function parseSpotifyAccount(data: unknown[]): ParseResult<SpotifyRow> {
  const rows: SpotifyRow[] = [];
  let skipped = 0;
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') {
      skipped++;
      continue;
    }
    const parsed = AccountRow.safeParse(minimise('spotify', raw as Record<string, unknown>));
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const r = parsed.data;
    const end = parseUtc(r.endTime);
    const ms = r.msPlayed ?? NaN;
    if (!Number.isFinite(end) || !Number.isFinite(ms) || ms < 0) {
      skipped++;
      continue;
    }
    const track = clean(r.trackName);
    const podcast = clean(r.podcastName);
    const episode = clean(r.episodeName);
    const kind: SpotifyKind | null = track ? 'music' : podcast || episode ? 'podcast' : null;
    if (!kind) {
      skipped++;
      continue;
    }
    rows.push({
      ts: end - ms,
      ms,
      kind,
      track,
      artist: kind === 'music' ? clean(r.artistName) : null,
      album: null,
      uri: null,
      episode: kind === 'podcast' ? episode : null,
      show: kind === 'podcast' ? podcast : null,
      platform: null,
      country: null,
      reasonEnd: null,
      skipped: ms < SPOTIFY_PLAY_MS,
      shuffle: null,
      offline: null,
      privateSession: false,
      source: 'account',
    });
  }
  return { rows, skipped };
}

/**
 * Combines both Spotify formats. Where an Extended history covers a time range,
 * Account-data rows inside that range are dropped so nothing is double counted.
 */
export function mergeSpotify(extended: SpotifyRow[], account: SpotifyRow[]): SpotifyRow[] {
  if (extended.length === 0) return account;
  if (account.length === 0) return extended;
  let min = Infinity;
  let max = -Infinity;
  for (const r of extended) {
    if (r.ts < min) min = r.ts;
    if (r.ts > max) max = r.ts;
  }
  return [...extended, ...account.filter((r) => r.ts < min || r.ts > max)];
}

export function spotifyKey(r: SpotifyRow): string {
  return `${r.ts}|${r.ms}|${r.track ?? r.episode ?? r.show ?? ''}|${r.source}`;
}
