# Architecture decisions

Short ADRs in plain English: context → decision → alternatives → consequences.

---

## ADR-001: DuckDB-WASM instead of plain JavaScript for analysis

**Context.** A real Spotify Extended history can be 500k+ rows. Every insight is a group-by, a window, or a ranking over those rows, often with filters (period, profile, private sessions) that the user can change at any time.

**Decision.** Load the parsed rows into DuckDB-WASM tables and express every insight as a parameterised SQL query.

**Alternatives.** Hand-written JS loops (fast to start, but every insight becomes custom aggregation code with its own bugs); a JS dataframe library (less mature, slower on big group-bys); SQLite-WASM (row-oriented, slower for analytics).

**Consequences.** Insights read like their definition ("top artist by minutes where plays ≥ 30 s") and are easy to review and test. DuckDB is columnar and vectorised, so 500k rows aggregate in milliseconds. The cost is a ~36 MB WASM file (≈8 MB compressed), loaded only after the user starts, and cached by the service worker.

## ADR-002: All heavy work runs in a dedicated Web Worker

**Context.** Unzipping, parsing and querying hundreds of thousands of rows would freeze the page if it ran on the main thread.

**Decision.** One engine worker per tab owns parsing, DuckDB and the insight registry. The UI talks to it with Comlink (typed async calls; callbacks via `Comlink.proxy`). Files are passed as `File` objects (structured-cloned handles, not copies) and buffers are transferred.

**Alternatives.** Main thread with chunking (`requestIdleCallback`) — still janky; a server — breaks the privacy promise.

**Consequences.** The UI stays at 60 fps during ingestion. The engine is written as an environment-agnostic `createEngine({ createDb })`, so the exact same code runs in Vitest with DuckDB's Node build.

## ADR-003: No user accounts

**Context.** Accounts would mean storing identities and, sooner or later, data.

**Decision.** No accounts. Data lives in worker memory for the life of the tab. Sharing uses an anonymous id plus a delete token kept in the sharer's `localStorage`.

**Consequences.** Nothing to breach, nothing to delete on request, no GDPR subject-access burden. Reloading with real data means re-dropping the files; the app explains that this is by design.

## ADR-004: Estimating YouTube watch time from gaps

**Context.** Takeout's watch history records when a video was opened, not how long it played.

**Decision.** Sort watches; the estimated time of a watch is the gap to the next one if that gap is ≤ 30 minutes, otherwise a constant 8 minutes (also used for the last watch). A "session" (rabbit hole) is a run of watches whose gaps are all ≤ 20 minutes. The UI always shows "≈" with an ⓘ explaining the method.

**Alternatives.** Looking up real durations (needs a network call per video — breaks privacy); a flat per-video constant (ignores binge behaviour); no time at all (loses the most interesting YouTube stat).

**Consequences.** The number is honest about being an estimate and tends to under-count long videos watched alone. Constants live in `insights/constants.ts` and the estimator has edge-case unit tests.

## ADR-005: Generated artwork instead of real covers and thumbnails

**Context.** Exports contain no images. Fetching album art or thumbnails would leak what the user listens to and watches to third parties, and it would put copyrighted images in shareable PNGs.

**Decision.** Generate art deterministically from a hash of the name: palette, pattern and initials (square covers, 16:9 thumbnails, 2:3 posters, round avatars).

**Consequences.** Zero network requests, the same name always looks the same, and shared images contain no third-party artwork.

## ADR-006: "Inspired-by" themes and trademarks

**Context.** Each deck should feel like its platform, but the project must not imply endorsement or copy protected brand assets.

**Decision.** Evoke platforms only through colour, free Google Fonts (Figtree, Roboto Condensed, Bebas Neue), layout patterns and motion. No logos, icons, wordmarks, screenshots, proprietary fonts or sounds. Platform names are used only descriptively ("Your Spotify story"). Every page footer and the README carry the non-affiliation disclaimer. Internally the themes are named `sound`, `watch`, `binge` and `receipt` (originally `aurora`, see ADR-036), not after the brands.

**Consequences.** The "1-second test" relies on colour, type and layout patterns. Netflix red is used only for large text and shapes because its contrast on black is under 4.5:1.

## ADR-007: CSP without nonces (static pages + 'unsafe-inline' scripts)

**Context.** Next.js App Router pages include small inline bootstrap scripts. A strict nonce-based CSP requires every page to be rendered dynamically per request.

**Decision.** Keep pages static and use `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`. Everything else is locked down: `connect-src 'self'`, `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.

**Alternatives.** Nonces via `proxy.ts` (strongest XSS protection, but every page becomes dynamic: slower TTFB, no static CDN caching, and the offline service worker would cache pages with stale nonces); hashes (Next's inline scripts change per build and per page).

**Consequences.** The privacy promise is about exfiltration, and `connect-src 'self'` blocks it whether or not an injected script runs: a script can't `fetch`, `XHR`, `WebSocket` or `sendBeacon` anywhere but our own origin, and `img-src`/`font-src` are limited to self/data/blob. The app renders no user-supplied HTML (React escapes all text), so the residual XSS risk is low. Static pages keep the landing page fast and the app fully offline-capable.

The policy in `next.config.ts` is the final one: sharing, the share page and the preview images needed no exceptions, because they only talk to our own origin. `tests/e2e/privacy.spec.ts` checks the header and that a cross-origin `fetch` is actually blocked.

## ADR-008: Postgres only for sharing

**Context.** The only server feature is an optional share link for a summary card.

**Decision.** Neon Postgres via Drizzle, touched only by `/api/share`. A row holds the card type, theme, a sample flag, a ≤ 4 KB whitelisted JSON payload and the SHA-256 of the delete token. Rate limits key on `sha256(ip + SHARE_SALT)`; raw IPs are never stored.

**Consequences.** The database cannot contain raw rows by construction (Zod whitelist per card type). Without `DATABASE_URL` the app still works fully and share buttons explain that sharing isn't configured.

## ADR-009: Next.js 16 with Turbopack, and Serwist's Turbopack integration

**Context.** The spec names Next.js and Serwist (`@serwist/next`). `@serwist/next` is a webpack plugin; Next.js 16 builds with Turbopack by default.

**Decision.** Stay on Turbopack and use `@serwist/turbopack`, which builds the service worker with esbuild and serves it from a route handler (`/serwist/sw.js`).

**Alternatives.** `next build --webpack` with `@serwist/next` (slower builds, a legacy path in Next 16).

**Consequences.** Same Serwist runtime and precache manifest, faster builds. The SW URL is `/serwist/sw.js` rather than `/sw.js`.

## ADR-010: AsyncDuckDB inside the engine worker; Node blocking build in tests

**Context.** DuckDB-WASM's package exposes an async API (which runs DuckDB in its own worker) and a blocking API (not exported for browsers in this version).

**Decision.** The engine worker creates `AsyncDuckDB` with the self-hosted EH worker script, so DuckDB runs in a nested worker owned by the engine. Unit tests use the package's Node blocking build behind the same small `Db` interface (`exec`, `query(sql, params)`, `insertArrow`).

**Consequences.** One SQL dialect and engine version everywhere; insights are tested against the real thing, not a mock. Nested workers are supported in all evergreen browsers.

## ADR-011: Loading rows through Arrow IPC staging tables

**Context.** DuckDB-WASM bundles its own `apache-arrow`. Passing Arrow `Table` objects across library copies breaks `instanceof` checks, and Arrow timestamp types are fiddly.

**Decision.** Build simple typed columns in JS (epoch-millis doubles, strings, booleans, ints), serialise with `tableToIPC`, insert into a staging table, then `INSERT … SELECT` into the real table with `epoch_ms()` conversions in SQL. `apache-arrow` is pinned to the major version DuckDB-WASM expects.

**Consequences.** Version-independent, fast (columnar, no JSON), and every type conversion is visible in one SQL statement.

## ADR-012: Every aggregate leaves SQL as DOUBLE or VARCHAR

**Context.** DuckDB returns `SUM(INTEGER)` as HUGEINT and `COUNT(*)` as BIGINT, which arrive in JS as decimals or bigints.

**Decision.** Open DuckDB with `castBigIntToDouble` and `castDecimalToDouble`, normalise any remaining bigint in `normaliseRow`, and format dates in SQL with `strftime`.

**Consequences.** Insight results are plain JSON: safe to snapshot, post across Comlink and render.

## ADR-013: Building every milestone in one session

**Context.** The spec suggests one milestone per session. The owner asked for the whole build in one go.

**Decision.** Build M0–M6 sequentially in one session, still committing per milestone and keeping PROGRESS.md current so the history reads milestone by milestone.

**Consequences.** Same commit history and docs as the multi-session plan.

## ADR-014: Spotify play start = timestamp − ms played, for both formats

**Context.** The spec says Account data's `endTime` marks the end of playback. Spotify documents Extended history's `ts` the same way ("when the track stopped playing"), but the spec doesn't say.

**Decision.** For both formats, start ≈ end − ms played. Local hour, day and streaks use the start.

**Alternatives.** Using `ts` as the start for Extended (simpler, but long podcast episodes would be counted an hour late and both formats would disagree).

**Consequences.** Both formats agree to the minute, and a song that started at 23:58 counts for that day.

## ADR-015: "Prefer Extended" compares whole UTC days

**Context.** When both Spotify formats are uploaded, Account rows that overlap Extended must be dropped. Account data only has minute precision, so the same play can land a few seconds outside Extended's exact time range and be counted twice.

**Decision.** Compute the first and last UTC day covered by Extended; drop Account rows on or between those days.

**Consequences.** No double counting at the edges. Extended is the user's whole history, so Account rows inside its range are always redundant.

## ADR-016: How the sample persona's data is shaped

**Context.** The sample must make every card worth showing. The discovery card shows "new artists" only when data starts before the period, and the night-owl story only works if "after midnight" is after midnight for the viewer.

**Decision.** Alex's Spotify history spans 18 months (YouTube and Netflix 12), ending yesterday. About 60k rows over 18 months, with a realistic mix of skips and partial plays, works out to roughly 3–4 hours of music a day; squeezing 60k rows into 12 months would mean 6+ hours a day. Sessions never overlap (one person, one device), and Alex isn't on Spotify or YouTube during the Netflix binge. The generator works in local wall-clock time for the viewer's time zone and converts to UTC, so the planted moments (27 plays in a day, a 63-day streak, a 41-video rabbit hole ending at 3:12 AM, a 9-episode binge) land as intended everywhere. Tests pin the seed, the time zone and "now".

**Consequences.** Same seed + time zone + date → byte-identical files. The sample covers slightly more than the "12 months" in the persona description, which only shows up as a correct "new to you" count.

## ADR-017: No code evaluation anywhere (CSP without 'unsafe-eval')

**Context.** Two libraries try to compile code at runtime: Apache Arrow's builders build a null check with `new Function`, and Zod 4 compiles fast validators the same way. Our CSP correctly blocks this, which broke ingestion in the browser while every Node test passed.

**Decision.** Build Arrow vectors directly with `nullValues: []` (our columns never contain nulls; they travel as '' and become NULL in SQL) and run Zod with `jitless: true`. A unit test replaces the global `Function` constructor with one that throws and runs the full sample ingestion.

**Consequences.** The CSP stays strict, and any future dependency that evaluates strings fails in CI, not in production.

## ADR-018: Which zip entries are opened

**Context.** The spec says to decompress only entries matching known patterns, but Takeout localises file names (`historial-de-reproducciones.json`).

**Decision.** Allow known English names for all three platforms, plus any `.json`/`.html` inside a folder whose path mentions "YouTube". Everything that is opened is then identified by its content shape.

**Consequences.** Account details, payment history, mail and other unrelated files in an export are never inflated. A localised YouTube history still works.

## ADR-019: Performance budgets are asserted in serial tests

**Context.** Functional E2E tests run in parallel workers, each with its own DuckDB-WASM, which makes wall-clock timings noisy.

**Decision.** Functional tests record timings as annotations. Budgets are asserted in two places that run alone:

- `tests/perf/budgets.test.ts` (Vitest, its own run): the sample in under 3 s, 500k real-format rows ingested in under 10 s, and each deck in under a second.
- `tests/e2e/perf.spec.ts` (a Playwright project that depends on all the others, so it runs last): landing → first sample card in under 5 s, and the sample loaded in under 3 s once `/start` has warmed DuckDB up. Engine boot is covered by the landing → story budget.

**Consequences.** No flaky timing failures, while every budget in §15 is enforced. Timings are taken with event-driven waits (`locator.waitFor`), not `expect` retries, whose back-off would round them up.

## ADR-020: What private sessions count towards

**Context.** The spec says private sessions count in totals but not in top lists or anything shareable.

**Decision.** Private-session rows count in time totals and patterns: minutes, the listening clock, the streak, the skip rate and the Life deck's totals. They are excluded from everything that names something: top artist/songs, on repeat, discovery, most-skipped artist, top podcast and the summary card. One shared SQL fragment (`spotifyPlays`) applies the rule, and "Include private sessions" switches it off.

**Consequences.** A test proves a private-only artist never appears in any card's JSON until the user opts in.

## ADR-021: YouTube Music is kept apart from channel rankings

**Context.** Takeout mixes YouTube Music plays ("Artist - Topic") into watch history. Music listening is many short plays, so artist channels would push real channels out of the top-5.

**Decision.** Channel cards, the rewatch card and the summary rank regular YouTube watches only. YouTube Music gets its own card. Totals (videos, estimated hours, the clock and heatmap) include everything that was watched.

**Consequences.** "Top channel" means a channel you watched, and the music card still tells the music story.

## ADR-022: How the Life deck phrases the daily rhythm

**Context.** "Mornings: music. Nights: YouTube." is generated from data. Picking the platform with the most time in each daypart makes the biggest platform win every slot ("Mornings: music. Nights: music.").

**Decision.** Each daypart names the platform that is most over-represented there: its share of that daypart divided by its share of all time. Weekends name the platform whose time per day grows most from weekdays to weekends.

**Consequences.** The sentence describes what defines each part of the day, which is what people mean by it, and it stays true to the data. The stacked-area chart beside it shows the absolute hours.

## ADR-023: Netflix persona and binge tiles

**Context.** The Netflix summary needs a persona, and the binge card's "S1:E1 … S1:E9" visual implies episode numbers the export doesn't contain (it has episode names, not numbers).

**Decision.** The persona is the highest of four scores (metric ÷ threshold, like the Life archetypes): Binger (episodes in a day), Night Watcher (share after midnight), Movie Buff (share of films) and Series Loyalist (top series' share). Thresholds live in `constants.ts`. Binge tiles show the season label and episode name with their order that day (1…9), never invented episode numbers.

**Consequences.** Nothing on screen claims more than the export says.

## ADR-024: Cards are sized in container-query units

**Context.** A card must look identical in a phone-sized frame, a desktop frame and a 1080 × 1920 PNG.

**Decision.** The 9:16 frame is a size container, and everything inside a card is sized in `cqw`/`cqh`. The frame decides the scale; the card's layout never changes.

**Alternatives.** Rem-based sizes with breakpoints (cards would reflow differently on every device); rendering at a fixed size and scaling with `transform` (blurry text, broken hit-testing).

**Consequences.** One layout everywhere, and the export is a re-render at 1080 px wide rather than an upscaled screenshot.

## ADR-025: Image export re-renders the card off-screen

**Context.** `html-to-image` inlines the computed styles of the node it captures, so capturing the on-screen card at a different size keeps on-screen pixel sizes; mid-animation captures also catch half-finished motion.

**Decision.** "Save image" mounts a second copy of the card in an off-screen 1080 × 1920 box with motion off (the final frame) and captures that. Only the card surface is captured, not the player chrome.

**Consequences.** Crisp, complete images every time. The cost is one extra render of one card, only when the user asks.

## ADR-026: Chrome colours come from contrast-tested pairs

**Context.** The player's controls sit on every backdrop: lime, pink, blue, black, white. Semi-transparent black pills failed contrast on bright cards, and white text on YouTube red (#FF0033) is only 3.96:1.

**Decision.** Controls use the current card's ink and background (`--c-ink`/`--c-bg`), which `tests/unit/themes.test.ts` checks for every backdrop. Each theme also declares a call-to-action pair (`cta`/`onCta`) for filled buttons with small text, checked at 4.5:1. YouTube's uses a deeper red (#CC0029). Axe runs on every card in E2E.

**Consequences.** Controls adapt to the card instead of fighting it, and a new backdrop can't introduce an unreadable control without failing a test.

## ADR-027: Pausing freezes content, not the card transition

**Context.** Hold-to-pause and the pause button stop a card's animations and the auto-advance timer. Pausing during the entrance transition left a card frozen half-faded.

**Decision.** The card-to-card transition always runs to the end; pausing affects the card's own timelines, ambient loops and the timer.

**Consequences.** A paused card is always fully visible.

## ADR-028: A pinned date for the sample, and per-OS visual baselines

**Context.** The sample ends "yesterday", so its dates (and pixels) change daily. Font rendering also differs between Windows and Linux, so one set of screenshots can't serve both.

**Decision.** `/story/<deck>?sample=1&asOf=YYYY-MM-DD` generates the sample for a fixed date (it only affects the sample). Visual tests use it with a fixed time zone and reduced motion. Baselines are stored per OS; Linux ones are produced by the manual "Visual baselines" workflow and committed. Until a deck has Linux baselines, CI skips its visual test instead of silently writing new ones.

**Consequences.** Visual tests are deterministic. A deliberate visual change needs one workflow run to refresh the Linux baselines.

## ADR-029: Decorative visuals still show real data

**Context.** Several card visuals in the spec are partly decorative: Netflix's "continue watching" bar, device silhouettes "filling with red", the YouTube scrubber chapters and the heatmap. A decorative fill that doesn't mean anything would quietly break the "never invent data" rule.

**Decision.** Every fill, length and brightness encodes a number that is also printed next to it: the "continue watching" bar is days with viewing ÷ days in the period; device fills are each device's share relative to the most-used device (the true percentage is printed under each); scrubber chapters are shaded by each daypart's share; the 7 × 24 heatmap is transposed (hours down, weekdays across) so it fits a portrait card at a readable size.

**Consequences.** Nothing on a card is "just for show", and screen-reader text carries the same numbers.

## ADR-030: Shared cards are rebuilt from the whitelist and drawn by the story's own components

**Context.** `/s/[id]` must show the card "rendered on the server in its theme". The stored payload is deliberately poorer than the card's full props (only whitelisted numbers and names).

**Decision.** The page re-validates the stored row against the same Zod whitelist on every read (a row that no longer matches is treated as missing), rebuilds the summary card's props from it (`src/share/cards.ts`), and renders the real summary component in its still, final frame (`SharedCard.tsx`, `SUMMARY_CARDS`). Fields that weren't shared stay empty rather than being guessed. The page is dynamic and `noindex`, and a deleted card disappears immediately.

**Alternatives.** A separate "share card" design (two layouts to keep in sync); a screenshot uploaded by the client (an image could carry anything, and it would bypass the whitelist).

**Consequences.** A shared card looks exactly like the one in the story, and the whitelist is the single definition of what can be shown publicly.

## ADR-031: PGlite stands in for Postgres in tests

**Context.** Sharing must be tested end to end "against a real or test DB". A Postgres service in CI (Docker) adds setup and slows every run.

**Decision.** `DATABASE_URL=pglite://memory` runs an in-memory Postgres (PGlite, Postgres compiled to WASM) with the same Drizzle migrations. Unit tests call the route handlers against it, and the Playwright server starts with it. PGlite is a server-external package and excluded from production file traces; production uses Neon over HTTP.

**Consequences.** The share tests run real SQL, migrations included, with no services to start. The rare dialect differences between PGlite and Neon don't affect our three simple statements (insert, select by key, delete).

## ADR-032: Rate limits live in Postgres, keyed by a salted hash

**Context.** Serverless functions share no memory, so an in-process counter can't limit shares per IP. The spec forbids storing raw IPs.

**Decision.** A `share_rate_limits` table holds `sha256(ip + SHARE_SALT)` and a timestamp per share. Each share deletes rows older than an hour, counts the caller's rows and, if under 10, records one more. The IP is the first `x-forwarded-for` entry (else `x-real-ip`), which Vercel sets and overwrites on every request.

**Consequences.** No raw IPs, and nothing older than an hour. The count-then-insert isn't atomic, so a burst of parallel requests could slip one or two over the limit, which is acceptable for abuse prevention. Behind a proxy that passes client-supplied `x-forwarded-for` through unchanged, the limit could be dodged; deployments outside Vercel should make the proxy set that header.

## ADR-033: Link-preview images use bundled fonts only

**Context.** `next/og` draws Open Graph images with Satori. For any character its fonts don't cover, it downloads a fallback font from Google Fonts or an emoji image from jsDelivr, with the text itself in the request URL. Shared names are user data, so this would send them to third parties.

**Decision.** The preview images embed six WOFF files from Fontsource (latin subsets of the theme fonts, in `assets/fonts/`). Every name is checked against the code points those fonts cover, and a name that doesn't fit is left off the image instead of being drawn. "≈" isn't in the subsets, so it is drawn as an SVG shape. `tests/unit/og.test.ts` renders every card type with `fetch` disabled and fails if anything other than Satori's own inlined WASM is requested.

**Consequences.** Names in other scripts, or with emoji, are missing from the preview image (the card page itself still shows them, using the visitor's own fonts). The server never contacts a third party while drawing an image.

## ADR-034: How the app works offline

**Context.** The spec requires the app to be installable and work offline after the first visit, with real data, not just the sample. Real data lives only in the tab's worker, so anything that reloads the page loses it. Next.js turns a failed client-side navigation into a full page load, which offline would do exactly that.

**Decision.**

- Moving from one deck to the next only changes the URL (`history.pushState`): the story page reads the deck from the path and fetches nothing.
- A service worker built with Serwist (`src/sw/sw.ts`, served from `/serwist/sw.js`) precaches this build's scripts, styles, `woff2` fonts, the DuckDB bundle and the app's pages.
- Page loads for the app's own routes are answered from the precache whatever their query (`?sample=1` only matters in the browser).
- At install, the worker also saves each route's RSC payload. When a client-side navigation request fails, the saved payload answers it instead of letting Next.js fall back to a page load.
- Worker scripts are served as fresh responses. Turbopack passes a worker its bootstrap config in the URL fragment, and a response straight from the cache would carry the cached URL, without the fragment, and the worker would fail.
- The worker is registered only after the page has loaded and the browser is idle: the precache is about 38 MB, almost all of it DuckDB's WASM, and it must never compete with the first paint.

**Alternatives.** Runtime-caching DuckDB on first use instead of precaching it (smaller first visit, but the app would not work offline until the engine had been used once online); a single client-rendered page for the whole app (no RSC requests at all, but it gives up static pages and per-page code splitting).

**Consequences.** `tests/e2e/offline.spec.ts` turns the network off after one visit, then adds a real-format Spotify export, plays it, goes back to `/start` with the data intact, and plays every sample deck. Other E2E specs block service workers so each test doesn't download the precache. The first visit downloads about 9 MB more in the background (the WASM compresses well).

## ADR-035: Landing performance, measured

**Context.** §15 asks for at most 150 KB of JavaScript (gzipped) before any interaction, LCP under 2 s on simulated 4G, and Lighthouse mobile scores of Performance ≥ 90, Accessibility 100 and Best Practices ≥ 95.

**Decision.**

- The landing page is a server component apart from the mini story preview. That preview is drawn from a committed JSON, so no engine, GSAP or player code loads.
- Links into the app don't prefetch.
- The preview draws its other cards only once the browser is idle, because each card's theme fonts would otherwise compete with the first paint.
- `tests/e2e/pages.spec.ts` asserts the JavaScript budget; `scripts/lighthouse.mjs` (`pnpm lighthouse`) measures the rest.

**What we tried and dropped.** Inlining CSS (`experimental.inlineCss`) duplicated the stylesheet into the HTML and the RSC payload (a 405 KB page) and made LCP worse. Not preloading the body font delayed FCP by 0.45 s without moving LCP.

**Consequences.** Median of three Lighthouse mobile runs:

- Performance 96, Accessibility 100, Best Practices 100, SEO 100
- FCP 1.1 s, LCP 2.8 s, TBT 12 ms, CLS 0
- 145 KB of JavaScript (gzipped)

The LCP target is not met in Lighthouse's simulation. The headline paints with the first frame (160 ms unthrottled); the simulation charges it for the ~120 KB React and Next.js runtime downloading in parallel, which every App Router page needs.

## ADR-036: The app's own look is a printed receipt, not "aurora"

**Context.** The spec (§9.4, §10.2) gives the app shell and the Life deck an `aurora` theme: deep indigo, gradients, glows and orbs, set in Space Grotesk. After the first deploy, the project owner found it generic and chose a new direction from three mockups.

**Decision.** A `receipt` theme replaces `aurora` for the shell and the Life deck.

- **Colour.** Paper `#F3EFE6`, receipt paper `#FFFDF8`, ink `#16130F` and one red, `#FF3D12`. The red was picked to clear 3:1 on paper, so it can carry display-size type as well as fills. Small red text uses `#B12C0A`.
- **Type.** Archivo Extra Condensed Black for display, IBM Plex Sans for body and IBM Plex Mono for receipt lines. Archivo is self-hosted with `next/font/local`. The file keeps Archivo's width axis, so the face pins `font-stretch: 62%`.
- **Motif.** A till receipt: dotted leaders, dashed rules, torn edges, barcodes and a stamp. Motion is stepped (`steps()`), like a printer.
- **Life cards.** They rotate three backdrops (paper, ink and red) and follow the platform decks' story grammar: one huge number or headline per card, stickers and bold colour. The platform colours from §9.4 stay; on paper they get an ink outline.
- **Changes from the §9.4 card table.** Each card still shows the same data.
  - The opener prints a receipt instead of orbiting orbs.
  - The split is an outlined stacked bar with labelled rows instead of a donut.
  - The personality card stamps the archetype and adds one line of character per archetype. That line is copy, with no numbers in it.
  - The summary is a printed receipt.
- **Old shares.** Shares stored under the old theme name are upgraded when read (`'aurora'` becomes `'receipt'`), so existing links keep working.

**Alternatives.**

- "Poster": white, huge condensed type, the decks fanned out. Rejected as too close to Spotify Wrapped's own marketing.
- "Night edition": warm black, a serif headline, one amber accent.
- Toning aurora down instead: the gradient-on-indigo look itself was the problem.

**Consequences.**

- This ADR supersedes the `aurora` entries in §9.4 and §10.2.
- The brand components avoid `cn` (tailwind-merge). The site header is part of the client error boundary, which ships with every page, and tailwind-merge would have pushed the landing past its 150 KB budget.
- The Life deck's visual baselines were regenerated.
- Link-preview images use Plex for body text in every theme.
