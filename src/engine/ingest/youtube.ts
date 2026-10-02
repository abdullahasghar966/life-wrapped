import { z } from 'zod';
import type { ParseResult, YoutubeSearchRow, YoutubeWatchRow } from '../types';
import { minimise } from './minimise';
import { parseUtc } from './time';

const Entry = z.object({
  header: z.string().nullish(),
  title: z.string().nullish(),
  titleUrl: z.string().nullish(),
  subtitles: z.array(z.object({ name: z.string().nullish() })).nullish(),
  time: z.string().nullish(),
  details: z.array(z.object({ name: z.string().nullish() })).nullish(),
});

/** Takeout writes titles as "<verb> <title>" in the account's language. */
const WATCH_VERBS: Array<[prefix: string, suffix?: string]> = [
  ['Watched '],
  ['Has visto '],
  ['Viste '],
  ['Vous avez regardé '],
  ['Du hast ', ' angesehen'],
  ['Hai guardato '],
  ['Assistiu a '],
  ['Você assistiu a '],
  ['Je hebt ', ' bekeken'],
  ['Obejrzano: '],
  ['Watched: '],
];

const SEARCH_VERBS: Array<[prefix: string, suffix?: string]> = [
  ['Searched for '],
  ['Has buscado '],
  ['Buscaste '],
  ['Vous avez recherché '],
  ['Du hast nach ', ' gesucht'],
  ['Hai cercato '],
  ['Pesquisou '],
  ['Você pesquisou '],
  ['Je hebt gezocht naar '],
  ['Wyszukano: '],
];

export function stripVerb(title: string, verbs: Array<[string, string?]>): string {
  for (const [prefix, suffix] of verbs) {
    if (title.startsWith(prefix)) {
      let rest = title.slice(prefix.length);
      if (suffix && rest.endsWith(suffix)) rest = rest.slice(0, -suffix.length);
      return rest.trim();
    }
  }
  return title.trim();
}

export function videoIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const v = u.searchParams.get('v');
    if (v) return v;
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    return null;
  } catch {
    return null;
  }
}

const isAd = (details: Array<{ name?: string | null }> | null | undefined) =>
  !!details?.some((d) => d.name?.includes('Google Ads'));

export interface YoutubeWatchParse extends ParseResult<YoutubeWatchRow> {
  ads: number;
}

export function parseYoutubeWatches(data: unknown[]): YoutubeWatchParse {
  const rows: YoutubeWatchRow[] = [];
  let skipped = 0;
  let ads = 0;
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') {
      skipped++;
      continue;
    }
    const parsed = Entry.safeParse(minimise('youtube', raw as Record<string, unknown>));
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const e = parsed.data;
    const ts = parseUtc(e.time);
    if (!Number.isFinite(ts)) {
      skipped++;
      continue;
    }
    if (isAd(e.details)) {
      ads++;
      continue;
    }
    const music = e.header === 'YouTube Music';
    const videoId = videoIdFromUrl(e.titleUrl);
    let title: string | null = e.title ? stripVerb(e.title, WATCH_VERBS) : null;
    // Removed or private videos have no link, or show the bare URL as their title.
    const unavailable = !e.titleUrl || !videoId || !title || /^https?:\/\//.test(title);
    if (unavailable) title = null;
    let channel = e.subtitles?.[0]?.name?.trim() || null;
    if (channel && music) channel = channel.replace(/ - Topic$/, '');
    rows.push({
      ts,
      videoId: unavailable ? null : videoId,
      title,
      channel: unavailable ? null : channel,
      product: music ? 'youtube_music' : 'youtube',
      unavailable,
    });
  }
  return { rows, skipped: skipped + ads, ads };
}

export function parseYoutubeSearches(data: unknown[]): ParseResult<YoutubeSearchRow> {
  const rows: YoutubeSearchRow[] = [];
  let skipped = 0;
  for (const raw of data) {
    if (!raw || typeof raw !== 'object') {
      skipped++;
      continue;
    }
    const parsed = Entry.safeParse(minimise('youtube', raw as Record<string, unknown>));
    if (!parsed.success || isAd(parsed.data.details)) {
      skipped++;
      continue;
    }
    const e = parsed.data;
    const ts = parseUtc(e.time);
    const query = e.title ? stripVerb(e.title, SEARCH_VERBS) : '';
    if (!Number.isFinite(ts) || !query) {
      skipped++;
      continue;
    }
    rows.push({ ts, query });
  }
  return { rows, skipped };
}

export const youtubeWatchKey = (r: YoutubeWatchRow) => `${r.ts}|${r.videoId ?? r.title ?? ''}`;
export const youtubeSearchKey = (r: YoutubeSearchRow) => `${r.ts}|${r.query}`;
