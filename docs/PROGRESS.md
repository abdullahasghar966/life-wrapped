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

**M5 is partly done.** Committed and passing typecheck, lint and unit tests:

- the Life deck (8 aurora cards)
- the share whitelist, `POST/GET /api/share`, `DELETE /api/share/[id]`, the rate limit, and the Drizzle schema and migration
- the share dialog with the exact-JSON preview
- `/s/[id]`: the still card rendered on the server, with a sample badge, "Make your own" and a Delete button when this browser holds the token
- OG images for `/` and `/s/[id]`

The OG images only use the embedded fonts. Names outside their latin set are left out, because next/og would otherwise fetch fallback fonts or emoji from Google or jsDelivr with the text in the URL. `tests/unit/og.test.ts` proves no fetch happens.

Still to do for M5:

1. Run the new E2E specs `tests/e2e/share.spec.ts` and `tests/e2e/privacy.spec.ts` with `pnpm build && pnpm e2e`, fix what fails, then commit them. They are written but **not yet run or committed**.
   - The Playwright server now uses `DATABASE_URL=pglite://memory`.
   - The privacy test asserts it saw DuckDB's WASM request. If nested-worker requests aren't reported, record the traffic through CDP instead.
2. Add the Life deck to `story.spec.ts` (8 cards; it's the last deck, so Next is disabled) and to `visual.spec.ts` (`life: 8`). Refresh the Windows baselines.
3. Re-screenshot the Life deck after the last layout fixes (LifeTotal, Donut labels, LifePersonality, LifeSummary).
4. Docs:
   - PRIVACY.md: the sharing section and "Verify it yourself".
   - ADRs: Postgres for sharing only; PGlite for tests; the rate-limit table keyed by sha256(ip + salt), trusting the platform's `x-forwarded-for`; OG images with embedded fonts only; the final CSP.
   - ARCHITECTURE: sharing.
   - Then tick M5.

**Then M6:**

- Serwist offline support and the offline E2E test
- the `/privacy` page
- the full landing page
- Lighthouse and the performance budgets
- a copy pass, including an ending for the last deck
- the README
- the deploy checklist
- the Linux visual baselines (run the "Visual baselines" workflow)

## Known issues

- Linux visual baselines don't exist yet, so CI skips the visual spec. After the last deck lands, run the "Visual baselines" workflow and commit the PNGs (ADR-028).
- Timing budgets in E2E are recorded, not asserted, until the serial perf spec (M6, ADR-019).
