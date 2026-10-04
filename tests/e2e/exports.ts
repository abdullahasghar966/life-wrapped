/**
 * Exports in the platforms' real formats, generated so they are big enough to
 * unlock a deck (the fixtures are deliberately tiny). Ids follow the platforms'
 * formats, so the songs and videos can be offered to play (ADR-040).
 */

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

/** Spotify "Extended streaming history": 360 plays (about 18 hours) over the last 60 days. */
export function spotifyExtendedExport(): Buffer {
  const artists = Array.from({ length: 24 }, (_, i) => `Offline Artist ${i + 1}`);
  const now = Date.now();
  const rows = Array.from({ length: 360 }, (_, i) => {
    const artist = artists[(i * 7) % artists.length]!;
    const track = (i * 13) % 48;
    return {
      ts: iso(now - (i % 60) * DAY - (i % 17) * 3_600_000).slice(0, 19) + 'Z',
      platform: 'Android OS 14 API 34 (Generic, Phone)',
      ms_played: 180_000,
      conn_country: 'GB',
      master_metadata_track_name: `Song ${track + 1}`,
      master_metadata_album_artist_name: artist,
      master_metadata_album_album_name: `${artist} LP`,
      // 22 base-62 characters, like a real track id.
      spotify_track_uri: `spotify:track:offline${String(track).padStart(15, '0')}`,
      episode_name: null,
      episode_show_name: null,
      spotify_episode_uri: null,
      reason_start: 'trackdone',
      reason_end: 'trackdone',
      shuffle: false,
      skipped: false,
      offline: false,
      incognito_mode: false,
    };
  });
  return Buffer.from(JSON.stringify(rows));
}

/** YouTube Takeout watch history: 120 watches of 12 videos over the last 40 days. */
export function youtubeWatchExport({
  title = (n: number) => `Video number ${n}`,
}: { title?: (n: number) => string } = {}): Buffer {
  const now = Date.now();
  const rows = Array.from({ length: 120 }, (_, i) => {
    // Later videos come up more and more often, so video 12 is the most watched.
    const v = Math.floor(Math.sqrt(i * 1.2)) % 12;
    return {
      header: 'YouTube',
      title: `Watched ${title(v + 1)}`,
      titleUrl: `https://www.youtube.com/watch?v=e2eVideo${String(v).padStart(3, '0')}`,
      subtitles: [
        {
          name: `Channel ${(v % 5) + 1}`,
          url: `https://www.youtube.com/channel/UCe2e00000000000000000${v % 5}`,
        },
      ],
      time: iso(now - (i % 40) * DAY - (i % 9) * 3_600_000),
      products: ['YouTube'],
      activityControls: ['YouTube watch history'],
    };
  });
  return Buffer.from(JSON.stringify(rows));
}
