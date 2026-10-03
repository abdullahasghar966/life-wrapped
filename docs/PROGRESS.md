# Progress

## Milestones

- [x] **M0: Foundation** — Next.js 16 + TS strict + pnpm + Tailwind v4 + shadcn/ui, ESLint/Prettier, Vitest/Playwright, CI, docs, theme tokens + fonts, landing skeleton with disclaimer, Comlink engine worker running DuckDB-WASM (`SELECT 42`), security headers, `.env.example`, CLAUDE.md.
- [x] **M1: Ingestion and sample data** — drop zone (files, folders, zips), shape-based detection, filtered zip streaming, Zod parsers for Spotify (Extended old/new + Account data), YouTube (localised) and Netflix, minimisation, DST-safe time conversion, DuckDB tables, Netflix profile picker, progress UI with cancel, export guides, seeded sample generator (≈1.3 s in Node, ≈1.9 s in the browser).
- [x] **M2: Insight engine** — registry + constants, 41 insights across four decks (each with SQL, minimum-data rule and a11y text), share payloads for the four summaries, archetype scoring, snapshot tests for every insight against the sample, rule tests (thin data, private sessions, searches, profiles, periods), `/debug` lists every sample insight as JSON.
- [x] **M3: Story player and the Spotify deck** — player (tap zones, hold, swipe down, keyboard, visible buttons, 7 s auto-advance, pause, live region, deck chaining, settings sheet), theme application, generated art, radial clock chart, all 12 Spotify cards with GSAP timelines, 1080 × 1920 PNG export, E2E (playthrough, gestures, auto-advance, export, settings, reload), axe on every card, visual snapshots (Windows baselines; Linux baselines pending, see known issues). Screenshots reviewed against the 1-second test.
- [x] **M4: YouTube and Netflix decks** — 11 watch-theme cards (player frame, scrubber chrome, 16:9 thumbnails, round avatars, transposed 7 × 24 heatmap, typing search bar, ≈ estimate with ⓘ) and 10 binge-theme cards (letterbox opener, red glows, film grain, vignette, posters with Top-pick badge, outlined rank numerals, binge tiles, device silhouettes, credits-style summary). Both decks reviewed against the 1-second test, play end-to-end in E2E, pass axe on every card, and have visual snapshots.
- [x] **M5: Life deck, sharing and the privacy proof** — 8 aurora cards (orb opener, ≈ total with days, donut split, stacked-area rhythm, busiest-day timeline, weekday/weekend bars, archetype badge with the three deciding metrics, three-palette summary); share whitelist + `POST/GET /api/share` + `DELETE /api/share/[id]` on Drizzle (Neon in production, PGlite in tests) with a salted-hash rate limit and hashed delete tokens; exact-JSON preview before upload; `/s/[id]` server-rendered still card with sample badge, Make your own and Delete; themed OG images drawn only with bundled fonts (no third-party font or emoji fetches); privacy E2E (no foreign requests, no request bodies, worker traffic included) and a CSP block test; share-flow E2E against PGlite.
- [ ] **M6: PWA, performance, polish and launch**

## Next session starts here

**M6 is nearly done.** Shipped:

- offline support (Serwist; real data survives offline navigation) and its E2E test
- `/privacy`, `/offline`, a global 404 and error pages
- the full landing page with a mini story preview from static sample JSON
- every §15 budget enforced in tests (500k rows in 7.2 s; landing → story 3.5–4 s)
- Lighthouse 96 / 100 / 100 / 100 with 145 KB of landing JS
- the README with a demo GIF, and `docs/DEPLOY.md`

Left:

1. Run the "Visual baselines" workflow on GitHub, download the `*-linux.png` artifact into `tests/e2e/visual.spec.ts-snapshots/`, commit, and check CI runs the visual spec green.
2. Deploy to Vercel (the owner's account), then fill in the live URL in the README and walk through `docs/DEPLOY.md`.

## Known issues

- Linux visual baselines don't exist yet, so CI skips the visual spec until the "Visual baselines" workflow has been run and its PNGs committed (ADR-028).
- Lighthouse's simulated mobile LCP is 2.8 s against a 2 s target. The headline paints in the first frame; the simulation charges it for the React and Next.js runtime (ADR-035).
