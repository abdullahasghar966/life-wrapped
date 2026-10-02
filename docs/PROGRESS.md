# Progress

## Milestones

- [x] **M0: Foundation** — Next.js 16 + TS strict + pnpm + Tailwind v4 + shadcn/ui, ESLint/Prettier, Vitest/Playwright, CI, docs, theme tokens + fonts, landing skeleton with disclaimer, Comlink engine worker running DuckDB-WASM (`SELECT 42`), security headers, `.env.example`, CLAUDE.md.
- [x] **M1: Ingestion and sample data** — drop zone (files, folders, zips), shape-based detection, filtered zip streaming, Zod parsers for Spotify (Extended old/new + Account data), YouTube (localised) and Netflix, minimisation, DST-safe time conversion, DuckDB tables, Netflix profile picker, progress UI with cancel, export guides, seeded sample generator (≈1.3 s in Node, ≈1.9 s in the browser).
- [x] **M2: Insight engine** — registry + constants, 41 insights across four decks (each with SQL, minimum-data rule and a11y text), share payloads for the four summaries, archetype scoring, snapshot tests for every insight against the sample, rule tests (thin data, private sessions, searches, profiles, periods), `/debug` lists every sample insight as JSON.
- [x] **M3: Story player and the Spotify deck** — player (tap zones, hold, swipe down, keyboard, visible buttons, 7 s auto-advance, pause, live region, deck chaining, settings sheet), theme application, generated art, radial clock chart, all 12 Spotify cards with GSAP timelines, 1080 × 1920 PNG export, E2E (playthrough, gestures, auto-advance, export, settings, reload), axe on every card, visual snapshots (Windows baselines; Linux baselines pending, see known issues). Screenshots reviewed against the 1-second test.
- [x] **M4: YouTube and Netflix decks** — 11 watch-theme cards (player frame, scrubber chrome, 16:9 thumbnails, round avatars, transposed 7 × 24 heatmap, typing search bar, ≈ estimate with ⓘ) and 10 binge-theme cards (letterbox opener, red glows, film grain, vignette, posters with Top-pick badge, outlined rank numerals, binge tiles, device silhouettes, credits-style summary). Both decks reviewed against the 1-second test, play end-to-end in E2E, pass axe on every card, and have visual snapshots.
- [ ] **M5: Life deck, sharing and the privacy proof**
- [ ] **M6: PWA, performance, polish and launch**

## Next session starts here

M5: the aurora (Life) deck with its charts (donut, stacked area, day timeline) and archetype reveal; the share API (Neon + Drizzle, Zod whitelist, ≤ 4 KB, rate limit, delete token), `/s/[id]` and its OG image; the final CSP; the Playwright privacy and offline tests.

## Known issues

- Linux visual baselines don't exist yet, so CI skips the visual spec. After the last deck lands, run the "Visual baselines" workflow and commit the PNGs (ADR-028).
- Timing budgets in E2E are recorded, not asserted, until the serial perf spec (M6, ADR-019).
