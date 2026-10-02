import { JSONParser } from '@streamparser/json';
import Papa from 'papaparse';

/** Above this size JSON is parsed incrementally instead of as one giant string. */
export const STREAM_JSON_BYTES = 50 * 1024 * 1024;

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Parses a JSON document. Returns the root value (exports are top-level arrays). */
export async function parseJsonBytes(bytes: ArrayBuffer): Promise<unknown> {
  if (bytes.byteLength <= STREAM_JSON_BYTES) {
    return JSON.parse(new TextDecoder().decode(bytes).replace(/^﻿/, ''));
  }
  // Large file: collect array items one by one so we never hold a 500 MB string.
  const items: unknown[] = [];
  const parser = new JSONParser({ paths: ['$.*'], keepStack: false });
  parser.onValue = ({ value }) => {
    items.push(value);
  };
  const view = new Uint8Array(bytes);
  const CHUNK = 4 * 1024 * 1024;
  for (let i = 0; i < view.length; i += CHUNK) parser.write(view.subarray(i, i + CHUNK));
  return items;
}

export interface CsvData {
  headers: string[];
  records: Record<string, string>[];
}

export function parseCsvBytes(bytes: ArrayBuffer): CsvData {
  const text = new TextDecoder().decode(bytes).replace(/^﻿/, '');
  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return { headers: res.meta.fields ?? [], records: res.data };
}

export function headOf(bytes: ArrayBuffer, n = 64 * 1024): string {
  return new TextDecoder().decode(new Uint8Array(bytes, 0, Math.min(n, bytes.byteLength)));
}
