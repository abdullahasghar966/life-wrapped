import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import {
  deviceClassOf,
  parseCountry,
  parseNetflixTitle,
  parseNetflixViewing,
  seriesPrefixesOf,
} from '@/engine/ingest/netflix';
import { fixtureText } from '../helpers/fixtures';

const records = Papa.parse<Record<string, string>>(fixtureText('netflix/ViewingActivity.csv'), {
  header: true,
  skipEmptyLines: true,
}).data;

describe('Netflix viewing activity', () => {
  const { rows, skipped } = parseNetflixViewing(records);

  it('drops supplemental rows (trailers, hooks) and views under 60 s', () => {
    expect(skipped).toBe(3);
    expect(rows.some((r) => r.titleRaw.includes('_hook_'))).toBe(false);
    expect(rows.some((r) => r.titleRaw.includes('Trailer'))).toBe(false);
    expect(rows.every((r) => r.durationS >= 60)).toBe(true);
  });

  it('keeps every profile (the engine filters to the selected one)', () => {
    expect(new Set(rows.map((r) => r.profile))).toEqual(new Set(['Alex', 'Sam']));
  });

  it('parses times and durations', () => {
    expect(rows[0]).toMatchObject({
      ts: Date.parse('2025-03-15T20:00:00Z'),
      durationS: 48 * 60 + 12,
    });
  });

  it('never keeps bookmarks', () => {
    expect(JSON.stringify(rows)).not.toContain('Not latest view');
    for (const r of rows) expect(Object.keys(r)).not.toContain('Bookmark');
  });

  it('classifies titles', () => {
    const byTitle = Object.fromEntries(rows.map((r) => [r.titleRaw, r]));
    expect(byTitle['Midnight Harbor: Season 1: The Lighthouse Keeper']).toMatchObject({
      series: 'Midnight Harbor',
      season: 'Season 1',
      episode: 'The Lighthouse Keeper',
      isSeries: true,
    });
    expect(byTitle['The Glass Orchard: Limited Series: Part 1']).toMatchObject({
      series: 'The Glass Orchard',
      season: 'Limited Series',
      episode: 'Part 1',
    });
    expect(byTitle['Lanternfall: Part 2: Ember']).toMatchObject({
      series: 'Lanternfall',
      season: 'Part 2',
    });
    // Rule 2: three distinct titles share "Bureau of Lost Things".
    expect(byTitle['Bureau of Lost Things: The Umbrella']).toMatchObject({
      series: 'Bureau of Lost Things',
      season: null,
      episode: 'The Umbrella',
      isSeries: true,
    });
    // A colon alone doesn't make a series.
    expect(byTitle['Atlas: The Long Road']).toMatchObject({ isSeries: false, series: null });
    expect(byTitle['Paper Kingdoms, Revisited']).toMatchObject({ isSeries: false });
  });

  it('classifies devices and countries', () => {
    const devices = Object.fromEntries(rows.map((r) => [r.titleRaw, r.deviceClass]));
    expect(devices['Midnight Harbor: Season 1: Low Tide']).toBe('TV');
    expect(devices['Atlas: The Long Road']).toBe('Computer');
    expect(devices['Bureau of Lost Things: The Umbrella']).toBe('Tablet');
    expect(devices['Bureau of Lost Things: The Left Glove']).toBe('TV');
    expect(devices['Lanternfall: Part 2: Ember']).toBe('Phone');
    expect(devices['Paper Kingdoms, Revisited']).toBe('Other');
    const atlas = rows.find((r) => r.titleRaw === 'Atlas: The Long Road');
    expect(atlas).toMatchObject({ countryCode: 'AE', countryName: 'United Arab Emirates' });
  });
});

describe('parseNetflixTitle', () => {
  const none = new Set<string>();
  it.each([
    ['Show: Season 2: Pilot', { series: 'Show', season: 'Season 2', episode: 'Pilot' }],
    ['Show: Series 1: Episode 3', { series: 'Show', season: 'Series 1' }],
    ['Show: Volume 2: Part: Two', { season: 'Volume 2', episode: 'Part: Two' }],
    ['Show: Book 1: Water: Chapter 1', { season: 'Book 1', episode: 'Water: Chapter 1' }],
    ['Show: Miniseries: Night 1', { season: 'Miniseries' }],
    ['Serie: Temporada 1: El faro', { series: 'Serie', season: 'Temporada 1' }],
    ['Serie: Staffel 3: Der Hafen', { season: 'Staffel 3' }],
    ['Série: Saison 2: Le port', { season: 'Saison 2' }],
    ['Serie: Stagione 1: Il porto', { season: 'Stagione 1' }],
    ['Movie: Director’s Cut: Extended', { isSeries: false }],
    ['Just a Movie', { isSeries: false }],
  ])('%s', (title, expected) => {
    expect(parseNetflixTitle(title, none)).toMatchObject(expected);
  });

  it('needs three distinct titles for rule 2', () => {
    expect([...seriesPrefixesOf(['A: x', 'A: y'])]).toEqual([]);
    expect([...seriesPrefixesOf(['A: x', 'A: y', 'A: z', 'A: x'])]).toEqual(['A']);
  });
});

describe('deviceClassOf / parseCountry', () => {
  it.each([
    ['Apple TV 4K', 'TV'],
    ['Chromecast with Google TV', 'TV'],
    ['Sony PlayStation 5', 'TV'],
    ['Microsoft Xbox Series X', 'TV'],
    ['Amazon Kindle Fire HD 10', 'Tablet'],
    ['Android Tablet', 'Tablet'],
    ['Apple iPhone 15 Pro', 'Phone'],
    ['Netflix Windows App - Cadmium Windows Mobile', 'Computer'],
    ['Mac Safari (Cadmium)', 'Computer'],
    ['Microsoft Edge (Cadmium)', 'Computer'],
    [null, 'Other'],
  ])('%s → %s', (device, cls) => {
    expect(deviceClassOf(device)).toBe(cls);
  });

  it('parses "PK (Pakistan)"', () => {
    expect(parseCountry('PK (Pakistan)')).toEqual({ code: 'PK', name: 'Pakistan' });
    expect(parseCountry('US')).toEqual({ code: 'US', name: null });
    expect(parseCountry('')).toEqual({ code: null, name: null });
  });
});
