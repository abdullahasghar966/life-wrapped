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

/**
 * Real exports carry far longer names than the sample: 100-character video
 * titles with hashtags and emoji, artist lists, numbered episode titles. These
 * three exports unlock every deck with names like that, for layout tests.
 */
export function longNameExports(): { spotify: Buffer; youtube: Buffer; netflix: Buffer } {
  const now = Date.now();
  const artists = [
    'Anirudh Ravichander, Arijit Singh & Shilpa Rao',
    'Wolfgang Amadeus Mozart, Berliner Philharmoniker, Herbert von Karajan',
    'AP Dhillon, Gurinder Gill & Shinda Kahlon',
    'Florence + The Machine',
    'BTS (방탄소년단)',
    'Coke Studio Pakistan',
    'Kendrick Lamar',
    'Hans Zimmer',
  ];
  const tracks = [
    'Symphony No. 40 in G Minor, K. 550: I. Molto allegro (Remastered 2019) [Live at Salzburg]',
    'Pasoori (Coke Studio Season 14) [feat. Shae Gill & Ali Sethi]',
    'Time (from “Inception” Original Motion Picture Soundtrack) – Extended Version',
    'Dog Days Are Over (2010 Remastered Version)',
    'Chaleya (From “Jawan”)',
    'Brown Munde',
    'Not Like Us',
    'Dynamite (Official Instrumental) – Extended Mix',
  ];
  const spotify = Array.from({ length: 420 }, (_, i) => {
    // The longest names win: the most-played artist and song.
    const a = i % 3 === 0 ? 1 : (i * 5) % artists.length;
    const t = i % 4 === 0 ? 0 : (i * 3 + (i % 2)) % tracks.length;
    return {
      ts: iso(now - (i % 70) * DAY - (i % 13) * 3_600_000).slice(0, 19) + 'Z',
      platform: 'Windows 10 (10.0.19045; x64)',
      ms_played: 150_000 + (i % 5) * 20_000,
      conn_country: 'PK',
      master_metadata_track_name: tracks[t],
      master_metadata_album_artist_name: artists[a],
      master_metadata_album_album_name: `${artists[a]} – The Complete Collection (Deluxe)`,
      spotify_track_uri: `spotify:track:longname${String(t * 10 + a).padStart(14, '0')}`,
      episode_name: null,
      episode_show_name: null,
      spotify_episode_uri: null,
      reason_start: 'trackdone',
      reason_end: i % 7 === 0 ? 'fwdbtn' : 'trackdone',
      shuffle: i % 3 === 0,
      skipped: i % 7 === 0,
      offline: false,
      incognito_mode: false,
    };
  });

  const titles = [
    'Rap Icon Pakistan | Episode 3 | Talha Anjum, Bohemia',
    'Nolan faces a nuclear threat alongside a group of criminals! #therookie #series #edit',
    'Kai Cenat vs Fanum in the Coldest Star Wars Battle Ever (You Won’t Believe the Ending) 😱🔥',
    'GUESS THE MUSLIM (FT. CHUNKZ, SHARKY & BRAZAVILLE) | Ramadan Special 2025 – Who Is Lying?',
    'Talia Mar Cries At SIDEMEN STAY OVERNIGHT IN AN ABANDONED HOSPITAL (Most Haunted Place)',
    'How To Use Claude Design For Beginners — Full Course in 60 Minutes (No Experience Needed)',
    'COMEDIAN JUSTIN SILVA TRAINS AT THE MOST DANGEROUS GYM IN THE WORLD 💀 #shorts #fyp',
    '【公式】米津玄師 MV「KICK BACK」Official Music Video (4K Remaster) チェンソーマン',
    '#foryou #movie #therookie #edit #fyp',
    'Lo-fi beats to study / relax / sleep to ☕ 24/7 live radio — chill hip hop instrumental mix',
  ];
  const channels = [
    'PixelEntertainment Official Music & Entertainment Network',
    'Harry Pinero',
    'Talia Mar+',
    'corbin',
    'Haddy Abdel',
    'Lofi Girl',
    'ゆっくり実況チャンネル Official',
    'The Extremely Long Channel Name That Goes On And On TV',
  ];
  const watches: Array<{ v: number; t: number }> = [];
  // Every day a few videos; every fifth day a long late-night rabbit hole, 2 minutes apart.
  for (let d = 0; d < 45; d++) {
    const day = now - d * DAY;
    for (let k = 0; k < 4; k++)
      watches.push({ v: (d + k) % titles.length, t: day - (6 + k * 3) * 3_600_000 });
    if (d % 5 === 0) {
      for (let k = 0; k < 40; k++)
        watches.push({ v: (d + k * 7) % titles.length, t: day - 2 * 3_600_000 - k * 120_000 });
    }
  }
  // The most rewatched video has the longest title.
  for (let k = 0; k < 6; k++) watches.push({ v: 2, t: now - (k * 3 + 1) * DAY - 9 * 3_600_000 });
  const youtube = watches.map(({ v, t }) => ({
    header: 'YouTube',
    title: `Watched ${titles[v]}`,
    titleUrl: `https://www.youtube.com/watch?v=longName${String(v).padStart(3, '0')}`,
    subtitles: [
      { name: channels[v % channels.length], url: `https://www.youtube.com/channel/UClong${v}` },
    ],
    time: iso(t),
    products: ['YouTube'],
    activityControls: ['YouTube watch history'],
  }));

  const shows = [
    ['The Rookie', 'Season 6', 'Punk Rock and Kidnapped Hearts (Part One of Two)'],
    ['Stranger Things', 'Stranger Things 4', 'Chapter Nine: The Piggyback'],
    ['Avatar: The Last Airbender', 'Book One: Water', 'The Boy in the Iceberg'],
    ['Kota Factory', 'Season 3', 'Mission Possible: The Very Long Night Before the Exam'],
    ['Money Heist', 'Part 5', 'A Family Tradition'],
    ['Avatar: The Last Airbender', 'Book Two: Earth', 'The Avatar State'],
  ];
  const films = [
    'The Lord of the Rings: The Return of the King (Extended Edition)',
    'Spider-Man: Across the Spider-Verse',
  ];
  const devices = ['Samsung 2019 UHD TV (Tizen)', 'Chrome PC (Cadmium)', 'Apple iPhone 15 Pro'];
  const rows = [
    'Profile Name,Start Time,Duration,Attributes,Title,Supplemental Video Type,Device Type,Bookmark,Latest Bookmark,Country',
  ];
  const csv = (s: string) => `"${s.replaceAll('"', '""')}"`;
  for (let d = 0; d < 40; d++) {
    const base = now - d * DAY - 4 * 3_600_000;
    const n = d % 6 === 0 ? 4 : 1; // binges
    for (let k = 0; k < n; k++) {
      const [series, season, ep] = shows[(d + k) % shows.length]!;
      const start = new Date(base + k * 55 * 60_000).toISOString().replace('T', ' ').slice(0, 19);
      rows.push(
        [
          `Me`,
          start,
          '00:47:30',
          '',
          csv(`${series}: ${season}: ${ep} ${d}`),
          '',
          csv(devices[d % 3]!),
          '00:47:30',
          '00:47:30',
          d % 4 === 0 ? 'GB (United Kingdom)' : 'PK (Pakistan)',
        ].join(','),
      );
    }
    if (d % 9 === 0) {
      const start = new Date(base + 5 * 3_600_000).toISOString().replace('T', ' ').slice(0, 19);
      rows.push(
        [
          'Me',
          start,
          '02:31:00',
          '',
          csv(films[d % 2]!),
          '',
          csv(devices[0]!),
          '02:31:00',
          '02:31:00',
          'PK (Pakistan)',
        ].join(','),
      );
    }
  }
  return {
    spotify: Buffer.from(JSON.stringify(spotify)),
    youtube: Buffer.from(JSON.stringify(youtube)),
    netflix: Buffer.from(rows.join('\n')),
  };
}
