# Progress

## Milestones

- [x] **M0: Foundation** — Next.js 16 + TS strict + pnpm + Tailwind v4 + shadcn/ui, ESLint/Prettier, Vitest/Playwright, CI, docs, theme tokens + fonts, landing skeleton with disclaimer, Comlink engine worker running DuckDB-WASM (`SELECT 42`), security headers, `.env.example`, CLAUDE.md.
- [x] **M1: Ingestion and sample data** — drop zone (files, folders, zips), shape-based detection, filtered zip streaming, Zod parsers for Spotify (Extended old/new + Account data), YouTube (localised) and Netflix, minimisation, DST-safe time conversion, DuckDB tables, Netflix profile picker, progress UI with cancel, export guides, seeded sample generator (≈1.3 s in Node, ≈1.9 s in the browser).
- [x] **M2: Insight engine** — registry + constants, 41 insights across four decks (each with SQL, minimum-data rule and a11y text), share payloads for the four summaries, archetype scoring, snapshot tests for every insight against the sample, rule tests (thin data, private sessions, searches, profiles, periods), `/debug` lists every sample insight as JSON.
- [ ] **M3: Story player and the Spotify deck**
- [ ] **M4: YouTube and Netflix decks**
- [ ] **M5: Life deck, sharing and the privacy proof**
- [ ] **M6: PWA, performance, polish and launch**

## Next session starts here

M3: the story player (gestures, keyboard, auto-advance, pause, a11y, reduced motion, deck chaining), theme application, generated art, the SVG charts the Spotify deck needs, every Spotify card, PNG export. Card props are the `InsightResult.props` types exported next to each insight.

## Known issues

- `/story/*` doesn't exist yet, so deck tiles on `/start` link to a 404 until M3.
- Timing budgets in E2E are recorded, not asserted, until the serial perf spec (M6, ADR-019).
