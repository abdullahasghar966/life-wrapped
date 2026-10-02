# Progress

## Milestones

- [x] **M0: Foundation** — Next.js 16 + TS strict + pnpm + Tailwind v4 + shadcn/ui, ESLint/Prettier, Vitest/Playwright, CI, docs, theme tokens + fonts, landing skeleton with disclaimer, Comlink engine worker running DuckDB-WASM (`SELECT 42`), security headers, `.env.example`, CLAUDE.md.
- [x] **M1: Ingestion and sample data** — drop zone (files, folders, zips), shape-based detection, filtered zip streaming, Zod parsers for Spotify (Extended old/new + Account data), YouTube (localised) and Netflix, minimisation, DST-safe time conversion, DuckDB tables, Netflix profile picker, progress UI with cancel, export guides, seeded sample generator (≈1.3 s in Node, ≈1.9 s in the browser).
- [x] **M2: Insight engine** — registry + constants, 41 insights across four decks (each with SQL, minimum-data rule and a11y text), share payloads for the four summaries, archetype scoring, snapshot tests for every insight against the sample, rule tests (thin data, private sessions, searches, profiles, periods), `/debug` lists every sample insight as JSON.
- [x] **M3: Story player and the Spotify deck** — player (tap zones, hold, swipe down, keyboard, visible buttons, 7 s auto-advance, pause, live region, deck chaining, settings sheet), theme application, generated art, radial clock chart, all 12 Spotify cards with GSAP timelines, 1080 × 1920 PNG export, E2E (playthrough, gestures, auto-advance, export, settings, reload), axe on every card, visual snapshots (Windows baselines; Linux baselines pending, see known issues). Screenshots reviewed against the 1-second test.
- [ ] **M4: YouTube and Netflix decks**
- [ ] **M5: Life deck, sharing and the privacy proof**
- [ ] **M6: PWA, performance, polish and launch**

## Next session starts here

M4: every YouTube (watch) and Netflix (binge) card, with their charts (heatmap, rank bars), art, progress chrome and transitions; add both decks to `tests/e2e/visual.spec.ts` and the axe/playthrough specs.

## Known issues

- Linux visual baselines don't exist yet, so CI skips the visual spec. After the last deck lands, run the "Visual baselines" workflow and commit the PNGs (ADR-028).
- Timing budgets in E2E are recorded, not asserted, until the serial perf spec (M6, ADR-019).
