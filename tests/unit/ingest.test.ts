import { strToU8, zipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unzipFiltered } from '@/engine/ingest/unzip';
import { TEST_TZ, createTestEngine, type TestEngine } from '../helpers/engine';
import { fixtureFile, fixturePath } from '../helpers/fixtures';

function zipFile(name: string, entries: Record<string, Uint8Array>): File {
  return new File([zipSync(entries)], name);
}

describe('unzipFiltered', () => {
  it('only inflates known export entries', async () => {
    const zip = zipFile('takeout.zip', {
      'Takeout/YouTube and YouTube Music/history/watch-history.json': readFileSync(
        fixturePath('youtube/watch-history.json'),
      ),
      'Takeout/Profile/Profile.json': strToU8('{"email":"someone@example.com"}'),
      'Spotify Account Data/Userdata.json': strToU8('{"username":"secret"}'),
    });
    const { entries, ignored } = await unzipFiltered(zip);
    expect(entries.map((e) => e.path)).toEqual([
      'Takeout/YouTube and YouTube Music/history/watch-history.json',
    ]);
    expect(ignored).toBe(2);
  });
});

describe('engine ingestion of real-format fixtures', () => {
  let t: TestEngine;
  beforeAll(async () => {
    t = await createTestEngine();
  });
  afterAll(() => t.db.close());

  it('ingests every fixture and reports each file', async () => {
    const summary = await t.engine.ingest(
      [
        fixtureFile('spotify/Streaming_History_Audio_2025.json'),
        fixtureFile('spotify/endsong_0.json'),
        fixtureFile('spotify/StreamingHistory_music_0.json'),
        fixtureFile('spotify/StreamingHistory_podcast_0.json'),
        fixtureFile('youtube/watch-history.json'),
        fixtureFile('youtube/historial-de-reproducciones.json'),
        fixtureFile('youtube/search-history.json'),
        fixtureFile('netflix/ViewingActivity.csv'),
      ],
      { timeZone: TEST_TZ },
    );
    expect(summary.isSample).toBe(false);
    expect(summary.files.map((f) => [f.kind, f.status])).toEqual([
      ['spotify_extended', 'ok'],
      ['spotify_extended', 'ok'],
      ['spotify_account', 'ok'],
      ['spotify_account', 'ok'],
      ['youtube_watch', 'ok'],
      ['youtube_watch', 'ok'],
      ['youtube_search', 'ok'],
      ['netflix_viewing', 'ok'],
    ]);
    expect(summary.files[0]!.message).toBe('Recognised as Spotify Extended · 5 rows · 2 skipped');
    // 5 + 2 Extended rows. Extended covers 2021-06-01 → 2025-03-17, so the only Account row
    // that survives is the one on 2025-03-20; every podcast row is inside the range.
    expect(summary.counts.spotifyPlays).toBe(5 + 2 + 1);
    expect(summary.counts.youtubeWatches).toBe(5 + 5);
    expect(summary.counts.youtubeSearches).toBe(3);
    expect(summary.counts.netflixViews).toBe(12);
    expect(summary.netflixProfiles.map((p) => p.name)).toEqual(['Alex', 'Sam']);
    expect(summary.options.netflixProfile).toBe('Alex');
    expect(summary.ranges.spotify).toEqual({ first: '2021-06-01', last: '2025-03-20' });
  });

  it('never stores dropped fields in the tables', async () => {
    const cols = await t.q<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'main'`,
    );
    const names = cols.map((c) => c.column_name.toLowerCase());
    for (const banned of [
      'ip_addr',
      'username',
      'user_agent_decrypted',
      'bookmark',
      'activitycontrols',
    ]) {
      expect(names.some((n) => n.includes(banned))).toBe(false);
    }
  });

  it('skips identical files and identical rows', async () => {
    const summary = await t.engine.ingest(
      [fixtureFile('youtube/watch-history.json', 'copy.json')],
      {
        timeZone: TEST_TZ,
      },
    );
    expect(summary.files.at(-1)).toMatchObject({ status: 'duplicate' });
    expect(summary.counts.youtubeWatches).toBe(10);
  });

  it('explains the YouTube HTML export instead of parsing it', async () => {
    const summary = await t.engine.ingest([fixtureFile('youtube/watch-history.html')], {
      timeZone: TEST_TZ,
    });
    expect(summary.youtubeHtmlFound).toBe(true);
    expect(summary.files.at(-1)).toMatchObject({ kind: 'youtube_html', status: 'unsupported' });
    expect(summary.files.at(-1)!.message).toMatch(/JSON/);
  });

  it('ignores unsupported files with a friendly message', async () => {
    const summary = await t.engine.ingest(
      [new File(['{"email":"x"}'], 'Userdata.json'), new File(['hello'], 'notes.txt')],
      { timeZone: TEST_TZ },
    );
    expect(summary.files.slice(-2).map((f) => f.status)).toEqual(['unsupported', 'unsupported']);
  });

  it('reads zips and changes time zone without losing data', async () => {
    const zip = zipFile('my_spotify_data.zip', {
      'Spotify Account Data/StreamingHistory0.json': readFileSync(
        fixturePath('spotify/StreamingHistory0.json'),
      ),
      'Spotify Account Data/Userdata.json': strToU8('{"username":"secret"}'),
    });
    const before = await t.engine.ingest([zip], { timeZone: TEST_TZ });
    expect(before.files.at(-1)!.name).toBe(
      'my_spotify_data.zip › Spotify Account Data/StreamingHistory0.json',
    );
    const [h1] = await t.q<{ h: number }>(
      `SELECT local_hour::DOUBLE AS h FROM spotify_plays WHERE track = 'Late Postcards'`,
    );
    const after = await t.engine.setOptions({ timeZone: 'Asia/Tokyo' });
    const [h2] = await t.q<{ h: number }>(
      `SELECT local_hour::DOUBLE AS h FROM spotify_plays WHERE track = 'Late Postcards'`,
    );
    expect(after.counts.spotifyPlays).toBe(before.counts.spotifyPlays);
    expect(h1?.h).toBe(22); // 22:00 GMT in November
    expect(h2?.h).toBe(7); // 07:00 next morning in Tokyo
  });

  it('clears everything', async () => {
    await t.engine.clear();
    expect(await t.engine.summary()).toBeNull();
    expect(await t.engine.availableDecks()).toEqual([]);
  });
});
