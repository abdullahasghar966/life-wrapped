import type { SourceKind } from '../types';

const SAMPLE_SIZE = 25;

function sampleObjects(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) return [];
  const out: Record<string, unknown>[] = [];
  for (const item of data) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      out.push(item as Record<string, unknown>);
      if (out.length >= SAMPLE_SIZE) break;
    }
  }
  return out;
}

const has = (o: Record<string, unknown>, ...keys: string[]) => keys.every((k) => k in o);

/** True if most sampled objects have all the keys (tolerates a few odd rows). */
function mostHave(objs: Record<string, unknown>[], ...keys: string[]): boolean {
  if (objs.length === 0) return false;
  return objs.filter((o) => has(o, ...keys)).length / objs.length >= 0.6;
}

function looksLikeSearch(objs: Record<string, unknown>[], name: string): boolean {
  let search = 0;
  for (const o of objs) {
    const url = typeof o.titleUrl === 'string' ? o.titleUrl : '';
    if (url.includes('/results?search_query=') || url.includes('search_query=')) search++;
  }
  if (objs.length > 0 && search / objs.length >= 0.5) return true;
  return /search/i.test(name) && search > 0;
}

/**
 * Identifies a parsed JSON export by the shape of its rows first and its file
 * name second, because export folder and file names are localised.
 */
export function detectJson(name: string, data: unknown): SourceKind {
  const objs = sampleObjects(data);
  if (objs.length === 0) return 'unknown';
  if (mostHave(objs, 'ts', 'ms_played')) return 'spotify_extended';
  if (mostHave(objs, 'endTime', 'msPlayed')) return 'spotify_account';
  if (mostHave(objs, 'header', 'title', 'time')) {
    return looksLikeSearch(objs, name) ? 'youtube_search' : 'youtube_watch';
  }
  return 'unknown';
}

export const NETFLIX_REQUIRED_COLUMNS = ['Profile Name', 'Start Time', 'Duration', 'Title'];

export function detectCsv(headers: string[]): SourceKind {
  const set = new Set(headers.map((h) => h.trim().replace(/^﻿/, '')));
  return NETFLIX_REQUIRED_COLUMNS.every((c) => set.has(c)) ? 'netflix_viewing' : 'unknown';
}

/** Takeout's default HTML history: recognised so we can explain how to re-export as JSON. */
export function detectHtml(name: string, head: string): SourceKind {
  if (/youtube\.com\/watch|youtube\.com\/results/i.test(head)) return 'youtube_html';
  if (/(watch|search)-history\.html?$/i.test(name)) return 'youtube_html';
  return 'unknown';
}

export type FileFormat = 'zip' | 'json' | 'csv' | 'html' | 'other';

export function formatOf(name: string): FileFormat {
  const lower = name.toLowerCase();
  if (lower.endsWith('.zip')) return 'zip';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  return 'other';
}

/**
 * Which zip entries are worth decompressing. Only known export files are opened,
 * so unrelated personal files in an export (account details, payment history…)
 * are never even inflated. Takeout localises file names, so JSON files inside a
 * folder whose path mentions YouTube are also allowed; their content is then
 * checked by shape like everything else.
 */
const ZIP_ALLOW = [
  /(^|\/)StreamingHistory[^/]*\.json$/i,
  /(^|\/)Streaming_History_(Audio|Video)[^/]*\.json$/i,
  /(^|\/)endsong[^/]*\.json$/i,
  /(^|\/)(watch|search)-history\.(json|html?)$/i,
  /(^|\/)ViewingActivity\.csv$/i,
  /youtube[^/]*\/(.*\/)?[^/]+\.(json|html?)$/i,
];

export function isInterestingZipEntry(path: string): boolean {
  if (path.endsWith('/') || /(^|\/)(__MACOSX|\.)/.test(path)) return false;
  return ZIP_ALLOW.some((re) => re.test(path));
}
