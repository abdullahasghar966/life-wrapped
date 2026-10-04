import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isVideoId, trackIdFromUri } from '@/engine/media';
import { fixtureFile } from '../helpers/fixtures';
import { createTestEngine, TEST_TZ, type TestEngine } from '../helpers/engine';

describe('songs and videos to play alongside the stories', () => {
  let t: TestEngine;
  beforeAll(async () => {
    t = await createTestEngine();
  });
  afterAll(() => t.db.close());

  it('offers the top songs and videos from real exports, with checked ids', async () => {
    await t.engine.ingest(
      [
        fixtureFile('spotify/Streaming_History_Audio_2025.json'),
        fixtureFile('spotify/endsong_0.json'),
        fixtureFile('youtube/watch-history.json'),
      ],
      { timeZone: TEST_TZ },
    );
    const media = await t.engine.topMedia();
    // Velvet Static was skipped after 12 s, and its only full play was in a private session.
    expect(media.songs).toEqual([
      { track: 'Paper Moons', artist: 'Nova Vale', plays: 1, trackId: 'fixture000000000000001' },
    ]);
    // The ad, the removed video and the one whose title is only a URL are never offered.
    expect(media.videos.map((v) => [v.videoId, v.title])).toEqual([
      ['fixtureVid1', 'How do magnets work?'],
      ['fixtureVid2', 'Rain on a tin roof'],
      ['fixtureMus1', 'Paper Moons'],
    ]);
  });

  it('includes private sessions only when the person turns them on', async () => {
    await t.engine.setOptions({ includePrivateSessions: true });
    const media = await t.engine.topMedia();
    expect(media.songs.map((s) => s.track)).toEqual(['Paper Moons', 'Velvet Static']);
    await t.engine.setOptions({ includePrivateSessions: false });
  });

  it('offers nothing for the sample, whose ids are made up', async () => {
    await t.engine.loadSample(undefined, { timeZone: TEST_TZ });
    expect(await t.engine.topMedia()).toEqual({ songs: [], videos: [] });
  });

  it('only accepts ids in the platforms’ own formats', () => {
    expect(trackIdFromUri('spotify:track:6rqhFgbbKwnb9MLmUQDhG6')).toBe('6rqhFgbbKwnb9MLmUQDhG6');
    for (const bad of [
      null,
      '',
      'spotify:episode:6rqhFgbbKwnb9MLmUQDhG6',
      'spotify:track:6rqhFgbbKwnb9MLmUQDhG',
      'spotify:track:6rqhFgbbKwnb9MLmUQDhG6?autoplay',
      'spotify:track:../../6rqhFgbbKwnb9MLmUQ',
    ]) {
      expect(trackIdFromUri(bad)).toBeNull();
    }
    expect(isVideoId('dQw4w9WgXcQ')).toBe(true);
    expect(isVideoId('a-b_c-d_e-f')).toBe(true);
    for (const bad of [null, '', 'dQw4w9WgXc', 'dQw4w9WgXcQQ', 'dQw4w9Wg"cQ', '../w9WgXcQ/']) {
      expect(isVideoId(bad)).toBe(false);
    }
  });
});
