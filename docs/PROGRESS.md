# Progress

## Milestones

- [x] **M0: Foundation** — Next.js 16 + TS strict + pnpm + Tailwind v4 + shadcn/ui, ESLint/Prettier, Vitest/Playwright, CI, docs, theme tokens + fonts, landing skeleton with disclaimer, Comlink engine worker running DuckDB-WASM (`SELECT 42`), security headers, `.env.example`, CLAUDE.md.
- [x] **M1: Ingestion and sample data** — drop zone (files, folders, zips), shape-based detection, filtered zip streaming, Zod parsers for Spotify (Extended old/new + Account data), YouTube (localised) and Netflix, minimisation, DST-safe time conversion, DuckDB tables, Netflix profile picker, progress UI with cancel, export guides, seeded sample generator (≈1.3 s in Node, ≈1.9 s in the browser).
- [ ] **M2: Insight engine**
- [ ] **M3: Story player and the Spotify deck**
- [ ] **M4: YouTube and Netflix decks**
- [ ] **M5: Life deck, sharing and the privacy proof**
- [ ] **M6: PWA, performance, polish and launch**

## Next session starts here

M2: insight registry + every insight for all four decks (minimum-data rules, a11y text), snapshot tests against the seeded sample, and the debug page listing every sample insight as JSON. The YouTube estimator already exists (`src/engine/ingest/youtubeEstimate.ts`, tested).

## Known issues

- `/story/*` doesn't exist yet, so deck tiles on `/start` link to a 404 until M3.
- Timing budgets in E2E are recorded, not asserted, until the serial perf spec (M6, ADR-019).
