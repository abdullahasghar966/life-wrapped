import { describe, expect, it } from 'vitest';
import { mergeSpotify, parseSpotifyAccount, parseSpotifyExtended } from '@/engine/ingest/spotify';
import { fixtureJson } from '../helpers/fixtures';

describe('Spotify Extended (new format)', () => {
  const { rows, skipped } = parseSpotifyExtended(
    fixtureJson('spotify/Streaming_History_Audio_2025.json'),
  );

  it('keeps music, podcasts and audiobooks and drops unclassifiable rows', () => {
    expect(rows.map((r) => r.kind)).toEqual(['music', 'music', 'music', 'podcast', 'audiobook']);
    expect(skipped).toBe(2); // the no-content row and the invalid timestamp
  });

  it('derives start time as ts − ms_played', () => {
    expect(rows[0]!.ts).toBe(Date.parse('2025-03-14T23:41:07Z') - 201345);
    expect(rows[0]!.ms).toBe(201345);
  });

  it('marks skips from skipped=true or reason_end=fwdbtn', () => {
    expect(rows.map((r) => r.skipped)).toEqual([false, true, true, false, false]);
  });

  it('flags private sessions', () => {
    expect(rows.map((r) => r.privateSession)).toEqual([false, false, true, false, false]);
  });

  it('maps podcast and audiobook fields', () => {
    expect(rows[3]).toMatchObject({
      show: 'The Long Table',
      episode: 'Why we dream',
      artist: null,
    });
    expect(rows[4]).toMatchObject({ show: "The Cartographer's Garden", episode: 'Chapter 3' });
  });

  it('never keeps sensitive fields', () => {
    for (const r of rows) {
      const keys = Object.keys(r);
      for (const k of ['ip_addr', 'username', 'user_agent_decrypted', 'offline_timestamp']) {
        expect(keys).not.toContain(k);
      }
    }
    expect(JSON.stringify(rows)).not.toContain('203.0.113.7');
    expect(JSON.stringify(rows)).not.toContain('fixture-user');
  });
});

describe('Spotify Extended (old endsong format)', () => {
  it('parses rows with null skipped and drops ip_addr_decrypted', () => {
    const { rows } = parseSpotifyExtended(fixtureJson('spotify/endsong_0.json'));
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ track: 'Cold Rivers', skipped: true, reasonEnd: 'fwdbtn' });
    expect(JSON.stringify(rows)).not.toContain('198.51.100.4');
  });
});

describe('Spotify Account data', () => {
  it('parses music with minute-precision endTime', () => {
    const { rows } = parseSpotifyAccount(fixtureJson('spotify/StreamingHistory_music_0.json'));
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ kind: 'music', artist: 'Nova Vale', source: 'account' });
    expect(rows[0]!.ts).toBe(Date.parse('2025-03-10T08:15:00Z') - 201345);
    // In Account data a skip means msPlayed < 30 s.
    expect(rows.map((r) => r.skipped)).toEqual([false, true, false, true]);
  });

  it('parses podcasts', () => {
    const { rows } = parseSpotifyAccount(fixtureJson('spotify/StreamingHistory_podcast_0.json'));
    expect(rows.every((r) => r.kind === 'podcast' && r.show === 'Small Hours Science')).toBe(true);
  });

  it('parses the older StreamingHistory0.json name', () => {
    expect(parseSpotifyAccount(fixtureJson('spotify/StreamingHistory0.json')).rows).toHaveLength(2);
  });
});

describe('mergeSpotify', () => {
  it('prefers Extended where the date ranges overlap and never double counts', () => {
    const ext = parseSpotifyExtended(fixtureJson('spotify/Streaming_History_Audio_2025.json')).rows;
    const acc = parseSpotifyAccount(fixtureJson('spotify/StreamingHistory_music_0.json')).rows;
    const merged = mergeSpotify(ext, acc);
    // Extended covers 14–17 March; account rows on 10 March and 20 March survive, 14 March is dropped.
    const accountKept = merged.filter((r) => r.source === 'account');
    expect(accountKept.map((r) => new Date(r.ts).toISOString().slice(0, 10))).toEqual([
      '2025-03-10',
      '2025-03-10',
      '2025-03-20',
    ]);
    expect(merged).toHaveLength(ext.length + 3);
  });
});
