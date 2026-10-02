/**
 * "Alex": a night-owl student. Every artist, song, channel, video and show here is
 * invented for the sample. Long-tail names are built from made-up syllables so
 * they can't collide with real, famous names.
 */

export const PERSONA = {
  name: 'Alex',
  otherProfile: 'Sam',
  homeCountry: 'US (United States)',
  tripCountry: 'CA (Canada)',
};

/** Hand-written headliners, most-played first. */
export const TOP_ARTISTS = [
  'Nova Vale',
  'The Paper Lanterns of Oslo Street',
  'Mirela Quist',
  'Static Bloom',
  'Juniper & the Hollow Pines',
  'Kai Okonte',
  'Velvet Cartography',
  'Orla Penhallow',
  'Saltmarsh Choir',
  'Dex Marrow',
  'Tidepool Radio',
  'Ines Varga Trio',
  'Glasshouse Weather',
  'Fen & Fable',
  'Moth Parade',
  'Rosalind Ekwueme',
  'Low Orbit Picnic',
  'The Quiet Hours Club',
  'Sunday Arcade',
  'Pilar Montesol',
];

const SYL_A = [
  'Ka',
  'Ve',
  'Lo',
  'Mi',
  'Zo',
  'Ta',
  'Ru',
  'Ny',
  'Sel',
  'Or',
  'Qui',
  'Bra',
  'El',
  'Fa',
  'Gro',
  'Hal',
  'Ix',
  'Jun',
  'Pell',
  'Tre',
];
const SYL_B = [
  'ven',
  'lora',
  'mir',
  'dane',
  'tesk',
  'bia',
  'quon',
  'rell',
  'vash',
  'nimo',
  'sola',
  'thaw',
  'ondo',
  'pree',
  'kett',
];
const SYL_C = ['', 'a', 'is', 'o', 'en', 'y', 'ix', 'ar'];
const BAND_WORDS = [
  'Choir',
  'Collective',
  'Club',
  'Machine',
  'Society',
  'Ensemble',
  'Parade',
  'Signal',
  'Garden',
  'Room',
];

/** Deterministic invented names: "Velmora", "Tesk Collective", "Ruvash Ondo"… */
export function inventedName(i: number): string {
  const a = SYL_A[i % SYL_A.length]!;
  const b = SYL_B[Math.floor(i / SYL_A.length) % SYL_B.length]!;
  const c = SYL_C[Math.floor(i / (SYL_A.length * SYL_B.length)) % SYL_C.length]!;
  const word = `${a}${b}${c}`;
  switch (i % 4) {
    case 0:
      return word;
    case 1:
      return `${word} ${BAND_WORDS[i % BAND_WORDS.length]}`;
    case 2:
      return `The ${word}s`;
    default:
      return `${word} & ${SYL_A[(i * 7) % SYL_A.length]}${SYL_B[(i * 3) % SYL_B.length]}`;
  }
}

const SONG_ADJ = [
  'Paper',
  'Velvet',
  'Neon',
  'Quiet',
  'Silver',
  'Hollow',
  'Golden',
  'Midnight',
  'Little',
  'Electric',
  'Borrowed',
  'Slow',
  'Wild',
  'Glass',
  'Cold',
  'Sugar',
  'Lucky',
  'Late',
  'Blue',
  'Kitchen',
];
const SONG_NOUN = [
  'Moons',
  'Static',
  'Harbour',
  'Satellites',
  'Gardens',
  'Letters',
  'Weather',
  'Rooms',
  'Rivers',
  'Summers',
  'Ghosts',
  'Engines',
  'Mornings',
  'Wires',
  'Postcards',
  'Comets',
  'Tides',
  'Windows',
  'Fireworks',
  'Streets',
];
const SONG_EXTRA = ['', '', '', ' (Live)', ' (Acoustic)', ' Pt. II', ' (Night Version)', ''];

export function songTitle(i: number): string {
  const adj = SONG_ADJ[i % SONG_ADJ.length]!;
  const noun = SONG_NOUN[Math.floor(i / SONG_ADJ.length) % SONG_NOUN.length]!;
  const extra = SONG_EXTRA[Math.floor(i / 400) % SONG_EXTRA.length]!;
  return `${adj} ${noun}${extra}`;
}

export const ALBUM_WORDS = [
  'Lanterns',
  'Afterglow',
  'North of Nowhere',
  'Small Hours',
  'Soft Machinery',
  'Field Notes',
  'Tin Roof Sessions',
  'Overpass',
  'Room Tone',
  'Long Weekend',
];

export const PODCASTS = [
  { show: 'The Long Table', episodes: 60 },
  { show: 'Small Hours Science', episodes: 40 },
  { show: 'Margins & Footnotes', episodes: 30 },
  { show: 'Two Mugs, One Kettle', episodes: 25 },
];

export const PODCAST_TOPICS = [
  'Why we dream',
  'The history of salt',
  'Cities after dark',
  'Learning to fail',
  'Octopus minds',
  'The bread episode',
  'Maps that lie',
  'Sleep, explained',
  'A tiny guide to space',
  'Lost languages',
];

// ---------- YouTube ----------

export const TOP_CHANNELS = [
  'Pixel Kitchen',
  'Quiet Weather',
  'Brainlight Labs',
  'Tiny Workshop',
  'Map Nerd Daily',
  'Ferro the Cat',
  'Studio Overcast',
  'Retro Rewind Arcade',
  'Night Bus Stories',
  'Plant Lab Pete',
  'Equation Garden',
  'Velo Diaries',
];

export const MUSIC_CHANNELS = [
  'Lo-Fi Lagoon',
  'Moth Parade',
  'Nova Vale',
  'Saltmarsh Choir',
  'Sunday Arcade',
];

const VIDEO_TEMPLATES = [
  'How do {thing} work?',
  'I tried {activity} for 30 days',
  '{n} things you never knew about {thing}',
  'Making {food} from scratch',
  'The surprising history of {thing}',
  'Why {thing} are weirder than you think',
  '{food} three ways (budget edition)',
  'A quiet {place} walk at night',
  'Fixing a broken {object}',
  'Every {thing} explained in {n} minutes',
  'Rating {food} from every {place}',
  'Building a tiny {object}',
  'Study with me: {n} hours, {place} ambience',
  'What happens if you {activity}?',
];
const FILL = {
  thing: [
    'magnets',
    'tides',
    'clocks',
    'volcanoes',
    'satellites',
    'bridges',
    'mushrooms',
    'black holes',
    'elevators',
    'maps',
    'keyboards',
    'octopuses',
    'rainbows',
    'trains',
  ],
  activity: [
    'waking up at 5am',
    'learning piano',
    'only cooking with one pan',
    'drawing every day',
    'running every morning',
    'speaking only in questions',
    'building a robot',
  ],
  food: [
    'pasta',
    'dumplings',
    'flatbread',
    'ramen',
    'pancakes',
    'curry',
    'focaccia',
    'tacos',
    'pizza',
  ],
  place: [
    'rainy city',
    'night train',
    'library',
    'forest',
    'harbour',
    'snowy village',
    'night market',
  ],
  object: ['radio', 'lamp', 'keyboard', 'cabin', 'boat', 'game console', 'bike'],
  n: ['5', '7', '10', '12', '20', '3'],
} as const;

export function videoTitle(pick: <T>(items: readonly T[]) => T): string {
  return pick(VIDEO_TEMPLATES).replace(/\{(\w+)\}/g, (_, key: keyof typeof FILL) =>
    pick(FILL[key]),
  );
}

export const RABBIT_HOLE = {
  first: 'How do magnets work?',
  channel: 'Brainlight Labs',
  videos: 41,
};

export const COMFORT_VIDEO = { title: 'Rain on a tin roof', channel: 'Quiet Weather', times: 14 };

export const SEARCH_TERMS = [
  'easy pasta',
  'how to fix a squeaky door',
  'lofi study',
  'magnets explained',
  'cheap dinner ideas',
  'rain sounds',
  'learn piano chords',
  'night bus stories',
  'tiny house tour',
  'how do clocks work',
  'focaccia recipe',
  'bike chain fix',
  'calm music for sleep',
  'map projections',
  'cat videos funny',
  'stretching routine',
  'budget meal prep',
  'retro games ranked',
  'how to study effectively',
  'volcano documentary',
];

// ---------- Netflix ----------

export interface ShowDef {
  title: string;
  /** e.g. ['Season 1', 'Season 2'], or null for shows whose titles have no season part. */
  seasons: string[] | null;
  episodesPerSeason: number;
  minutes: [number, number];
  weight: number;
}

const EPISODE_NAMES = [
  'The Lighthouse Keeper',
  'Low Tide',
  'Signals',
  'The Long Night',
  'Undertow',
  'Paper Boats',
  'Fog Bank',
  'Harbor Lights',
  'The Last Ferry',
  'Salt',
  'Ropes',
  'Homecoming',
  'The Storm Wall',
  'Night Watch',
  'Anchors',
  'Driftwood',
  'Beacon',
  'Open Water',
];

export function episodeName(show: string, season: number, ep: number): string {
  return EPISODE_NAMES[(season * 7 + ep * 3 + show.length) % EPISODE_NAMES.length]!.concat(
    ep > 12 ? ` (Part ${ep - 11})` : '',
  );
}

export const ALEX_SHOWS: ShowDef[] = [
  {
    title: 'Midnight Harbor',
    seasons: ['Season 1', 'Season 2'],
    episodesPerSeason: 10,
    minutes: [44, 56],
    weight: 0,
  },
  {
    title: 'The Glass Orchard',
    seasons: ['Limited Series'],
    episodesPerSeason: 6,
    minutes: [48, 62],
    weight: 3,
  },
  {
    title: 'Bureau of Lost Things',
    seasons: null,
    episodesPerSeason: 12,
    minutes: [22, 30],
    weight: 4,
  },
  {
    title: 'Copper & Ash',
    seasons: ['Season 1', 'Season 2', 'Season 3'],
    episodesPerSeason: 8,
    minutes: [40, 52],
    weight: 3,
  },
  {
    title: 'Lanternfall',
    seasons: ['Part 1', 'Part 2'],
    episodesPerSeason: 7,
    minutes: [38, 50],
    weight: 2,
  },
  {
    title: 'The Quiet Meridian',
    seasons: ['Season 1'],
    episodesPerSeason: 9,
    minutes: [30, 42],
    weight: 2,
  },
  {
    title: 'Tiny Kitchens, Big Dreams',
    seasons: ['Season 1', 'Season 2'],
    episodesPerSeason: 8,
    minutes: [24, 32],
    weight: 2,
  },
];

export const SAM_SHOWS: ShowDef[] = [
  {
    title: 'Gardens of Varnholm',
    seasons: ['Season 1', 'Season 2'],
    episodesPerSeason: 10,
    minutes: [45, 55],
    weight: 4,
  },
  {
    title: 'Desk Plants Anonymous',
    seasons: null,
    episodesPerSeason: 10,
    minutes: [20, 26],
    weight: 3,
  },
  {
    title: 'Ridgeline Rescue',
    seasons: ['Season 1'],
    episodesPerSeason: 8,
    minutes: [42, 50],
    weight: 2,
  },
];

export const MOVIES = [
  'Paper Kingdoms',
  'Atlas: The Long Road',
  'The Last Ferry Home',
  'Saltwater Hymn',
  'Northbound Static',
  'A Field of Small Lights',
  'The Cartographer’s Daughter',
  'Ninety Winters',
];

export const DEVICES = {
  tv: 'Samsung 2019 UHD TV (Tizen)',
  phone: 'Apple iPhone 13',
  computer: 'Chrome PC (Cadmium)',
};
