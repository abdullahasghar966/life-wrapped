import type {
  FileReport,
  IngestProgress,
  NetflixRow,
  SourceKind,
  SpotifyRow,
  YoutubeSearchRow,
  YoutubeWatchRow,
} from '../types';
import { detectCsv, detectHtml, detectJson, formatOf } from './detect';
import { netflixKey, parseNetflixViewing } from './netflix';
import { headOf, parseCsvBytes, parseJsonBytes, sha256Hex } from './read';
import { mergeSpotify, parseSpotifyAccount, parseSpotifyExtended, spotifyKey } from './spotify';
import { CancelledError, unzipFiltered } from './unzip';
import {
  parseYoutubeSearches,
  parseYoutubeWatches,
  youtubeSearchKey,
  youtubeWatchKey,
} from './youtube';

/**
 * Everything parsed so far, already minimised and in UTC. Rows are de-duplicated
 * by natural keys so dropping the same export twice (or overlapping files) never
 * double counts.
 */
export class Dataset {
  spotifyExtended: SpotifyRow[] = [];
  spotifyAccount: SpotifyRow[] = [];
  youtubeWatches: YoutubeWatchRow[] = [];
  youtubeSearches: YoutubeSearchRow[] = [];
  netflix: NetflixRow[] = [];
  readonly fileHashes = new Set<string>();
  private readonly keys = {
    spotify: new Set<string>(),
    ytw: new Set<string>(),
    yts: new Set<string>(),
    nf: new Set<string>(),
  };

  get spotify(): SpotifyRow[] {
    return mergeSpotify(this.spotifyExtended, this.spotifyAccount);
  }

  isEmpty(): boolean {
    return (
      this.spotifyExtended.length +
        this.spotifyAccount.length +
        this.youtubeWatches.length +
        this.youtubeSearches.length +
        this.netflix.length ===
      0
    );
  }

  /** Adds rows not seen before; returns how many were duplicates. */
  add(kind: SourceKind, rows: unknown[]): number {
    let dupes = 0;
    const addUnique = <T>(target: T[], keys: Set<string>, keyOf: (r: T) => string) => {
      for (const r of rows as T[]) {
        const k = keyOf(r);
        if (keys.has(k)) dupes++;
        else {
          keys.add(k);
          target.push(r);
        }
      }
    };
    switch (kind) {
      case 'spotify_extended':
        addUnique(this.spotifyExtended, this.keys.spotify, spotifyKey);
        break;
      case 'spotify_account':
        addUnique(this.spotifyAccount, this.keys.spotify, spotifyKey);
        break;
      case 'youtube_watch':
        addUnique(this.youtubeWatches, this.keys.ytw, youtubeWatchKey);
        break;
      case 'youtube_search':
        addUnique(this.youtubeSearches, this.keys.yts, youtubeSearchKey);
        break;
      case 'netflix_viewing':
        addUnique(this.netflix, this.keys.nf, netflixKey);
        break;
      default:
        break;
    }
    return dupes;
  }
}

interface Candidate {
  name: string;
  file: Blob;
}

export interface IngestOutcome {
  reports: FileReport[];
  youtubeHtmlFound: boolean;
}

const fmt = new Intl.NumberFormat('en-US');

function reportMessage(kind: SourceKind, rows: number, skipped: number): string {
  const label =
    kind === 'spotify_extended'
      ? 'Spotify Extended'
      : kind === 'spotify_account'
        ? 'Spotify Account data'
        : kind === 'youtube_watch'
          ? 'YouTube watch history'
          : kind === 'youtube_search'
            ? 'YouTube search history'
            : 'Netflix viewing activity';
  return `Recognised as ${label} · ${fmt.format(rows)} rows · ${fmt.format(skipped)} skipped`;
}

/** Parses one file's bytes into rows for the dataset and returns its report line. */
async function processFile(
  c: Candidate,
  dataset: Dataset,
): Promise<FileReport & { html?: boolean }> {
  const format = formatOf(c.name);
  const base: FileReport = {
    name: c.name,
    kind: 'unknown',
    status: 'unsupported',
    rows: 0,
    skipped: 0,
  };
  if (format === 'other' || format === 'zip') {
    return { ...base, message: 'Not a .json or .csv export file, so it was ignored.' };
  }
  const bytes = await c.file.arrayBuffer();
  if (bytes.byteLength === 0) return { ...base, status: 'empty', message: 'This file is empty.' };

  const hash = await sha256Hex(bytes);
  if (dataset.fileHashes.has(hash)) {
    return {
      ...base,
      status: 'duplicate',
      message: 'Identical to a file you already added, so it was skipped.',
    };
  }

  if (format === 'html') {
    const kind = detectHtml(c.name, headOf(bytes));
    if (kind === 'youtube_html') {
      return {
        ...base,
        kind,
        message:
          'This is the HTML version of your YouTube history. Re-export it from Google Takeout as JSON (steps below).',
        html: true,
      };
    }
    return { ...base, message: 'Not a supported export file.' };
  }

  let kind: SourceKind = 'unknown';
  let parsed: { rows: unknown[]; skipped: number } | null = null;
  try {
    if (format === 'json') {
      const data = await parseJsonBytes(bytes);
      kind = detectJson(c.name, data);
      const arr = Array.isArray(data) ? data : [];
      if (kind === 'spotify_extended') parsed = parseSpotifyExtended(arr);
      else if (kind === 'spotify_account') parsed = parseSpotifyAccount(arr);
      else if (kind === 'youtube_watch') parsed = parseYoutubeWatches(arr);
      else if (kind === 'youtube_search') parsed = parseYoutubeSearches(arr);
    } else {
      const csv = parseCsvBytes(bytes);
      kind = detectCsv(csv.headers);
      if (kind === 'netflix_viewing') parsed = parseNetflixViewing(csv.records);
    }
  } catch {
    return {
      ...base,
      status: 'error',
      message: "We couldn't read this file. Is it a complete export?",
    };
  }

  if (!parsed || kind === 'unknown') {
    return { ...base, message: "This file isn't one of the supported exports, so it was ignored." };
  }
  dataset.fileHashes.add(hash);
  const dupes = dataset.add(kind, parsed.rows);
  const rows = parsed.rows.length - dupes;
  const skipped = parsed.skipped + dupes;
  return {
    name: c.name,
    kind,
    status: rows > 0 ? 'ok' : 'empty',
    rows,
    skipped,
    message: reportMessage(kind, rows, skipped),
  };
}

export async function ingestFiles(
  files: Blob[] | File[],
  dataset: Dataset,
  onProgress: (p: IngestProgress) => void = () => {},
  isCancelled: () => boolean = () => false,
): Promise<IngestOutcome> {
  const reports: FileReport[] = [];
  let youtubeHtmlFound = false;

  // 1. Expand zips (inflating only known export entries).
  const candidates: Candidate[] = [];
  const total0 = files.length;
  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    const name = 'name' in f ? (f as File).name : `file-${i}`;
    if (isCancelled()) throw new CancelledError();
    onProgress({
      stage: 'reading',
      file: name,
      filesDone: i,
      filesTotal: total0,
      fraction: (i / total0) * 0.3,
    });
    if (formatOf(name) === 'zip') {
      try {
        const { entries } = await unzipFiltered(f, isCancelled);
        if (entries.length === 0) {
          reports.push({
            name,
            kind: 'unknown',
            status: 'unsupported',
            rows: 0,
            skipped: 0,
            message: 'No supported export files were found inside this zip.',
          });
        }
        for (const e of entries) candidates.push({ name: `${name} › ${e.path}`, file: e.file });
      } catch (err) {
        if (err instanceof CancelledError) throw err;
        reports.push({
          name,
          kind: 'unknown',
          status: 'error',
          rows: 0,
          skipped: 0,
          message: "We couldn't open this zip. Is the download complete?",
        });
      }
    } else candidates.push({ name, file: f });
  }

  // 2. Parse each candidate.
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]!;
    if (isCancelled()) throw new CancelledError();
    onProgress({
      stage: 'parsing',
      file: c.name,
      filesDone: i,
      filesTotal: candidates.length,
      fraction: 0.3 + (i / Math.max(1, candidates.length)) * 0.5,
    });
    const r = await processFile(c, dataset);
    if (r.html) youtubeHtmlFound = true;
    const { html: _html, ...report } = r;
    reports.push(report);
  }
  return { reports, youtubeHtmlFound };
}
