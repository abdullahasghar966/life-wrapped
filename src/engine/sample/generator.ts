import Papa from 'papaparse';
import { addDays, addMonths, TimeConverter } from '../ingest/time';
import {
  ALBUM_WORDS,
  ALEX_SHOWS,
  COMFORT_VIDEO,
  DEVICES,
  episodeName,
  inventedName,
  MOVIES,
  MUSIC_CHANNELS,
  PERSONA,
  PODCAST_TOPICS,
  PODCASTS,
  RABBIT_HOLE,
  SAM_SHOWS,
  SEARCH_TERMS,
  songTitle,
  TOP_ARTISTS,
  TOP_CHANNELS,
  videoTitle,
  type ShowDef,
} from './persona';
import { cumulative, Rng, zipf } from './prng';

export const DEFAULT_SEED = 20251;

export interface SampleOptions {
  seed?: number;
  /** The viewer's time zone, so the persona's night-owl hours are night for them too. */
  timeZone: string;
  /** Local date (YYYY-MM-DD) the data ends before: the sample covers up to "yesterday". */
  today: string;
}

export interface SampleFile {
  name: string;
  text: string;
}

const MIN = 60_000;
const HOUR = 3_600_000;
const dayStart = (date: string) => Date.parse(`${date}T00:00:00Z`);
const dateOf = (local: number) => new Date(local).toISOString().slice(0, 10);

/** Night-owl listening: weights for the local hour a session starts. Peak at 1 AM. */
const LISTEN_HOURS = [
  11, 12, 9, 5, 2.5, 0.4, 0.4, 0.8, 1.6, 2, 2, 2, 2.5, 2.5, 2.5, 2.5, 3, 3, 3, 3.5, 4, 5, 6, 7,
];
/** YouTube is Alex's after-midnight habit: even more night-heavy than music. */
const WATCH_HOURS = [
  12, 11, 9, 6, 2, 0.3, 0.3, 0.5, 0.8, 1, 1, 1.5, 2, 2, 2, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7,
];

/** The Saturday of the planted 9-episode Netflix binge (about 12 weeks ago). */
function bingeDay(today: string): string {
  let d = addDays(today, -82);
  while (new Date(dayStart(d)).getUTCDay() !== 6) d = addDays(d, 1);
  return d;
}

/** While the binge is on (12:00–22:00), Alex isn't also listening or watching YouTube. */
function duringBinge(today: string, t: number): boolean {
  const b = dayStart(bingeDay(today));
  return t >= b + 12 * HOUR && t < b + 22 * HOUR;
}

function daysBetween(start: string, endExclusive: string): string[] {
  const out: string[] = [];
  for (let d = start; d < endExclusive; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Session start times for one day: weighted hours, sorted. */
function sessionStarts(rng: Rng, day: string, count: number, hourCum: Float64Array): number[] {
  const starts: number[] = [];
  for (let i = 0; i < count; i++) {
    starts.push(dayStart(day) + rng.weightedIndex(hourCum) * HOUR + rng.int(0, 59) * MIN);
  }
  return starts.sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Spotify Extended streaming history (~60k rows over 18 months)
// ---------------------------------------------------------------------------

interface Track {
  title: string;
  album: string;
  durationMs: number;
  uri: string;
}
interface Artist {
  name: string;
  tracks: Track[];
  trackCum: Float64Array;
  skipRate: number;
  /** Local date the artist was discovered; no plays before it. */
  introduced: string | null;
}

function buildArtists(rng: Rng, spStart: string, today: string): Artist[] {
  const names = [...TOP_ARTISTS];
  for (let i = 0; names.length < 330; i++) names.push(inventedName(i * 13 + 5));
  let songIdx = 0;
  const span = daysBetween(addDays(spStart, 30), addDays(today, -10));
  return names.map((name, rank) => {
    const nTracks = rank < TOP_ARTISTS.length ? rng.int(8, 14) : rng.int(2, 6);
    const tracks: Track[] = Array.from({ length: nTracks }, (_, t) => ({
      title: rank === 0 && t === 0 ? 'Paper Moons' : songTitle(songIdx++),
      album: `${rng.pick(ALBUM_WORDS)}${rank % 3 === 0 ? ' (Deluxe)' : ''}`,
      durationMs: rng.int(150, 250) * 1000,
      uri: `spotify:track:${rng.id(22)}`,
    }));
    return {
      name,
      tracks,
      trackCum: cumulative(zipf(nTracks, 0.9)),
      skipRate: name === 'Static Bloom' ? 0.65 : rank < 10 ? 0.22 : 0.32,
      introduced: rank >= 60 && rng.chance(0.55) ? rng.pick(span) : null,
    };
  });
}

function generateSpotify(rng: Rng, tc: TimeConverter, today: string): unknown[] {
  const spStart = addMonths(today, -18);
  const days = daysBetween(spStart, today);
  const artists = buildArtists(rng, spStart, today);
  // A flattened head (1 / (rank + 3)) so no single song dominates a day by chance.
  const artistCum = cumulative(artists.map((_, r) => 1 / (r + 3)));
  const hourCum = cumulative(LISTEN_HOURS);

  // A 63-day listening streak, with a silent day on either side so it is exactly 63.
  const streakStart = addDays(today, -230);
  const streakEnd = addDays(streakStart, 63);
  const repeatDay = addDays(today, -120);

  const rows: unknown[] = [];
  const push = (startLocal: number, ms: number, fields: Record<string, unknown>) => {
    const end = tc.fromLocal(startLocal + ms);
    rows.push({
      ts: new Date(end).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      platform: fields.platform,
      ms_played: ms,
      conn_country: 'US',
      master_metadata_track_name: fields.track ?? null,
      master_metadata_album_artist_name: fields.artist ?? null,
      master_metadata_album_album_name: fields.album ?? null,
      spotify_track_uri: fields.uri ?? null,
      episode_name: fields.episode ?? null,
      episode_show_name: fields.show ?? null,
      spotify_episode_uri: fields.show ? `spotify:episode:${rng.id(22)}` : null,
      reason_start: fields.reasonStart,
      reason_end: fields.reasonEnd,
      shuffle: fields.shuffle,
      skipped: fields.skipped,
      offline: fields.offline,
      incognito_mode: fields.incognito,
    });
  };

  // Silent days every 6–22 days keep every other streak short.
  const offDays = new Set<string>();
  let untilOff = rng.int(6, 22);
  for (const day of days) {
    const inStreak = day >= streakStart && day < streakEnd;
    const forcedOff = day === addDays(streakStart, -1) || day === streakEnd;
    if (inStreak) continue;
    untilOff--;
    if (forcedOff || untilOff <= 0) {
      offDays.add(day);
      untilOff = rng.int(6, 22);
    }
  }
  // A late session must not spill past midnight into a silent day.
  const spillsIntoOff = (t: number) => offDays.has(dateOf(t));

  // One person, one device: sessions never overlap, even across midnight.
  let lastEnd = -Infinity;
  for (const day of days) {
    if (offDays.has(day)) continue;
    const dow = new Date(dayStart(day)).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    let target = Math.round(rng.range(70, 165) * (weekend ? 1.12 : 1));
    // The planted repeat evening needs 19:00 onwards to itself.
    const starts = sessionStarts(rng, day, rng.int(2, 5), hourCum).filter(
      (s) =>
        (day !== repeatDay || s < dayStart(day) + 13 * HOUR) &&
        !duringBinge(today, s) &&
        !duringBinge(today, s + 2 * HOUR),
    );
    const platform = rng.chance(0.7) ? 'android' : rng.chance(0.6) ? 'windows' : 'web_player';
    for (let s = 0; s < starts.length && target > 0; s++) {
      let t = Math.max(starts[s]!, lastEnd + rng.int(15, 60) * MIN);
      if (dateOf(t) > day && dateOf(t) !== addDays(day, 1)) break;
      const incognito = rng.chance(0.04);
      if (rng.chance(0.06)) {
        // Podcast session.
        const pod = rng.pick(PODCASTS);
        for (let e = rng.int(1, 2); e > 0; e--) {
          const ms = rng.int(18, 62) * MIN;
          if (spillsIntoOff(t + ms)) break;
          push(t, ms, {
            platform,
            show: pod.show,
            episode: `${rng.pick(PODCAST_TOPICS)} (Ep. ${rng.int(1, pod.episodes)})`,
            reasonStart: 'clickrow',
            reasonEnd: rng.chance(0.6) ? 'trackdone' : 'endplay',
            shuffle: false,
            skipped: false,
            offline: false,
            incognito,
          });
          t += ms + rng.int(1, 5) * MIN;
          target -= 4;
        }
        lastEnd = t;
        continue;
      }
      const shuffle = rng.chance(0.4);
      const n = Math.max(4, Math.round(target / (starts.length - s)) + rng.int(-6, 6));
      for (let i = 0; i < n; i++) {
        if (spillsIntoOff(t + 5 * MIN)) break;
        let artist = artists[rng.weightedIndex(artistCum)]!;
        for (let tries = 0; artist.introduced && artist.introduced > day && tries < 6; tries++) {
          artist = artists[rng.weightedIndex(artistCum)]!;
        }
        if (artist.introduced && artist.introduced > day) continue;
        const track = artist.tracks[rng.weightedIndex(artist.trackCum)]!;
        // Keep the planted repeat day's count exact, including sessions that run past midnight.
        if (track.title === 'Paper Moons' && dateOf(t) === repeatDay) continue;
        const skipped = rng.chance(artist.skipRate);
        const partial = !skipped && rng.chance(0.08);
        const ms = skipped
          ? rng.int(3, 28) * 1000
          : partial
            ? rng.int(35, 110) * 1000
            : Math.round(track.durationMs * rng.range(0.92, 1));
        push(t, ms, {
          platform,
          track: track.title,
          artist: artist.name,
          album: track.album,
          uri: track.uri,
          reasonStart: i === 0 ? 'clickrow' : skipped ? 'fwdbtn' : 'trackdone',
          reasonEnd: skipped ? 'fwdbtn' : partial ? 'endplay' : 'trackdone',
          shuffle,
          skipped,
          offline: rng.chance(0.03),
          incognito,
        });
        t += ms + rng.int(0, 3) * 1000;
      }
      target -= n;
      lastEnd = t;
    }
    if (day === repeatDay) {
      // Planted: one song played 27 times in a single day (an evening on repeat).
      const nova = artists[0]!;
      const paper = nova.tracks[0]!;
      let t = Math.max(dayStart(day) + 19 * HOUR, lastEnd + 10 * MIN);
      for (let i = 0; i < 27; i++) {
        push(t, paper.durationMs, {
          platform,
          track: paper.title,
          artist: nova.name,
          album: paper.album,
          uri: paper.uri,
          reasonStart: 'trackdone',
          reasonEnd: 'trackdone',
          shuffle: false,
          skipped: false,
          offline: false,
          incognito: false,
        });
        t += paper.durationMs + 2000;
      }
      lastEnd = t;
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// YouTube watch + search history (~9–10k watches, 600 searches)
// ---------------------------------------------------------------------------

interface Video {
  id: string;
  title: string;
}

type Watch =
  | { kind: 'video'; local: number; channel: string; video: Video }
  | { kind: 'music'; local: number; channel: string; video: Video }
  | { kind: 'removed'; local: number };

function generateYoutube(rng: Rng, tc: TimeConverter, today: string) {
  const start = addMonths(today, -12);
  const days = daysBetween(start, today);
  const channels = [...TOP_CHANNELS];
  for (let i = 0; channels.length < 360; i++) channels.push(`${inventedName(i * 7 + 3)} TV`);
  const channelCum = cumulative(zipf(channels.length, 1.05));
  const musicCum = cumulative(zipf(MUSIC_CHANNELS.length, 1.3));
  const hourCum = cumulative(WATCH_HOURS);
  const watched = new Map<string, Video[]>();
  const pick = <T>(items: readonly T[]) => rng.pick(items);

  const watches: Watch[] = [];
  const rabbitDay = addDays(today, -75);
  // Nothing else may happen on the rabbit hole's evening and night.
  const quietFrom = dayStart(rabbitDay) + 17 * HOUR;
  const quietTo = dayStart(rabbitDay) + 34 * HOUR;
  const comfortVideo: Video = { id: 'rAinT1nR00f', title: COMFORT_VIDEO.title };

  const newVideo = (channel: string): Video => {
    const list = watched.get(channel) ?? [];
    if (list.length > 0 && rng.chance(0.07)) return rng.pick(list);
    const v = { id: rng.id(11), title: videoTitle(pick) };
    list.push(v);
    watched.set(channel, list);
    return v;
  };

  /** One session: videos 2–10 minutes apart, with the odd YouTube Music play or removed video. */
  const session = (from: number, n: number, gapMin: [number, number]): number => {
    let t = from;
    for (let i = 0; i < n; i++) {
      const x = rng.float();
      if (x < 0.035) {
        const channel = MUSIC_CHANNELS[rng.weightedIndex(musicCum)]!;
        watches.push({
          kind: 'music',
          local: t,
          channel,
          video: { id: rng.id(11), title: songTitle(rng.int(0, 399)) },
        });
      } else if (x < 0.039) {
        watches.push({ kind: 'removed', local: t });
      } else {
        const channel = channels[rng.weightedIndex(channelCum)]!;
        watches.push({ kind: 'video', local: t, channel, video: newVideo(channel) });
      }
      if (i < n - 1) t += rng.int(gapMin[0], gapMin[1]) * MIN + rng.int(0, 59) * 1000;
    }
    return t;
  };

  const lateSessions: number[] = [];
  let lastEnd = -Infinity;
  for (const day of days) {
    const dow = new Date(dayStart(day)).getUTCDay();
    const friday = dow === 5;
    const starts = sessionStarts(rng, day, rng.int(2, 4) + (dow === 6 ? 1 : 0), hourCum).filter(
      // Fridays keep the late evening free for the planted prime-time session.
      (s) => !friday || s < dayStart(day) + 21 * HOUR,
    );
    if (friday) starts.push(dayStart(day) + 23 * HOUR + rng.int(0, 4) * MIN);
    for (const planned of starts) {
      const s = Math.max(planned, lastEnd + rng.int(35, 90) * MIN);
      if (s >= quietFrom - 4 * HOUR && s < quietTo) continue;
      if (duringBinge(today, s) || duringBinge(today, s + 3 * HOUR)) continue;
      const isPrime = friday && planned >= dayStart(day) + 23 * HOUR;
      if (isPrime && s !== planned) continue;
      const n = isPrime
        ? rng.int(9, 12)
        : Math.min(18, 3 + Math.floor(Math.log(1 - rng.float()) / Math.log(0.83)));
      const end = session(s, n, isPrime ? [4, 5] : [2, 10]);
      const endHour = new Date(end).getUTCHours();
      if (endHour >= 21 || endHour < 3) lateSessions.push(end);
      lastEnd = end;
    }
  }

  // Planted: a 41-video, ~4-hour rabbit hole that ends at 3:12 AM.
  {
    const end = dayStart(addDays(rabbitDay, 1)) + 3 * HOUR + 12 * MIN;
    const gaps = Array.from({ length: RABBIT_HOLE.videos - 1 }, () => rng.range(3, 9));
    const scale = 240 / gaps.reduce((a, b) => a + b, 0);
    let t = end - 240 * MIN;
    for (let i = 0; i < RABBIT_HOLE.videos; i++) {
      const channel = i === 0 || i % 3 === 0 ? RABBIT_HOLE.channel : rng.pick(TOP_CHANNELS);
      const video = i === 0 ? { id: rng.id(11), title: RABBIT_HOLE.first } : newVideo(channel);
      watches.push({ kind: 'video', local: Math.round(t), channel, video });
      t += (gaps[i] ?? 0) * scale * MIN;
    }
  }

  // Planted: a comfort video rewatched 14 times, each closing a late session.
  for (let i = 0; i < COMFORT_VIDEO.times; i++) {
    const end = lateSessions[Math.floor(((i + 0.5) / COMFORT_VIDEO.times) * lateSessions.length)]!;
    watches.push({
      kind: 'video',
      local: end + 4 * MIN,
      channel: COMFORT_VIDEO.channel,
      video: comfortVideo,
    });
  }

  const iso = (local: number) => new Date(tc.fromLocal(local) + rng.int(0, 999)).toISOString();
  const channelUrl = () => `https://www.youtube.com/channel/UC${rng.id(22)}`;
  const entries: Array<Record<string, unknown> & { time: string }> = watches.map((w) => {
    const base = {
      time: iso(w.local),
      products: ['YouTube'],
      activityControls: ['YouTube watch history'],
    };
    if (w.kind === 'removed')
      return { header: 'YouTube', title: 'Watched a video that has been removed', ...base };
    if (w.kind === 'music') {
      return {
        header: 'YouTube Music',
        title: `Watched ${w.video.title}`,
        titleUrl: `https://music.youtube.com/watch?v=${w.video.id}`,
        subtitles: [{ name: `${w.channel} - Topic`, url: channelUrl() }],
        ...base,
      };
    }
    return {
      header: 'YouTube',
      title: `Watched ${w.video.title}`,
      titleUrl: `https://www.youtube.com/watch?v=${w.video.id}`,
      subtitles: [{ name: w.channel, url: channelUrl() }],
      ...base,
    };
  });
  // Ads, so the sample exercises that rule too (they never count as watches).
  for (let i = 0; i < 140; i++) {
    entries.push({
      header: 'YouTube',
      title: `Watched ${videoTitle(pick)}`,
      titleUrl: `https://www.youtube.com/watch?v=${rng.id(11)}`,
      time: iso(dayStart(rng.pick(days)) + rng.int(10, 22) * HOUR),
      products: ['YouTube'],
      details: [{ name: 'From Google Ads' }],
      activityControls: ['YouTube watch history'],
    });
  }
  entries.sort((a, b) => (a.time < b.time ? 1 : -1)); // Takeout lists newest first

  // Searches.
  const termCum = cumulative(zipf(SEARCH_TERMS.length, 1.1));
  const searches: Array<{ time: string } & Record<string, unknown>> = [];
  for (let i = 0; i < 600; i++) {
    const q = rng.chance(0.75)
      ? SEARCH_TERMS[rng.weightedIndex(termCum)]!
      : videoTitle(pick)
          .toLowerCase()
          .replace(/[?:()]/g, '');
    searches.push({
      header: 'YouTube',
      title: `Searched for ${q}`,
      titleUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(q).replace(/%20/g, '+')}`,
      time: iso(
        dayStart(rng.pick(days)) + rng.weightedIndex(hourCum) * HOUR + rng.int(0, 59) * MIN,
      ),
      products: ['YouTube'],
      activityControls: ['YouTube search history'],
    });
  }
  searches.sort((a, b) => (a.time < b.time ? 1 : -1));
  return { watches: entries, searches };
}

// ---------------------------------------------------------------------------
// Netflix viewing activity (~700 rows, two profiles)
// ---------------------------------------------------------------------------

interface NfRow {
  local: number;
  profile: string;
  durationS: number;
  title: string;
  supplemental: string;
  device: string;
  country: string;
  attributes: string;
}

const hms = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');

function episodeTitles(show: ShowDef): string[] {
  const out: string[] = [];
  const seasons = show.seasons ?? [null];
  seasons.forEach((season, si) => {
    for (let e = 1; e <= show.episodesPerSeason; e++) {
      const name = episodeName(show.title, si, e);
      out.push(
        season
          ? `${show.title}: ${season}: ${season.startsWith('Limited') ? `Part ${e}` : name}`
          : `${show.title}: ${name}`,
      );
    }
  });
  return out;
}

function generateNetflix(rng: Rng, tc: TimeConverter, today: string): string {
  const start = addMonths(today, -12);
  const days = daysBetween(start, today);
  const rows: NfRow[] = [];
  const tripStart = addDays(today, -150);
  const tripEnd = addDays(tripStart, 8);
  const countryOn = (day: string, profile: string) =>
    profile === PERSONA.name && day >= tripStart && day < tripEnd
      ? PERSONA.tripCountry
      : PERSONA.homeCountry;

  const deviceFor = (profile: string, local: number) => {
    if (profile !== PERSONA.name) return rng.chance(0.9) ? DEVICES.tv : DEVICES.phone;
    const h = new Date(local).getUTCHours();
    if (h < 5) return rng.chance(0.75) ? DEVICES.phone : DEVICES.tv;
    const x = rng.float();
    return x < 0.62 ? DEVICES.tv : x < 0.85 ? DEVICES.phone : DEVICES.computer;
  };

  const addView = (
    profile: string,
    day: string,
    local: number,
    title: string,
    mins: [number, number],
  ) => {
    const total = rng.int(mins[0], mins[1]) * 60;
    const device = deviceFor(profile, local);
    const country = countryOn(day, profile);
    // A third of evening views are watched in two sittings, as real activity logs show.
    if (new Date(local).getUTCHours() >= 6 && rng.chance(0.33)) {
      const first = Math.round(total * rng.range(0.3, 0.7));
      rows.push({
        local,
        profile,
        durationS: first,
        title,
        supplemental: '',
        device,
        country,
        attributes: '',
      });
      rows.push({
        local: local + (first + rng.int(20, 90) * 60) * 1000,
        profile,
        durationS: total - first,
        title,
        supplemental: '',
        device,
        country,
        attributes: '',
      });
      return local + (total + 100 * 60) * 1000;
    }
    rows.push({
      local,
      profile,
      durationS: total,
      title,
      supplemental: '',
      device,
      country,
      attributes: rng.chance(0.4) ? 'Autoplayed: user action: None; ' : '',
    });
    return local + (total + rng.int(1, 6) * 60) * 1000;
  };

  const viewer = (profile: string, shows: ShowDef[], viewingDays: number, nights: boolean) => {
    const queues = shows.map((s) => ({ show: s, eps: episodeTitles(s), next: 0 }));
    const chosen = new Set<string>();
    while (chosen.size < viewingDays) {
      const d = rng.pick(days);
      const dow = new Date(dayStart(d)).getUTCDay();
      // Netflix is a weekend thing: Fri–Sun are about twice as likely as other days.
      if (dow >= 1 && dow <= 4 && rng.chance(0.5)) continue;
      chosen.add(d);
    }
    for (const day of [...chosen].sort()) {
      // Night views start no later than 2:50 AM; the planted 3:47 AM stays the record.
      const night = nights && rng.chance(0.12);
      let t =
        dayStart(day) +
        (night
          ? rng.int(0, 2) * HOUR + rng.int(0, 50) * MIN
          : rng.int(18, 21) * HOUR + rng.int(0, 59) * MIN);
      const n = night ? 1 : rng.int(1, 3);
      for (let i = 0; i < n; i++) {
        if (rng.chance(0.14)) {
          t = addView(profile, day, t, rng.pick(MOVIES), [84, 138]);
          continue;
        }
        // Shows are watched through once; finished ones only come back as the odd rewatch.
        const open = queues.filter((q) => q.next < q.eps.length);
        let title: string;
        let q;
        if (open.length > 0) {
          q = open[rng.weightedIndex(cumulative(open.map((o) => o.show.weight)))]!;
          title = q.eps[q.next++]!;
        } else {
          q = rng.pick(queues);
          title = rng.pick(q.eps);
        }
        t = addView(profile, day, t, title, q.show.minutes);
      }
      // Autoplayed previews and trailers: dropped by the parser, but part of every real export.
      for (let k = rng.int(0, 2); k > 0; k--) {
        rows.push({
          local: t + rng.int(1, 5) * MIN,
          profile,
          durationS: rng.int(5, 90),
          title: `${rng.pick(shows).title}_hook_primary_16x9`,
          supplemental: rng.chance(0.5) ? 'HOOK' : 'TRAILER',
          device: deviceFor(profile, t),
          country: countryOn(day, profile),
          attributes: 'Autoplayed: user action: None; ',
        });
      }
      if (rng.chance(0.15)) {
        rows.push({
          local: t + 2 * MIN,
          profile,
          durationS: rng.int(4, 50),
          title: rng.pick(MOVIES),
          supplemental: '',
          device: deviceFor(profile, t),
          country: countryOn(day, profile),
          attributes: '',
        });
      }
    }
  };

  viewer(
    PERSONA.name,
    ALEX_SHOWS.filter((s) => s.weight > 0),
    100,
    true,
  );
  viewer(PERSONA.otherProfile, SAM_SHOWS, 70, false);

  // Planted: Midnight Harbor, including a 9-episode binge day and rewatches.
  const mh = ALEX_SHOWS[0]!;
  const mhEps = episodeTitles(mh);
  const binge = bingeDay(today);
  // The binge is the only viewing that day.
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i]!.profile === PERSONA.name && dateOf(rows[i]!.local) === binge) rows.splice(i, 1);
  }
  let t = dayStart(binge) + 13 * HOUR + 10 * MIN;
  for (let e = 0; e < 9; e++) {
    const dur = rng.int(46, 54) * 60;
    rows.push({
      local: t,
      profile: PERSONA.name,
      durationS: dur,
      title: mhEps[e]!,
      supplemental: '',
      device: DEVICES.tv,
      country: PERSONA.homeCountry,
      attributes: e > 0 ? 'Autoplayed: user action: None; ' : '',
    });
    t += (dur + rng.int(1, 4) * 60) * 1000;
  }
  const after = daysBetween(addDays(binge, 1), today);
  for (let e = 9; e < mhEps.length; e++) {
    const day = after[Math.min(after.length - 1, (e - 9) * 4 + rng.int(0, 2))]!;
    addView(PERSONA.name, day, dayStart(day) + rng.int(20, 21) * HOUR, mhEps[e]!, mh.minutes);
  }
  for (let r = 0; r < 16; r++) {
    const day = rng.pick(after);
    addView(PERSONA.name, day, dayStart(day) + rng.int(19, 21) * HOUR, rng.pick(mhEps), mh.minutes);
  }
  // Planted: some viewing during the trip, so "Around the world" always has two countries.
  for (const offset of [1, 3, 5]) {
    const day = addDays(tripStart, offset);
    const comfort = episodeTitles(ALEX_SHOWS.find((s) => s.title === 'Bureau of Lost Things')!);
    addView(PERSONA.name, day, dayStart(day) + 21 * HOUR, rng.pick(comfort), [22, 30]);
  }
  // Planted: the latest night, 3:47 AM.
  const lateDay = addDays(today, -40);
  addView(PERSONA.name, lateDay, dayStart(lateDay) + 3 * HOUR + 47 * MIN, mhEps[4]!, [30, 40]);

  rows.sort((a, b) => b.local - a.local);
  return Papa.unparse({
    fields: [
      'Profile Name',
      'Start Time',
      'Duration',
      'Attributes',
      'Title',
      'Supplemental Video Type',
      'Device Type',
      'Bookmark',
      'Latest Bookmark',
      'Country',
    ],
    data: rows.map((r) => [
      r.profile,
      new Date(tc.fromLocal(r.local)).toISOString().slice(0, 19).replace('T', ' '),
      hms(r.durationS),
      r.attributes,
      r.title,
      r.supplemental,
      r.device,
      hms(r.durationS),
      'Not latest view',
      r.country,
    ]),
  });
}

/**
 * Builds Alex's exports in the platforms' raw formats; they then go through the
 * normal ingestion pipeline. Same seed + time zone + date → identical files.
 */
export function generateSample(opts: SampleOptions): SampleFile[] {
  const seed = opts.seed ?? DEFAULT_SEED;
  const tc = new TimeConverter(opts.timeZone);
  const spotify = generateSpotify(new Rng(seed), tc, opts.today);
  const yt = generateYoutube(new Rng(seed + 1), tc, opts.today);
  const nf = generateNetflix(new Rng(seed + 2), tc, opts.today);
  return [
    { name: 'Streaming_History_Audio_sample.json', text: JSON.stringify(spotify) },
    { name: 'watch-history.json', text: JSON.stringify(yt.watches) },
    { name: 'search-history.json', text: JSON.stringify(yt.searches) },
    { name: 'ViewingActivity.csv', text: nf },
  ];
}
