import { readFileSync } from 'node:fs';
import path from 'node:path';

export const FIXTURES = path.join(__dirname, '..', 'fixtures');

export function fixturePath(rel: string): string {
  return path.join(FIXTURES, rel);
}

export function fixtureText(rel: string): string {
  return readFileSync(fixturePath(rel), 'utf8');
}

export function fixtureJson(rel: string): unknown[] {
  return JSON.parse(fixtureText(rel)) as unknown[];
}

/** A fixture as a browser-style File, so it goes through the real ingestion code. */
export function fixtureFile(rel: string, name = path.basename(rel)): File {
  return new File([readFileSync(fixturePath(rel))], name);
}
