import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';

const MIN = 60_000;
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const accountTime = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
const json = (name: string, rows: unknown[]) => new File([JSON.stringify(rows)], name);
const BASE = Date.parse('2026-03-02T10:00:00Z');

let t: TestEngine;
beforeEach(async () => {
  t = await createTestEngine();
});
afterEach(() => t.db.close());

const ids = async (deck: 'spotify' | 'youtube' | 'netflix' | 'life') =>
  (await t.engine.getDeck(deck)).map((c) => c.id);

describe('minimum-data rules hide cards instead of showing empty ones', () => {
  it('Spotify: 70 minutes from 2 artists on 2 days shows only opener, minutes and summary', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      endTime: accountTime(BASE + (i < 10 ? 0 : 86_400_000) + i * 4 * MIN),
      artistName: i % 2 ? 'Nova Vale' : 'Static Bloom',
      trackName: `Song ${i % 4}`,
      msPlayed: 210_000,
    }));
    await t.engine.ingest([json('StreamingHistory_music_0.json', rows)], { timeZone: TEST_TZ });
    expect(await ids('spotify')).toEqual(['spotify.opener', 'spotify.minutes', 'spotify.summary']);
    const summary = (await t.engine.getDeck('spotify')).at(-1)!;
    expect(summary.props).toMatchObject({
      topArtist: null,
      topTrack: null,
      persona: null,
      streak: null,
    });
  });

  it('Spotify deck needs an hour of music', async () => {
    const rows = [
      { endTime: accountTime(BASE), artistName: 'A', trackName: 'B', msPlayed: 59 * MIN },
    ];
    const summary = await t.engine.ingest([json('StreamingHistory0.json', rows)], {
      timeZone: TEST_TZ,
    });
    expect(summary.availableDecks).toEqual([]);
    expect(await ids('spotify')).toEqual([]);
  });

  it('YouTube: 60 isolated watches from 3 channels hide channel, rabbit-hole and rhythm cards', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => ({
      header: 'YouTube',
      title: `Watched Video ${i}`,
      titleUrl: `https://www.youtube.com/watch?v=vid${i}`,
      subtitles: [{ name: `Channel ${i % 3}` }],
      time: iso(BASE + i * 25 * MIN),
    }));
    await t.engine.ingest([json('watch-history.json', rows)], { timeZone: TEST_TZ });
    expect(await ids('youtube')).toEqual(['youtube.opener', 'youtube.total', 'youtube.summary']);
  });

  it('Netflix: one profile watching films on one TV in one country', async () => {
    const lines = [
      'Profile Name,Start Time,Duration,Attributes,Title,Supplemental Video Type,Device Type,Bookmark,Latest Bookmark,Country',
    ];
    for (let i = 0; i < 4; i++) {
      lines.push(
        `Kim,2026-03-0${i + 1} 20:00:00,01:40:00,,Film ${i},,Roku Ultra,01:40:00,01:40:00,US (United States)`,
      );
    }
    await t.engine.ingest([new File([lines.join('\n')], 'ViewingActivity.csv')], {
      timeZone: TEST_TZ,
    });
    expect(await ids('netflix')).toEqual(['netflix.opener', 'netflix.hours', 'netflix.summary']);
  });

  it('the Life deck needs two platform decks', async () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      endTime: accountTime(BASE + i * 4 * MIN),
      artistName: 'A',
      trackName: 'B',
      msPlayed: 200_000,
    }));
    const summary = await t.engine.ingest([json('StreamingHistory0.json', rows)], {
      timeZone: TEST_TZ,
    });
    expect(summary.availableDecks).toEqual(['spotify']);
    expect(await ids('life')).toEqual([]);
  });
});

describe('privacy rules inside insights', () => {
  const extended = (artist: string, privateSession: boolean, n: number, offsetDays: number) =>
    Array.from({ length: n }, (_, i) => ({
      ts: iso(BASE + offsetDays * 86_400_000 + i * 4 * MIN),
      ms_played: 200_000,
      master_metadata_track_name: `${artist} song ${i % 3}`,
      master_metadata_album_artist_name: artist,
      incognito_mode: privateSession,
    }));

  it('private sessions count in minutes but never in top lists, unless the user opts in', async () => {
    const rows = [
      ...extended('Secret Artist', true, 40, 0),
      ...['A', 'B', 'C', 'D', 'E'].flatMap((a, i) => extended(a, false, 6, i + 1)),
    ];
    await t.engine.ingest([json('Streaming_History_Audio_2026.json', rows)], { timeZone: TEST_TZ });
    const deck = await t.engine.getDeck('spotify');
    const minutes = deck.find((c) => c.id === 'spotify.minutes')!.props as { minutes: number };
    expect(minutes.minutes).toBe(Math.round((70 * 200_000) / 60_000));
    const top = deck.find((c) => c.id === 'spotify.topArtist')!.props as { artist: string };
    expect(top.artist).not.toBe('Secret Artist');
    expect(JSON.stringify(deck)).not.toContain('Secret Artist');

    await t.engine.setOptions({ includePrivateSessions: true });
    const opted = await t.engine.getDeck('spotify');
    expect(
      (opted.find((c) => c.id === 'spotify.topArtist')!.props as { artist: string }).artist,
    ).toBe('Secret Artist');
  });

  it('YouTube searches are off by default for real data', async () => {
    const watches = Array.from({ length: 80 }, (_, i) => ({
      header: 'YouTube',
      title: `Watched V${i}`,
      titleUrl: `https://www.youtube.com/watch?v=v${i}`,
      subtitles: [{ name: `C${i % 12}` }],
      time: iso(BASE + i * 3 * 3_600_000),
    }));
    const searches = [
      {
        header: 'YouTube',
        title: 'Searched for something personal',
        titleUrl: 'https://www.youtube.com/results?search_query=something+personal',
        time: iso(BASE),
      },
    ];
    await t.engine.ingest(
      [json('watch-history.json', watches), json('search-history.json', searches)],
      {
        timeZone: TEST_TZ,
      },
    );
    expect(await ids('youtube')).not.toContain('youtube.searches');
    await t.engine.setOptions({ includeSearches: true });
    expect(await ids('youtube')).toContain('youtube.searches');
  });

  it('Netflix only ever reads the selected profile', async () => {
    const lines = [
      'Profile Name,Start Time,Duration,Attributes,Title,Supplemental Video Type,Device Type,Bookmark,Latest Bookmark,Country',
    ];
    for (let i = 0; i < 8; i++) {
      lines.push(
        `Kim,2026-03-0${i + 1} 20:00:00,01:00:00,,Kim Show: Season 1: Ep ${i},,Roku,01:00:00,01:00:00,US (United States)`,
      );
      lines.push(
        `Lee,2026-03-0${i + 1} 18:00:00,00:50:00,,Lee Secret Show: Season 1: Ep ${i},,Roku,00:50:00,00:50:00,US (United States)`,
      );
    }
    const summary = await t.engine.ingest([new File([lines.join('\n')], 'ViewingActivity.csv')], {
      timeZone: TEST_TZ,
    });
    expect(summary.options.netflixProfile).toBe('Kim');
    expect(JSON.stringify(await t.engine.getDeck('netflix'))).not.toContain('Lee Secret Show');
    await t.engine.setOptions({ netflixProfile: 'Lee' });
    const lee = JSON.stringify(await t.engine.getDeck('netflix'));
    expect(lee).toContain('Lee Secret Show');
    expect(lee).not.toContain('Kim Show');
  });
});

describe('period selection', () => {
  it('offers the last 12 months and each calendar year, and filters by it', async () => {
    const rows = [
      ...Array.from({ length: 30 }, (_, i) => ({
        endTime: accountTime(Date.parse('2025-06-01T10:00:00Z') + i * 4 * MIN),
        artistName: 'Old',
        trackName: 'Old song',
        msPlayed: 200_000,
      })),
      ...Array.from({ length: 30 }, (_, i) => ({
        endTime: accountTime(Date.parse('2026-02-01T10:00:00Z') + i * 4 * MIN),
        artistName: 'New',
        trackName: 'New song',
        msPlayed: 200_000,
      })),
    ];
    const summary = await t.engine.ingest([json('StreamingHistory0.json', rows)], {
      timeZone: TEST_TZ,
    });
    expect(summary.periods.map((p) => p.id)).toEqual(['last12', '2026', '2025']);
    expect(summary.period).toMatchObject({ id: 'last12', start: '2025-02-02', end: '2026-02-02' });
    const after = await t.engine.setOptions({ period: '2025' });
    expect(after.period?.id).toBe('2025');
    const minutes = (await t.engine.getDeck('spotify')).find((c) => c.id === 'spotify.minutes')!
      .props as {
      minutes: number;
    };
    expect(minutes.minutes).toBe(100);
  });
});
