import { describe, expect, it } from 'vitest';
import {
  parseYoutubeSearches,
  parseYoutubeWatches,
  stripVerb,
  videoIdFromUrl,
} from '@/engine/ingest/youtube';
import { fixtureJson } from '../helpers/fixtures';

describe('YouTube watch history', () => {
  const { rows, ads, skipped } = parseYoutubeWatches(fixtureJson('youtube/watch-history.json'));

  it('excludes ads', () => {
    expect(ads).toBe(1);
    expect(skipped).toBe(1);
    expect(rows.some((r) => r.title?.includes('mattress'))).toBe(false);
  });

  it('extracts video ids, titles and channels', () => {
    expect(rows[0]).toMatchObject({
      videoId: 'fixtureVid1',
      title: 'How do magnets work?',
      channel: 'Brainlight Labs',
      product: 'youtube',
      unavailable: false,
    });
  });

  it('counts removed and private videos as unavailable', () => {
    const unavailable = rows.filter((r) => r.unavailable);
    expect(unavailable).toHaveLength(2);
    expect(unavailable.every((r) => r.title === null && r.videoId === null)).toBe(true);
  });

  it('strips " - Topic" from YouTube Music channels', () => {
    const music = rows.find((r) => r.product === 'youtube_music');
    expect(music).toMatchObject({ channel: 'Nova Vale', title: 'Paper Moons' });
  });

  it('never keeps activityControls', () => {
    expect(JSON.stringify(rows)).not.toContain('activityControls');
  });
});

describe('localised exports', () => {
  it('strips verbs in Spanish, German and French, and keeps unknown titles whole', () => {
    const { rows } = parseYoutubeWatches(fixtureJson('youtube/historial-de-reproducciones.json'));
    expect(rows.map((r) => r.title)).toEqual([
      'Cómo funcionan los imanes',
      'Pasta fácil en 10 minutos',
      'Regen auf dem Blechdach',
      'La carte qui ment',
      'Un vídeo sin verbo conocido',
    ]);
  });

  it('stripVerb handles prefix + suffix verbs', () => {
    expect(stripVerb('Du hast nach Pasta gesucht', [['Du hast nach ', ' gesucht']])).toBe('Pasta');
  });
});

describe('YouTube search history', () => {
  it('parses queries in several languages', () => {
    const { rows } = parseYoutubeSearches(fixtureJson('youtube/search-history.json'));
    expect(rows.map((r) => r.query)).toEqual(['easy pasta', 'magnets explained', 'pasta fácil']);
  });
});

describe('videoIdFromUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abc123', 'abc123'],
    ['https://music.youtube.com/watch?v=xyz&list=1', 'xyz'],
    ['https://youtu.be/short1', 'short1'],
    ['https://www.youtube.com/results?search_query=x', null],
    ['not a url', null],
    [null, null],
  ])('%s → %s', (url, id) => {
    expect(videoIdFromUrl(url)).toBe(id);
  });
});
