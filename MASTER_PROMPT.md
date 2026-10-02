# Life, Wrapped: Master Build Prompt

> **How to use this file (for you, the human)**
> 1. Put this file in the root of a new GitHub repo called `life-wrapped`.
> 2. Start one Claude Code session per milestone and paste the matching kickoff prompt from §20.
> 3. The agent tracks its progress in `docs/PROGRESS.md`, so each new session picks up where the last one stopped.

---

## 0. Your role and how to work

You are a senior full-stack engineer building **Life, Wrapped** from an empty repo to a deployed product. The owner will use it to get hired. Recruiters and engineers will judge the code, the README and the live demo. Optimise for four things: it works, it looks polished, it's easy to try, and every decision can be explained in an interview.

Working agreements:
- **One milestone (§18) per session.** Read `docs/PROGRESS.md` first. Do the milestone. Update the file before you finish: what's done, what's next, and known issues.
- **Small, meaningful commits** using Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
- **Before every commit**, run typecheck, lint and the tests your change touches. Never commit failing tests.
- **When this spec is ambiguous or wrong,** make the sensible choice and record it in `docs/DECISIONS.md` as a short ADR (context → decision → alternatives → consequences). Write it in plain English, because the owner will use it to answer interview questions.
- **Prefer boring, well-known libraries.** Every new dependency needs a reason, and big ones get an ADR.
- **Verify library APIs against current docs**, not memory, because versions move fast.
- **Comments only where the "why" isn't obvious.**
- **Check your visual work by looking at it.** Take Playwright screenshots of what you built and review them before calling a UI task done.

## 1. The product in one paragraph

People can download their own data from Spotify, YouTube (via Google Takeout) and Netflix. Life, Wrapped turns those files into swipeable, animated story decks, like a year-end recap. There is one deck per platform, plus a combined "Your online life" deck. **Each platform's deck looks and moves like that platform**: the Spotify deck feels like Spotify, the YouTube deck feels like YouTube, and the Netflix deck feels like Netflix. **All processing happens in the browser, and raw data never leaves the device.** The only server feature is optional sharing of a summary card, and the user sees exactly which few numbers will be uploaded before anything is sent.

## 2. Audience and success criteria

- **Primary audience: recruiters and hiring engineers.** They will spend 30–120 seconds on the app and will never request a data export. So a one-click **"Try with sample data"** must deliver the full experience. Also support a direct link that opens straight into the sample story: `/story/spotify?sample=1`.
- **Secondary audience: real users** who bring their own exports.
- **Success means:**
  1. Landing page → sample story in at most 2 clicks and under 5 seconds.
  2. Every deck is recognisable as its platform without any logo (the 1-second test, §10.1).
  3. The privacy claim can be proven: the app works offline, has a strict CSP, and an automated network test passes.
  4. The repo is clean, with CI, tests and docs.

## 3. Hard rules

**Privacy**
- Raw files and parsed rows never leave the browser.
- No analytics, telemetry or third-party scripts.
- No runtime CDN loads. Fonts and WASM are self-hosted.
- Nothing is persisted by default. Data lives in memory for the life of the tab, and a visible **"Clear my data"** button wipes it.
- Sensitive fields are dropped at parse time (§6.6).
- Sharing is opt-in and per card, with a preview of the exact JSON before anything is uploaded.

**Honesty**
- Never invent data. Don't show anything the export doesn't contain:
  - no genres
  - no global rankings or "top X% of fans"
  - no real album art or thumbnails
- Label estimates clearly. YouTube watch time is an estimate: show it with "≈" and an ⓘ explaining the method (§8.3).
- Hide any card whose data is insufficient. Each card has a minimum-data rule, and the app never shows an empty card or a "0" card.

**Brand safety (themes are "inspired by", never copies)**
- Don't use any official:
  - logos, icons or wordmarks
  - app screenshots
  - proprietary fonts (Spotify Mix/Circular, YouTube Sans, Netflix Sans)
  - brand sounds (for example, no Netflix "ta-dum")
- Evoke each platform with colour, free fonts, layout patterns and motion instead (§10).
- Put this line in the footer and the README: *"Life, Wrapped is an independent project and is not affiliated with or endorsed by Spotify, YouTube/Google or Netflix."*
- Use platform names only to describe which exports are supported, e.g. "Your Spotify story".

**Non-goals for v1:**
- user accounts
- LLM/AI calls
- server-side processing of raw data
- platform APIs or scraping
- a native app
- UI translations (English only)

## 4. Tech stack (decided; don't swap anything without an ADR)

| Concern | Choice | Notes |
|---|---|---|
| Language | TypeScript, strict | Turn on `noUncheckedIndexedAccess` |
| Framework | Next.js (App Router), React | Render pages statically where possible; the engine and player are client components |
| Package manager | pnpm | |
| Styling | Tailwind CSS v4 + CSS variables for themes | Use shadcn/ui for non-story UI (dialogs, toggles, sheets) |
| Animation | GSAP + `@gsap/react` (`useGSAP`), including SplitText | GSAP and its plugins are free |
| In-browser database | DuckDB-WASM in a dedicated Web Worker | Use the single-threaded EH bundle, which needs no COOP/COEP headers. Self-host the bundles under `/public/duckdb/` and never load them from a CDN |
| Worker communication | Comlink | Pass callbacks with `Comlink.proxy` |
| Unzip / CSV / big JSON | fflate (streaming, filtered), Papa Parse, a streaming JSON parser (e.g. `@streamparser/json`) for files over 50 MB | All of these run in the worker |
| Validation | Zod | Used by the parsers and the share API |
| Charts | Hand-written SVG; `d3-scale`/`d3-shape` for the maths only | Easy to animate, captures cleanly to PNG, accessible |
| Card → PNG | `html-to-image` | Runs client-side |
| Share storage | Neon Postgres + Drizzle ORM | Used only by `/api/share` |
| PWA / offline | Serwist (`@serwist/next`) | |
| Tests | Vitest (unit), Playwright (E2E, visual, network), `@axe-core/playwright` | |
| CI and hosting | GitHub Actions; Vercel | |

## 5. Architecture

```
┌──────────────────────── Browser (everything private happens here) ─────────────────────────┐
│ Drop zone ──files──► Engine Worker (Comlink)                                                │
│                       ├─ detect → unzip (filtered) → parse (Zod) → minimise → local time    │
│                       ├─ DuckDB-WASM tables (§7)                                            │
│                       └─ insight registry → parameterised SQL → InsightResult[]             │
│ Story Player ◄── decks of InsightResults ── theme tokens (§10) ── GSAP ── PNG export        │
└─────────────┬───────────────────────────────────────────────────────────────────────────────┘
              │ opt-in only: { cardType, ~10 whitelisted fields } ≤ 4 KB
              ▼
   Next.js Route Handler /api/share ──► Neon Postgres ──► /s/[id] page + OG image (next/og)
```

Project structure:
```
src/
  app/
    page.tsx                     landing
    start/page.tsx               upload, export guides, sample button, ingest summary
    story/[deck]/page.tsx        deck = spotify | youtube | netflix | life   (?sample=1 supported)
    s/[id]/page.tsx              shared card (server-rendered)
    s/[id]/opengraph-image.tsx   1200×630 themed preview
    api/share/route.ts           POST create
    api/share/[id]/route.ts      DELETE with delete token
    privacy/page.tsx
  engine/                        worker-only code, no React
    worker.ts  api.ts
    ingest/  detect.ts unzip.ts spotify.ts youtube.ts netflix.ts time.ts minimise.ts
    db/      duckdb.ts schema.sql
    insights/ registry.ts types.ts constants.ts spotify/ youtube/ netflix/ life/
    sample/  generator.ts persona.ts prng.ts
  story/
    Player.tsx  useDeck.ts  gestures.ts  progress/
    themes/  tokens.ts sound.ts watch.ts binge.ts aurora.ts
    cards/   sound/ watch/ binge/ aurora/
    art/     generatedArt.ts        deterministic covers / thumbnails / posters / avatars
    charts/  RadialClock.tsx Heatmap.tsx RankBars.tsx Donut.tsx StackedArea.tsx DayTimeline.tsx
  share/     schema.ts capture.ts
  server/    db.ts schema.ts rateLimit.ts
tests/       unit/ e2e/ fixtures/
docs/        PROGRESS.md DECISIONS.md ARCHITECTURE.md PRIVACY.md
```

Worker API shape:
```ts
type DeckId = 'spotify' | 'youtube' | 'netflix' | 'life';
interface EngineApi {
  ingest(files: File[], opts: { timeZone: string }, onProgress: (p: IngestProgress) => void): Promise<IngestSummary>;
  loadSample(seed?: number): Promise<IngestSummary>;
  setOptions(o: Partial<{ timeZone: string; period: Period; includePrivateSessions: boolean;
                          includeSearches: boolean; netflixProfile: string }>): Promise<void>;
  availableDecks(): Promise<DeckId[]>;
  getDeck(deck: DeckId): Promise<InsightResult[]>;
  clear(): Promise<void>;
}
```

## 6. Ingestion

### 6.1 Input and detection
- **Accepted input:** drag-and-drop or a file picker, with multiple files allowed. Folders work via `webkitGetAsEntry`. File types: `.zip`, `.json`, `.csv`. Users may drop whole export zips or files they've already extracted.
- **Inside zips, only decompress entries that match known patterns.** That's faster, and the app never even opens unrelated personal files.
- **Detect by content shape first and file name second.** Export folder and file names are localised in non-English accounts.

  | Source | How to recognise it |
  |---|---|
  | Spotify Extended | JSON array of objects with `ts` and `ms_played` |
  | Spotify Account data | JSON array of objects with `endTime` and `msPlayed`. Music rows have `artistName`/`trackName`; podcast rows have `podcastName`/`episodeName` |
  | YouTube watch history | JSON array of objects with `header`, `title` and `time` (`watch-history.json`) |
  | YouTube search history | The same shape (`search-history.json`); titles start with a "Searched for" verb |
  | Netflix viewing | A CSV whose header includes `Profile Name`, `Start Time`, `Duration` and `Title` |
  | YouTube HTML (`watch-history.html`, Takeout's default) | Don't parse it in v1. Show a friendly message with steps to re-export as JSON |

- **Show progress.** Each file gets a status line ("Recognised as Spotify Extended · 48,120 rows · 312 skipped"). There's also an overall progress bar and a Cancel button.
- **De-duplicate** identical files (SHA-256 via `crypto.subtle`) and identical rows (by natural keys).

### 6.2 Spotify
File names differ across export generations:
- Account data: `StreamingHistory_music_*.json`, `StreamingHistory_podcast_*.json`, and the older `StreamingHistory*.json`.
- Extended: `Streaming_History_Audio_*.json`, `Streaming_History_Video_*.json`, and the older `endsong_*.json`.

Account data row (UTC, minute precision):
```json
{ "endTime": "2025-03-14 23:41", "artistName": "Nova Vale", "trackName": "Paper Moons", "msPlayed": 201345 }
```
Extended rows (UTC, ISO timestamps) use these fields:
`ts, ms_played, master_metadata_track_name, master_metadata_album_artist_name, master_metadata_album_album_name, spotify_track_uri, episode_name, episode_show_name, platform, conn_country, reason_start, reason_end, shuffle, skipped, offline, incognito_mode`. Newer exports also have `audiobook_*` fields.

Rules:
- **Schemas:** Zod with every field optional. Ignore unknown fields and tolerate `null`.
- **Kind:** music if a track name is present, podcast if episode fields are present, audiobook if audiobook fields are present; drop anything else.
- **Account-data timing:** `endTime` marks the end of playback, so start ≈ `endTime − msPlayed`.
- **Both formats uploaded:** prefer Extended wherever the date ranges overlap, and never double count.
- **What counts as a play:** `ms_played ≥ 30 000` (Spotify's own stream threshold). Minutes always use the total `ms_played`.
- **What counts as a skip:** in Extended, `skipped === true` or `reason_end === 'fwdbtn'`. In Account data, `msPlayed < 30 000`.
- **Private sessions (`incognito_mode`):** count them in totals. Leave them out of top lists and anything shareable unless the user turns on "Include private sessions". The user chose privacy for those plays, so respect it.

### 6.3 YouTube (Google Takeout, JSON)
```json
{
  "header": "YouTube",
  "title": "Watched How do magnets work?",
  "titleUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "subtitles": [{ "name": "Pixel Kitchen", "url": "https://www.youtube.com/channel/UC..." }],
  "time": "2025-03-14T23:41:07.123Z",
  "products": ["YouTube"],
  "details": [{ "name": "From Google Ads" }]
}
```
Rules:
- **Ads:** exclude any entry where a `details[].name` contains "Google Ads".
- **Video ID:** take it from the `v=` parameter of `titleUrl`. Entries without a `titleUrl` are removed or private videos. Count them and label them "a video that's no longer available".
- **Title:** strip the leading verb using a small locale map (`Watched `, `Has visto `, `Vous avez regardé `, `Du hast `, …). If no prefix matches, keep the whole title. Treat search titles the same way (`Searched for `, …).
- **Channel:** use `subtitles[0].name`. For YouTube Music entries (`header: "YouTube Music"`), strip a trailing ` - Topic`.
- **No durations:** watch history doesn't record how long anything was watched. See §8.3 for the estimate.

### 6.4 Netflix
The viewing file is `ViewingActivity.csv`, usually under `CONTENT_INTERACTION/`. Its columns are:
`Profile Name, Start Time, Duration, Attributes, Title, Supplemental Video Type, Device Type, Bookmark, Latest Bookmark, Country`

- **Formats:** `Start Time` is UTC `YYYY-MM-DD HH:mm:ss`; `Duration` is `HH:MM:SS`.
- **Which rows count:** keep only rows with an empty `Supplemental Video Type`, which drops trailers, teasers, hooks and recaps. Also drop durations under 60 seconds.
- **Profiles:** an export contains every profile on the account. After parsing, ask which profile is "you" (default: the profile with the most hours). Only that profile is ever queried or shown, because other people's viewing isn't the user's to analyse or share.
- **Title parsing:** split the title on `": "`.
  - If there are at least 3 parts and part 2 matches `/^(season|series|part|volume|book|chapter|collection|limited series|miniseries|temporada|staffel|saison|stagione)\b/i`, then series = part 1, season = part 2, and episode = the rest.
  - Otherwise, if at least 3 distinct titles share the same first part, treat it as a series.
  - Otherwise, it's a movie.
  - Cover all of this with fixture tests.
- **Device class:** derive it from keywords in `Device Type`.

  | Class | Keywords |
  |---|---|
  | TV | TV, Roku, Fire TV, Chromecast, Apple TV, PlayStation, Xbox |
  | Phone | iPhone, Android phone |
  | Tablet | iPad, Tablet, Kindle |
  | Computer | PC, Mac, Chrome, Edge, Firefox, Safari, Windows, Cadmium |
  | Other | anything else |
- **Country:** `"PK (Pakistan)"` becomes code `PK` and name `Pakistan`.

### 6.5 Time
All three exports use UTC. Convert to the user's time zone **inside the worker** and store `local_ts`, `local_date`, `local_hour` and `local_dow`.
- The default time zone is `Intl.DateTimeFormat().resolvedOptions().timeZone`, and the user can change it in settings.
- For speed, cache the UTC offset per UTC hour. That costs a few thousand `Intl` calls instead of hundreds of thousands, and it's DST-safe.
- Unit-test the DST transitions.

### 6.6 Data minimisation
Discard these fields at parse time and never store them, not even in in-memory tables:
- Spotify: `ip_addr`, `ip_addr_decrypted`, `user_agent_decrypted`, `username`, `offline_timestamp`
- Netflix: `Bookmark`, `Latest Bookmark`
- YouTube: `activityControls`

List them all in `docs/PRIVACY.md`.

### 6.7 Sample data generator
The generator is seeded and deterministic, using its own tiny PRNG (e.g. mulberry32). It runs in the worker and outputs rows **in the raw export formats**, which then go through the normal pipeline. The same seed always produces the same data, so tests are deterministic.

- **Persona "Alex":** a night-owl student with 12 months of data ending yesterday. Use only invented names for artists, songs, channels, videos and shows, and check that none of them are famous real brands.
- **Volumes:**
  - Spotify: about 60k Extended rows, including some podcasts
  - YouTube: about 9k watches, 600 searches and some YouTube Music entries
  - Netflix: about 700 rows across 2 profiles ("Alex" and "Sam"), watched from 2 countries on 3 device types
- **Plant story-worthy moments** so every card has something to show:
  - one song played 27 times in a single day
  - a 41-video, 4-hour YouTube rabbit hole
  - a 9-episode Netflix binge day
  - a 63-day listening streak
  - a clear after-midnight peak
- **Speed:** generating and ingesting the sample must take under 3 seconds on a mid-range laptop.
- **Sample mode behaviour:** show a banner "You're viewing sample data for Alex · Use your own data →". Auto-select the Alex profile; Sam stays visible in settings.

## 7. Data model (DuckDB)

```sql
CREATE TABLE spotify_plays (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, local_dow UTINYINT,
  ms_played INTEGER, kind VARCHAR,                   -- music | podcast | audiobook
  track VARCHAR, artist VARCHAR, album VARCHAR, track_uri VARCHAR,
  episode VARCHAR, show VARCHAR,
  platform VARCHAR, country VARCHAR, reason_end VARCHAR,
  skipped BOOLEAN, shuffle BOOLEAN, offline BOOLEAN, private_session BOOLEAN,
  source VARCHAR                                     -- extended | account
);

CREATE TABLE youtube_watches (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, local_dow UTINYINT,
  video_id VARCHAR, title VARCHAR, channel VARCHAR,
  product VARCHAR,                                   -- youtube | youtube_music
  unavailable BOOLEAN, est_seconds INTEGER, session_id INTEGER
);

CREATE TABLE youtube_searches (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, query VARCHAR
);

CREATE TABLE netflix_views (
  ts_utc TIMESTAMP, local_ts TIMESTAMP, local_date DATE, local_hour UTINYINT, local_dow UTINYINT,
  duration_s INTEGER, title_raw VARCHAR, series VARCHAR, season VARCHAR, episode VARCHAR,
  is_series BOOLEAN, device_class VARCHAR, country_code VARCHAR, country_name VARCHAR, profile VARCHAR
);

-- Unified view for the Life deck. Filters (period, profile, private sessions) are applied in queries.
CREATE VIEW media_events AS
  SELECT 'spotify' AS platform, local_ts, local_date, local_hour, local_dow,
         ms_played / 1000 AS seconds, FALSE AS estimated, NULL AS profile FROM spotify_plays
  UNION ALL
  SELECT 'youtube', local_ts, local_date, local_hour, local_dow, est_seconds, TRUE, NULL FROM youtube_watches
  UNION ALL
  SELECT 'netflix', local_ts, local_date, local_hour, local_dow, duration_s, FALSE, profile FROM netflix_views;
```
- Insert rows in batches, preferably as Arrow tables. Every query is parameterised with prepared statements, and user data is never concatenated into SQL.
- **Period:** by default, the 12 months ending at the latest event across all uploaded data. The user can switch to any calendar year present in the data. All decks share one period `[start, end)` in local dates.

## 8. Insight engine

### 8.1 Contract
```ts
interface InsightDef<P> {
  id: string;                                       // e.g. 'spotify.topArtist'
  deck: DeckId;
  order: number;                                    // position in the deck
  requires: (ctx: DataCtx) => boolean | Promise<boolean>;   // minimum-data rule; false → card hidden
  run: (q: QueryFn, ctx: DataCtx) => Promise<P>;    // parameterised SQL only
  a11yText: (p: P) => string;                       // one plain-language sentence for screen readers
  share?: (p: P) => SharePayload;                   // summary cards only in v1
}
```
- Each insight lives in its own file with its SQL alongside it, plus a unit test that runs it against the seeded sample (snapshot the result object).
- Card components pick the wording from templates. Choose the variant deterministically from a hash of the data, so the words stay the same after a reload.
- Every threshold and magic number lives in `insights/constants.ts`, with a comment for each.

### 8.2 Shared definitions
- **Dayparts (local time):** night 00:00–04:59, morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–23:59.
- **Deck availability:**
  - Spotify: at least 60 minutes of music
  - YouTube: at least 50 watches
  - Netflix: at least 5 hours for the selected profile
  - Life: at least 2 of the platform decks available

### 8.3 YouTube watch-time estimate
YouTube exports record when a video was opened, not how long it was watched. Estimate the time like this:
1. Sort watches by time. For each watch, `gap` = minutes until the next watch.
2. If `gap ≤ 30`, then `est = gap`. If `gap > 30`, or it's the last watch, then `est = 8` minutes (a constant).
3. A **session** (a "rabbit hole") is a run of consecutive watches whose gaps are all ≤ 20 minutes. Session length = last watch − first watch + `est(last)`.

In the UI, show "≈ 712 hours" with an ⓘ that says: *"YouTube doesn't include watch time in its exports, so we estimate it from the gaps between videos."* Unit-test the estimator, including its edge cases.

## 9. Story decks: content

**General rules:**
- **Card order:** hook → big number → top lists → behaviour → fun moment → summary. Each deck has 8–12 cards.
- **Headlines:** at most 10 words, in the second person. Tone: playful and warm, never shaming.
- **Numbers:** format them with `Intl.NumberFormat`.
- **Deck titles** in the UI: "Your Spotify story", "Your YouTube story", "Your Netflix story" and "Your online life".
- ★ marks a shareable card.
- **Names in the example copy are fictional.** Use the real values from the data.

### 9.1 Spotify deck, theme `sound`
| # | Card | Insight (data) | Visual direction | Example copy | Show if |
|---|---|---|---|---|---|
| 1 | Opener | Period, first and last dates | Kinetic headline (SplitText rise), equaliser bars pulsing at 120 BPM, colour blobs | "Your year in sound." | Deck available |
| 2 | Minutes | Σ `ms_played` for music; podcasts shown separately | Count-up number stacked across the screen | "48,213 minutes. Your ears worked overtime." | ≥ 60 min |
| 3 | Top artist | Most minutes (plays ≥ 30 s, private sessions excluded) | Generated square "cover" spinning like a record, plus stat stickers (minutes, plays, first-play date) | "You and Nova Vale had a thing this year." | ≥ 5 artists |
| 4 | Top 5 artists | Ranked by minutes | Huge rank numbers; tiles slide in staggered | "Your top 5. No skips." | ≥ 5 artists |
| 5 | Top 5 songs | Ranked by plays | Playlist rows, with an animated EQ next to #1 | "The songs that lived in your head." | ≥ 5 tracks |
| 6 | On repeat | Most plays of one track in one local day | Sticker-style date and a giant "×27" | "March 3: 'Paper Moons' ×27. We get it." | Max ≥ 5 |
| 7 | Listening clock | Minutes by local hour, giving a persona: Night Owl / Early Bird / Daytime / Evening | Radial 24-hour clock whose bars grow like an EQ, plus a persona badge | "Peak hour: 1 AM. Certified night owl." | ≥ 7 active days |
| 8 | Skips | Skip rate; most-skipped artist (min. 20 plays) | Flip-counter, fast-forward motif | "You skipped 23% of tracks. Mostly Static Bloom." | ≥ 200 plays |
| 9 | Discovery | Unique artists; "new" = first-ever play falls inside the period | Bubbles that keep popping in | "412 artists. 167 brand new to you." | ≥ 20 artists. Show "new" only if the data starts before the period |
| 10 | Streak | Longest run of consecutive days with at least one play | Calendar strip lighting up day by day | "63 days in a row. Not one silent day." | ≥ 3 days |
| 11 | Podcasts | Top show and hours | Waveform ring around a generated cover | "Your favourite voice: The Long Table." | ≥ 60 podcast min |
| 12 | Summary ★ | Top artist, top song, minutes, persona, streak | Bold multi-colour block poster | "Your year in sound." | Always |

### 9.2 YouTube deck, theme `watch`
| # | Card | Insight (data) | Visual direction | Example copy | Show if |
|---|---|---|---|---|---|
| 1 | Opener | Period | Video-player frame; a generic play triangle morphs into the headline; the scrubber starts moving | "Now playing: your year on YouTube." | Deck available |
| 2 | Videos + time | Count; ≈ hours (§8.3) | A meta line styled like video stats: "9,214 videos • ≈ 712 hr" | "9,214 videos. About 712 hours." | Always |
| 3 | Top channel | Channel with the most watches | Channel banner, generated round avatar, white pill badge "Most watched" | "Pixel Kitchen: 486 videos. Basically your roommate." | ≥ 10 channels |
| 4 | Top 5 channels | Ranked by watches | "Up next" playlist with generated 16:9 thumbnails; the pill shows a count where a duration would be | "Your channel lineup." | ≥ 5 channels |
| 5 | Rabbit hole | Longest session: start, end, count, first and last titles | Autoplay chain of thumbnails along a red timeline | "It started with 'How do magnets work?'. 41 videos later it was 3:12 AM." | Session ≥ 45 min |
| 6 | Most rewatched | `video_id` with the most watches | Replay icon spin plus a counter | "You watched 'Rain on a tin roof' 14 times. Comfort video?" | Max ≥ 3 |
| 7 | Night owl | % of watches between 00:00 and 04:59; peak hour | A 24-hour scrubber with daypart "chapters" and a heat glow | "38% after midnight. Sleep can wait, apparently." | ≥ 7 active days |
| 8 | Weekly rhythm | 7×24 heatmap | Heatmap drawn as a grid of tiny thumbnails | "Fridays at 11 PM: your prime time." | ≥ 4 weeks |
| 9 | Searches (opt-in) | Total searches; top terms (stop-words removed); first search of the period | Search bar with a typing animation | "Most searched: 'easy pasta'." | Searches present **and** enabled. Off by default for real data, on for the sample |
| 10 | YouTube Music | Top music channel, with " - Topic" stripped | Equaliser over a thumbnail | "Your YouTube Music favourite: Lo-Fi Lagoon." | ≥ 20 music entries |
| 11 | Summary ★ | Top channel, rabbit hole, videos, peak hour | End-screen layout: 4 tiles over a dimmed player frame | "That's a wrap on your year of watching." | Always |

### 9.3 Netflix deck, theme `binge`
| # | Card | Insight (data) | Visual direction | Example copy | Show if |
|---|---|---|---|---|---|
| 1 | Opener | Period | Fade from black, letterbox bars open, red light sweep | "Previously on… you." | Deck available |
| 2 | Hours | Σ duration | Huge numerals with a red glow; a "continue watching" bar fills | "214 hours. About 107 movies' worth." | Always |
| 3 | Top series | Series with the most hours: hours, episodes, seasons | Generated 2:3 poster with a "Top pick" ribbon | "Midnight Harbor owned your evenings: 38 episodes." | ≥ 1 series |
| 4 | Top 5 titles | Ranked by hours | Giant outlined rank numerals beside posters (the Top-10-row pattern) | "Your top 5, ranked." | ≥ 5 titles |
| 5 | Binge record | Most episodes of one series in one local day | Episode tiles stacking "S1:E1 … S1:E9", with a spinning clock | "Oct 12: 9 episodes of Midnight Harbor. Snacks were involved." | ≥ 3 episodes |
| 6 | Movies vs series | Hours split; top movie | Two rows ("Series" / "Movies") with proportional bars | "You're a series person: 81% episodes." | Both present |
| 7 | Latest night | Latest start between 00:00 and 04:59; % of viewing at night | Moonlit red glow, flickering timestamp | "Latest night: 3:47 AM. One more episode." | Any night viewing |
| 8 | Where you watch | Device-class split | Generic device silhouettes filling with red | "62% on the big screen." | ≥ 2 classes |
| 9 | Around the world | Distinct countries | Country chips with code and name; an optional dotted map, only if it stays under 50 KB | "Streaming from 2 countries. Passport approved." | ≥ 2 countries |
| 10 | Summary ★ | Hours, top series, binge record, persona (Binger / Night Watcher / Movie Buff / Series Loyalist) | Movie-poster summary with credits-style text | "Your year on screen." | Always |

### 9.4 Combined deck, theme `aurora` (Life, Wrapped's own brand)
This deck appears only when at least 2 platform decks are available. Otherwise, each platform deck ends with an "Add another platform to unlock your online life story" card.

| # | Card | Insight (data) | Visual direction | Example copy |
|---|---|---|---|---|
| 1 | Opener | none | Three platform-coloured orbs orbit and merge | "Now, all of it together." |
| 2 | Total time | Σ seconds, with "≈" if YouTube is included | Big number plus a days conversion | "≈ 1,480 hours. That's 62 days." |
| 3 | Platform split | Share of time per platform | Donut with direct labels (never colour alone) | "Music got the most of you." |
| 4 | Daily rhythm | Stacked area by local hour per platform | Aurora-coloured stacked area | "Mornings: music. Nights: YouTube. Weekends: Netflix." (generated from the data) |
| 5 | Busiest day | Date with the most combined time, plus that day's timeline | Horizontal day timeline with platform segments | "March 9 was a lot: 11 hours of everything." |
| 6 | Weekday vs weekend | Split | Two bars | "Weekends belong to Netflix, apparently." |
| 7 | Media personality | Archetype plus the 3 metrics that decided it | Badge reveal that shows the "why" | "You're The Night Owl: 41% after midnight." |
| 8 | Summary ★ | All headline stats | Poster that combines the three palettes | "Your online life, wrapped." |

**Archetypes.** Score each one as metric ÷ threshold and pick the highest; break ties by list order. Thresholds live in `constants.ts`.
- **Night Owl:** at least 30% of time between 00:00 and 04:59.
- **Binge Master:** a Netflix record of at least 5 episodes in a day.
- **Rabbit-Hole Diver:** a YouTube session of at least 3 hours.
- **Explorer:** at least 300 Spotify artists or 500 YouTube channels.
- **Loyalist:** top artist accounts for at least 15% of music minutes.
- **Soundtrack Life:** Spotify accounts for at least 60% of total time.

**Platform colours in the Life deck:** Spotify green `#1ED760`, YouTube red `#FF3355`, Netflix amber `#FFB020`. In real life YouTube and Netflix are both red, so amber keeps them apart. Always pair colours with labels or icons.

## 10. Theme system: each deck looks like its platform

### 10.1 The 1-second test
Anyone who glances at a card for one second should know which platform it's about, **with no logo on screen**. Use four levers to get there: **colour, typography, layout patterns, and motion.** At the end of M3 and M4, screenshot every card and review them yourself against this test.

### 10.2 Tokens
- Each theme is a typed token object (`story/themes/*.ts`) applied as CSS variables on the player root (`data-theme="sound"`).
- Cards read colours only through tokens or CSS variables, never hard-coded hex values.
- The app shell (landing, start, privacy) uses `aurora`.

| Token | `sound` (Spotify-inspired) | `watch` (YouTube-inspired) | `binge` (Netflix-inspired) | `aurora` (own brand) |
|---|---|---|---|---|
| Base background | `#121212` | `#0F0F0F` | `#000000` | `#0A0A1A` |
| Surface | `#1F1F1F` | `#272727` | `#181818` | `#14142B` |
| Text / muted | `#FFFFFF` / `#B3B3B3` | `#F1F1F1` / `#AAAAAA` | `#FFFFFF` / `#B3B3B3` | `#F5F5FF` / `#A6A6C8` |
| Accent | `#1ED760` | `#FF0033` | `#E50914` (large text and shapes only, because its contrast on black is under 4.5:1) | Gradient `#7C5CFF` → `#22D3EE` → `#A3E635` |
| Card backdrops (rotate per card) | Bold duotones: lime `#C6F432` with ink `#121212`; pink `#FF6FB5` with ink; electric blue `#3D5AFE` with white; orange `#FF6B35` with ink; deep green `#0E3B2B` with `#1ED760` | Mostly dark with red accents; an occasional light "page" card (`#FFFFFF` with `#0F0F0F` text) | Black with red radial glows, a vignette and subtle static film grain | Deep indigo with slow aurora gradients |
| Display font | **Figtree** 800–900, tight tracking | **Roboto Condensed** 700–800; Roboto for body | **Bebas Neue**; Inter for body | **Space Grotesk** 700; Inter for body |
| Shapes | Pills, blobs, stickers, circles, rounded square tiles | 16:9 rectangles (radius 12), round avatars, pill buttons | 2:3 posters, sharp edges, letterbox bars | Orbs, soft glows |
| Motion | Bouncy and rhythmic: `back.out(1.7)`, elastic pops, a 500 ms beat pulse | Snappy, like UI: `power3.out` 250–400 ms, scrubber sweeps, thumbnail cascades | Cinematic: `expo.out` 0.8–1.2 s, fades from black, slow Ken Burns zoom | Dreamy: `sine.inOut`, slow drifts |
| Progress chrome | Rounded white pill segments | One red video scrubber with a chapter notch per card and a round knob | Thin red segments plus an "Episode 3 of 10" label | Thin gradient segments |
| Card-to-card transition | Colour-wipe blob | Vertical swipe, like Shorts | Fade through black | Crossfade with an orb drift |

- Load fonts with `next/font/google`, which self-hosts them at build time, so no requests go out at runtime.
- Every declared text/background pair must meet WCAG AA: 4.5:1 for body text, 3:1 for large text. Add a unit test that checks every pair each theme declares.

### 10.3 Generated artwork (no real images)
Exports contain no images, and fetching covers or thumbnails would break the privacy promise. So generate art deterministically from each name: hash → palette + pattern + initials.
- `sound`: square "covers": a gradient, a geometric pattern and initials.
- `watch`: 16:9 "thumbnails": a dark gradient, big initials, a fake progress bar and a pill showing the user's count. Channel avatars are round, with initials.
- `binge`: 2:3 "posters": a moody gradient, the title in Bebas Neue and a small "Series"/"Film" tag.

The same name always produces the same art, everywhere in the app.

### 10.4 Motion rules
- Each card has one GSAP timeline. It plays when the card becomes active, pauses while the user holds, and is cleaned up on unmount (`useGSAP`).
- **Count-up numbers:** the final value is in the accessible text from the start (`aria-label`), and only a visual copy animates.
- **`prefers-reduced-motion: reduce`:** no movement at all. Use simple 200 ms fades, no pulsing or parallax, and show numbers at their final value immediately.
- **Animate only `transform` and `opacity`.**
- **Decorative WebGL** is allowed only as the Life deck's background, and it must sit outside the PNG capture area.

## 11. Story player
- **Layout:** the frame is 9:16. On mobile it's full screen. On desktop it's centred (max-height 90vh) over a blurred backdrop in the deck's theme, with keyboard hints.
- **Navigation:**
  - Tap the right two-thirds for the next card and the left third to go back.
  - Press and hold to pause; on mobile, swipe down to close.
  - Keyboard: ←/→ to move, Space to pause, Esc to close.
  - Every gesture also has a visible button.
- **Auto-advance:** 7 s per card. Summary cards don't auto-advance. The user can always pause (WCAG 2.2.2).
- **Accessibility:**
  - Each card has `role="group"`, `aria-roledescription="slide"` and `aria-label="3 of 12: Top artist"`.
  - An `aria-live="polite"` region announces the card's `a11yText` when the card changes.
  - All text is real DOM text, never canvas.
- **End of a deck:** show "Next: your YouTube story →" and chain to the next available deck. The Life deck plays last.
- **Card actions:**
  - "Save image" exports a 1080×1920 PNG on the client.
  - ★ cards also get "Share link" (§13).
- **Settings sheet:**
  - time zone and period
  - include private sessions (Spotify)
  - include searches (YouTube)
  - Netflix profile
  - Clear my data

## 12. Pages and flow
1. **Landing `/`**
   - **Hero:** a muted mini story preview that plays automatically and respects reduced motion. It's built from a small committed static JSON of sample card props, **not** the engine, so DuckDB stays off the landing page.
   - **Headline:** *"Your whole online life, wrapped. Without it ever leaving your device."*
   - **Calls to action:** primary **Try with sample data**, secondary **Use my own data**.
   - **Sections:** How it works (3 steps), the privacy promise ("Turn off your Wi-Fi: it still works"), supported exports, FAQ, and a footer with the disclaimer.
2. **Start `/start`**
   - **Drop zone.**
   - **Three export guides** in accordions, each with its official link and a note that platform menus change:
     - **Spotify:** `https://www.spotify.com/account/privacy/` → Download your data. "Extended streaming history" is the richest option and can take up to 30 days. "Account data" is faster but covers only the last year.
     - **YouTube:** `https://takeout.google.com` → deselect all → YouTube and YouTube Music → choose only "history" → Multiple formats → History: JSON.
     - **Netflix:** `https://www.netflix.com/account/getmyinfo`.
   - **After ingestion:** a summary of what was found → the Netflix profile picker → tiles for each available deck, previewed in their own themes → **Play my story**.
3. **Story `/story/[deck]`:** the player. Engine state lives in the worker for the tab's lifetime. On reload with real data, go back to `/start` with a friendly note that nothing is saved by design. With `?sample=1`, regenerate the sample instantly.
4. **Shared card `/s/[id]`:** the card rendered on the server in its theme, a "Make your own" call to action, and a "Sample data" badge if it came from the sample. If this browser holds the delete token (in `localStorage`), show a Delete button.
5. **Privacy `/privacy`:** the data flow in plain English, what gets dropped, and how to verify it.

## 13. Sharing (the only server feature)
- **`POST /api/share`:**
  - The body is validated with Zod against a per-card-type whitelist: numbers plus at most 5 short names, each at most 80 characters with control characters stripped.
  - Total payload at most 4 KB.
  - Raw rows are never accepted.
- **Preview before upload:** the UI shows "This is everything that will be shared:" with the exact JSON and a Confirm button.
- **Response:** `{ id: nanoid(10), deleteToken }`. Store only `sha256(deleteToken)`.
- **Table:** `shared_cards(id, created_at, card_type, theme, is_sample, payload jsonb, delete_token_hash)`.
- **Delete:** `DELETE /api/share/[id]` with the token.
- **Rate limit:** 10 shares per IP per hour, keyed by `sha256(ip + SHARE_SALT)`. Never store raw IPs.
- **OG image:** `/s/[id]/opengraph-image.tsx` renders a 1200×630 themed card with `next/og`. Embed the fonts as ArrayBuffers.
- **Without `DATABASE_URL`:** the app still works fully, and the share buttons explain that sharing isn't configured.
- **Environment variables:** `DATABASE_URL` and `SHARE_SALT`. Ship a `.env.example`.

## 14. Privacy enforcement (make it provable)
- **Security headers / CSP:**
  `default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; worker-src 'self' blob:; script-src 'self' 'wasm-unsafe-eval' <nonce or the minimum Next.js needs>; style-src 'self' 'unsafe-inline'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'`.
  `connect-src 'self'` is the directive that blocks data exfiltration. If using a nonce forces every page to render dynamically, pick the better trade-off and record it in DECISIONS.md.
- **PWA (Serwist):** precache the app shell, fonts, the DuckDB bundles and the worker. The app is installable and works offline after the first visit.
- **Playwright privacy test:** load the sample data and the real-format fixtures, play every deck, and assert that:
  - there are zero requests to other origins
  - no request carries a body, except the one sent after an explicit share confirm
  - after `context.setOffline(true)`, the whole flow still works
- **Docs:** `docs/PRIVACY.md`, plus a README section "Verify the privacy claim yourself" (DevTools → Network tab).

## 15. Performance budgets
- **Landing:**
  - LCP under 2 s on simulated 4G
  - at most 150 KB of JS (gzipped) before the user does anything
  - DuckDB, the GSAP plugins and the player load only after "Try sample data" or "Use my own data"
- **Ingestion:**
  - 500k rows end-to-end in under 10 s on a mid-range laptop
  - the sample in under 3 s
  - the UI never freezes: heavy work happens in the worker, and ArrayBuffers are transferred, not copied
- **Story:** 60 fps on mid-range phones, with no layout thrashing.
- **Lighthouse (landing, mobile):** Performance ≥ 90, Accessibility 100, Best Practices ≥ 95. Record the real numbers in the README.

## 16. Testing
- **Unit tests (Vitest):**
  - detection
  - every parser, against fixtures for:
    - old and new Spotify formats
    - a localised YouTube export, ads and removed videos
    - Netflix with multiple profiles, supplemental rows and tricky titles
  - time-zone conversion, including DST
  - the YouTube estimator, the Netflix title parser and the device classifier
  - every insight, against the seeded sample (result snapshots)
  - theme contrast pairs
  - the share schema
- **E2E tests (Playwright, Chromium):**
  - landing → sample → every deck played to the end
  - uploading the fixture files
  - changing settings updates the cards
  - the share flow, against a test DB or a mocked route
  - the privacy test and the offline test (§14)
  - an axe scan of landing, start and story pages (no serious or critical issues)
  - visual snapshots of every card in every theme, with reduced motion on
- **Fixtures:** small hand-written files in the real formats under `tests/fixtures/`.
- **CI (GitHub Actions):** install → typecheck → lint → unit → build → E2E. Put the status badge in the README.

## 17. Docs and CV readiness
- **README:**
  - name and one-line pitch
  - a 20–30 s GIF of a story (placeholder until M6)
  - the live link and a direct "Try with sample data" link
  - features
  - "Verify the privacy claim yourself"
  - a Mermaid architecture diagram
  - the tech stack, with a one-line reason for each choice
  - **engineering highlights:** DuckDB in a worker, the YouTube estimator, shape-based detection, the theme system, the privacy test
  - local setup in 3 commands
  - tests, roadmap and the disclaimer
- **docs/DECISIONS.md** covers at least:
  - DuckDB-WASM vs plain JS
  - why use a worker
  - why there are no accounts
  - the YouTube estimate
  - generated art instead of real covers
  - "inspired-by" themes and naming/trademark considerations
  - CSP trade-offs
  - why Postgres is used only for sharing
- **docs/ARCHITECTURE.md:** data flow, the worker API, the insight registry and the theme system.
- **docs/PROGRESS.md:** the milestone checklist, plus "Next session starts here".

## 18. Milestones (one per session)

**M0: Foundation**
- **Scaffold:**
  - Next.js, TS strict, pnpm, Tailwind v4, shadcn/ui
  - ESLint and Prettier
  - Vitest and Playwright
  - GitHub Actions CI
- **Docs:** the `docs/` files.
- **Themes:** theme token files and fonts.
- **Pages:** a landing skeleton with the disclaimer footer.
- **Engine:** an engine worker using Comlink and the self-hosted DuckDB-WASM, running `SELECT 42`.
- **Config:** initial security headers and `.env.example`.
- **`CLAUDE.md`:** a summary of the conventions that points to this file.

✅ Done when: CI is green, `pnpm dev` shows the landing page, a test proves the worker runs a DuckDB query, and the README contains Vercel deploy steps.

**M1: Ingestion and sample data**
- the drop zone (files, folders, zips) and detection
- the three parsers, minimisation and time conversion
- the DuckDB tables
- the Netflix profile picker
- the progress UI and the export guides
- the seeded sample generator

✅ Done when: all parser fixtures pass, the sample loads in under 3 s, `/start` shows a correct summary for both the fixtures and the sample, and an HTML Takeout file gets the friendly message.

**M2: Insight engine**
- the registry and constants
- every insight for all four decks, each with its minimum-data rule and a11y text
- the YouTube estimator
- unit tests against the sample

✅ Done when: every insight has a passing test, and a dev-only debug page lists the JSON of every sample insight.

**M3: Story player and the Spotify deck**
- **Player:** gestures, keyboard, auto-advance, pause, a11y, reduced motion, deck chaining.
- **Theming:** theme application and generated art.
- **Spotify deck:** the charts it needs and every Spotify card.
- **Export:** PNG export.

✅ Done when: the Spotify deck passes the 1-second test (you reviewed the screenshots), plays end-to-end in E2E, has visual snapshots, and passes axe.

**M4: YouTube and Netflix decks**
Every YouTube and Netflix card, with its theme, progress chrome, transition and art.

✅ Done when: both decks meet the same criteria as M3.

**M5: Life deck, sharing and the privacy proof**
- the aurora deck and the personality archetypes
- the share API with Neon, Drizzle, rate limiting and delete
- `/s/[id]` and its OG image
- the final CSP and the privacy E2E test

✅ Done when: sharing works end-to-end against a real or test DB, the privacy test passes, and the app degrades gracefully without `DATABASE_URL`.

**M6: PWA, performance, polish and launch**
- Serwist offline support
- budgets checked, with the numbers recorded
- Lighthouse
- a copywriting pass, plus empty and error states
- complete docs
- a final deploy checklist

✅ Done when: the offline test passes, the budgets are met, the README is complete, and every box in §19 is ticked.

## 19. Definition of done (whole project)
- [ ] Live on Vercel; the sample story is reachable in at most 2 clicks, and through a direct `?sample=1` link.
- [ ] All four decks pass the 1-second theme test, with no logos or proprietary fonts anywhere.
- [ ] Real exports from all three platforms work, including old and new Spotify formats.
- [ ] The privacy and offline tests pass in CI, and the CSP is active.
- [ ] Unit, E2E, axe and visual tests are green in CI, with the badge in the README.
- [ ] Reduced motion and keyboard-only use are fully supported.
- [ ] README, DECISIONS, ARCHITECTURE and PRIVACY are written in plain English.
- [ ] The disclaimer is in the footer and the README.

## 20. Session kickoff prompts (copy one per session)

**Session 1 (M0):**
> Read MASTER_PROMPT.md fully. Build Milestone M0 exactly as specified, including docs/PROGRESS.md and CLAUDE.md. Run all checks, commit and push. Finish with a short summary of what's done, what M1 needs, and anything I must do by hand (accounts, environment variables).

**Sessions 2–7 (M1 … M6):**
> Read MASTER_PROMPT.md and docs/PROGRESS.md. Build Milestone M{n} only and meet its "Done when" criteria. Run all checks, update PROGRESS.md and DECISIONS.md, commit and push. Finish with a short summary and anything I must do by hand.
