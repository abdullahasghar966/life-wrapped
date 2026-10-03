/**
 * Large exports in the real formats, for the ingestion budget (500k rows in
 * under 10 s). Values are synthetic but shaped like the platforms' files,
 * including the fields we drop, so the whole pipeline does its usual work.
 */
const DAY = 86_400_000;
const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** Spotify Extended streaming history, split into files like the real export. */
export function spotifyExtendedFiles(rows: number, end: number, perFile = 20_000): File[] {
  const files: File[] = [];
  for (let start = 0, n = 0; start < rows; start += perFile, n++) {
    const parts: string[] = [];
    for (let i = start; i < Math.min(rows, start + perFile); i++) {
      const artist = i % 1_500;
      const track = i % 9_000;
      parts.push(
        JSON.stringify({
          ts:
            new Date(end - (i % 365) * DAY - (i % 1_440) * 60_000).toISOString().slice(0, 19) + 'Z',
          username: 'perf-user',
          platform: 'Android OS 14 API 34 (Generic, Phone)',
          ms_played: 30_000 + ((i * 7_919) % 210_000),
          conn_country: 'GB',
          ip_addr: '203.0.113.7',
          user_agent_decrypted: 'unknown',
          master_metadata_track_name: `Track ${track}`,
          master_metadata_album_artist_name: `Artist ${artist}`,
          master_metadata_album_album_name: `Album ${artist}`,
          spotify_track_uri: `spotify:track:perf${pad(track, 18)}`,
          episode_name: null,
          episode_show_name: null,
          spotify_episode_uri: null,
          reason_start: 'trackdone',
          reason_end: i % 5 === 0 ? 'fwdbtn' : 'trackdone',
          shuffle: i % 3 === 0,
          skipped: i % 5 === 0,
          offline: false,
          offline_timestamp: 0,
          incognito_mode: false,
        }),
      );
    }
    files.push(new File([`[${parts.join(',')}]`], `Streaming_History_Audio_${n}.json`));
  }
  return files;
}

/** Google Takeout watch history (one JSON file). */
export function youtubeWatchHistory(rows: number, end: number): File {
  const parts: string[] = [];
  for (let i = 0; i < rows; i++) {
    const channel = i % 800;
    parts.push(
      JSON.stringify({
        header: 'YouTube',
        title: `Watched Video number ${i % 40_000}`,
        titleUrl: `https://www.youtube.com/watch?v=perf${pad(i % 40_000, 7)}`,
        subtitles: [
          {
            name: `Channel ${channel}`,
            url: `https://www.youtube.com/channel/UCperf${pad(channel, 18)}`,
          },
        ],
        time: new Date(end - i * 9 * 60_000).toISOString(),
        products: ['YouTube'],
        activityControls: ['YouTube watch history'],
      }),
    );
  }
  return new File([`[${parts.join(',')}]`], 'watch-history.json');
}

/** Netflix ViewingActivity.csv. */
export function netflixViewingActivity(rows: number, end: number): File {
  const lines = [
    'Profile Name,Start Time,Duration,Attributes,Title,Supplemental Video Type,Device Type,Bookmark,Latest Bookmark,Country',
  ];
  for (let i = 0; i < rows; i++) {
    const d = new Date(end - i * 47 * 60_000);
    const start = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
    const title =
      i % 4 === 0
        ? `Perf Film ${i % 300}`
        : `Perf Series ${i % 120}: Season ${1 + (i % 3)}: Episode ${i % 10}`;
    lines.push(
      `Alex,${start},00:4${i % 10}:12,,${title},,Samsung 2019 UHD TV (Tizen),00:41:00,00:41:00,GB (United Kingdom)`,
    );
  }
  return new File([lines.join('\n')], 'ViewingActivity.csv');
}
