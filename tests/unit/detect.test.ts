import { describe, expect, it } from 'vitest';
import {
  detectCsv,
  detectHtml,
  detectJson,
  formatOf,
  isInterestingZipEntry,
} from '@/engine/ingest/detect';
import { fixtureJson, fixtureText } from '../helpers/fixtures';

describe('detectJson (shape first, name second)', () => {
  it.each([
    ['spotify/Streaming_History_Audio_2025.json', 'spotify_extended'],
    ['spotify/endsong_0.json', 'spotify_extended'],
    ['spotify/StreamingHistory_music_0.json', 'spotify_account'],
    ['spotify/StreamingHistory_podcast_0.json', 'spotify_account'],
    ['spotify/StreamingHistory0.json', 'spotify_account'],
    ['youtube/watch-history.json', 'youtube_watch'],
    ['youtube/historial-de-reproducciones.json', 'youtube_watch'],
    ['youtube/search-history.json', 'youtube_search'],
  ])('%s → %s', (file, kind) => {
    expect(detectJson(file, fixtureJson(file))).toBe(kind);
  });

  it('ignores the file name when the shape disagrees', () => {
    const data = fixtureJson('spotify/StreamingHistory_music_0.json');
    expect(detectJson('watch-history.json', data)).toBe('spotify_account');
  });

  it('detects localised file names by content', () => {
    const data = fixtureJson('youtube/search-history.json');
    expect(detectJson('historial-de-busqueda.json', data)).toBe('youtube_search');
  });

  it('returns unknown for unrelated JSON', () => {
    expect(detectJson('Userdata.json', { username: 'x', email: 'y' })).toBe('unknown');
    expect(detectJson('Playlist1.json', [{ name: 'Road trip', items: [] }])).toBe('unknown');
    expect(detectJson('empty.json', [])).toBe('unknown');
  });
});

describe('detectCsv', () => {
  it('recognises Netflix viewing activity by its header', () => {
    const header = fixtureText('netflix/ViewingActivity.csv').split('\n')[0]!.split(',');
    expect(detectCsv(header)).toBe('netflix_viewing');
  });
  it('tolerates a BOM', () => {
    const bom = String.fromCharCode(0xfeff);
    expect(detectCsv([`${bom}Profile Name`, 'Start Time', 'Duration', 'Title'])).toBe(
      'netflix_viewing',
    );
  });
  it('rejects other CSVs', () => {
    expect(detectCsv(['Date', 'Amount', 'Description'])).toBe('unknown');
  });
});

describe('detectHtml', () => {
  it('recognises the Takeout HTML history', () => {
    expect(detectHtml('watch-history.html', fixtureText('youtube/watch-history.html'))).toBe(
      'youtube_html',
    );
    expect(detectHtml('Verlauf.html', '<a href="https://www.youtube.com/watch?v=x">')).toBe(
      'youtube_html',
    );
    expect(detectHtml('index.html', '<html><body>hello</body></html>')).toBe('unknown');
  });
});

describe('formatOf / zip entry filter', () => {
  it('maps extensions', () => {
    expect(formatOf('A.ZIP')).toBe('zip');
    expect(formatOf('x.json')).toBe('json');
    expect(formatOf('ViewingActivity.csv')).toBe('csv');
    expect(formatOf('watch-history.html')).toBe('html');
    expect(formatOf('photo.jpg')).toBe('other');
  });

  it.each([
    ['Spotify Extended Streaming History/Streaming_History_Audio_2023-2024_1.json', true],
    ['Spotify Extended Streaming History/Streaming_History_Video_2024.json', true],
    ['MyData/endsong_3.json', true],
    ['Spotify Account Data/StreamingHistory_music_0.json', true],
    ['MyData/StreamingHistory0.json', true],
    ['Takeout/YouTube and YouTube Music/history/watch-history.json', true],
    ['Takeout/YouTube y YouTube Music/historial/historial-de-reproducciones.json', true],
    ['netflix-report/CONTENT_INTERACTION/ViewingActivity.csv', true],
    ['Spotify Account Data/Userdata.json', false],
    ['Spotify Account Data/Payments.json', false],
    ['netflix-report/ACCOUNT/AccountDetails.csv', false],
    ['Takeout/Mail/All mail.mbox', false],
    ['__MACOSX/Takeout/YouTube and YouTube Music/history/._watch-history.json', false],
    ['Takeout/YouTube and YouTube Music/', false],
  ])('%s → %s', (path, expected) => {
    expect(isInterestingZipEntry(path)).toBe(expected);
  });
});
