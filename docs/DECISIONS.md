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

**Decision.** Evoke platforms only through colour, free Google Fonts (Figtree, Roboto Condensed, Bebas Neue), layout patterns and motion. No logos, icons, wordmarks, screenshots, proprietary fonts or sounds. Platform names are used only descriptively ("Your Spotify story"). Every page footer and the README carry the non-affiliation disclaimer. Internally the themes are named `sound`, `watch`, `binge` and `aurora`, not after the brands.

**Consequences.** The "1-second test" relies on colour, type and layout patterns. Netflix red is used only for large text and shapes because its contrast on black is under 4.5:1.

## ADR-007: CSP without nonces (static pages + 'unsafe-inline' scripts)

**Context.** Next.js App Router pages include small inline bootstrap scripts. A strict nonce-based CSP requires every page to be rendered dynamically per request.

**Decision.** Keep pages static and use `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`. Everything else is locked down: `connect-src 'self'`, `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.

**Alternatives.** Nonces via `proxy.ts` (strongest XSS protection, but every page becomes dynamic: slower TTFB, no static CDN caching, and the offline service worker would cache pages with stale nonces); hashes (Next's inline scripts change per build and per page).

**Consequences.** The privacy promise is about exfiltration, and `connect-src 'self'` blocks it whether or not an injected script runs: a script can't `fetch`, `XHR`, `WebSocket` or `sendBeacon` anywhere but our own origin, and `img-src`/`font-src` are limited to self/data/blob. The app renders no user-supplied HTML (React escapes all text), so the residual XSS risk is low. Static pages keep the landing page fast and the app fully offline-capable.

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
