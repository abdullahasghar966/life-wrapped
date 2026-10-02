import { z } from './zod';
import type { DeviceClass, NetflixRow, ParseResult } from '../types';
import { minimise } from './minimise';
import { parseDuration, parseUtc } from './time';

const CsvRow = z.object({
  'Profile Name': z.string().nullish(),
  'Start Time': z.string().nullish(),
  Duration: z.string().nullish(),
  Attributes: z.string().nullish(),
  Title: z.string().nullish(),
  'Supplemental Video Type': z.string().nullish(),
  'Device Type': z.string().nullish(),
  Country: z.string().nullish(),
});

/** Views shorter than this are previews and accidental clicks, not watching. */
export const NETFLIX_MIN_SECONDS = 60;

const SEASON_WORD =
  /^(season|series|part|volume|book|chapter|collection|limited series|miniseries|temporada|staffel|saison|stagione)\b/i;

export interface ParsedTitle {
  series: string | null;
  season: string | null;
  episode: string | null;
  isSeries: boolean;
}

/**
 * Netflix titles look like "Show: Season 2: Episode name" or "Movie". Rules (§6.4):
 * 1. ≥ 3 parts and part 2 is a season word → series / season / episode.
 * 2. Otherwise, if ≥ 3 distinct titles share the first part → series.
 * 3. Otherwise it's a movie.
 */
export function parseNetflixTitle(title: string, seriesPrefixes: ReadonlySet<string>): ParsedTitle {
  const parts = title.split(': ');
  if (parts.length >= 3 && SEASON_WORD.test(parts[1]!.trim())) {
    return {
      series: parts[0]!.trim(),
      season: parts[1]!.trim(),
      episode: parts.slice(2).join(': ').trim(),
      isSeries: true,
    };
  }
  if (parts.length >= 2 && seriesPrefixes.has(parts[0]!.trim())) {
    return {
      series: parts[0]!.trim(),
      season: null,
      episode: parts.slice(1).join(': ').trim(),
      isSeries: true,
    };
  }
  return { series: null, season: null, episode: null, isSeries: false };
}

/** First parts shared by at least 3 distinct titles (rule 2). */
export function seriesPrefixesOf(titles: Iterable<string>): Set<string> {
  const byPrefix = new Map<string, Set<string>>();
  for (const t of titles) {
    const parts = t.split(': ');
    if (parts.length < 2) continue;
    const key = parts[0]!.trim();
    let set = byPrefix.get(key);
    if (!set) byPrefix.set(key, (set = new Set()));
    set.add(t);
  }
  const out = new Set<string>();
  for (const [k, v] of byPrefix) if (v.size >= 3) out.add(k);
  return out;
}

const DEVICE_RULES: Array<[DeviceClass, RegExp]> = [
  ['TV', /\bTV\b|roku|fire ?tv|chromecast|apple ?tv|playstation|xbox/i],
  ['Tablet', /ipad|tablet|kindle/i],
  ['Phone', /iphone|phone/i],
  ['Computer', /\bPC\b|\bmac|chrome|edge|firefox|safari|windows|cadmium/i],
];

export function deviceClassOf(deviceType: string | null | undefined): DeviceClass {
  if (!deviceType) return 'Other';
  for (const [cls, re] of DEVICE_RULES) if (re.test(deviceType)) return cls;
  return 'Other';
}

/** "PK (Pakistan)" → { code: "PK", name: "Pakistan" }. */
export function parseCountry(value: string | null | undefined): {
  code: string | null;
  name: string | null;
} {
  const v = value?.trim();
  if (!v) return { code: null, name: null };
  const m = /^([A-Z]{2})\s*\((.+)\)$/.exec(v);
  if (m) return { code: m[1]!, name: m[2]!.trim() };
  if (/^[A-Z]{2}$/.test(v)) return { code: v, name: null };
  return { code: null, name: v };
}

export function parseNetflixViewing(records: unknown[]): ParseResult<NetflixRow> {
  let skipped = 0;
  const valid: Array<z.infer<typeof CsvRow> & { ts: number; dur: number; title: string }> = [];
  for (const raw of records) {
    if (!raw || typeof raw !== 'object') {
      skipped++;
      continue;
    }
    const parsed = CsvRow.safeParse(minimise('netflix', raw as Record<string, unknown>));
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const r = parsed.data;
    const ts = parseUtc(r['Start Time']);
    const dur = parseDuration(r.Duration);
    const title = r.Title?.trim();
    const profile = r['Profile Name']?.trim();
    // Trailers, teasers, hooks and recaps have a Supplemental Video Type.
    if (r['Supplemental Video Type']?.trim()) {
      skipped++;
      continue;
    }
    if (
      !Number.isFinite(ts) ||
      !Number.isFinite(dur) ||
      dur < NETFLIX_MIN_SECONDS ||
      !title ||
      !profile
    ) {
      skipped++;
      continue;
    }
    valid.push({ ...r, ts, dur, title });
  }

  const prefixes = seriesPrefixesOf(new Set(valid.map((v) => v.title)));
  const rows: NetflixRow[] = valid.map((v) => {
    const t = parseNetflixTitle(v.title, prefixes);
    const c = parseCountry(v.Country);
    return {
      ts: v.ts,
      durationS: v.dur,
      titleRaw: v.title,
      series: t.series,
      season: t.season,
      episode: t.episode,
      isSeries: t.isSeries,
      deviceClass: deviceClassOf(v['Device Type']),
      countryCode: c.code,
      countryName: c.name,
      profile: v['Profile Name']!.trim(),
    };
  });
  return { rows, skipped };
}

export const netflixKey = (r: NetflixRow) => `${r.profile}|${r.ts}|${r.titleRaw}|${r.durationS}`;
