# Progress

## Milestones

- [x] **M0: Foundation** — Next.js 16 + TS strict + pnpm + Tailwind v4 + shadcn/ui, ESLint/Prettier, Vitest/Playwright, CI, docs, theme tokens + fonts, landing skeleton with disclaimer, Comlink engine worker running DuckDB-WASM (`SELECT 42`), security headers, `.env.example`, CLAUDE.md.
- [x] **M1: Ingestion and sample data** — drop zone (files, folders, zips), shape-based detection, filtered zip streaming, Zod parsers for Spotify (Extended old/new + Account data), YouTube (localised) and Netflix, minimisation, DST-safe time conversion, DuckDB tables, Netflix profile picker, progress UI with cancel, export guides, seeded sample generator (≈1.3 s in Node, ≈1.9 s in the browser).
- [x] **M2: Insight engine** — registry + constants, 41 insights across four decks (each with SQL, minimum-data rule and a11y text), share payloads for the four summaries, archetype scoring, snapshot tests for every insight against the sample, rule tests (thin data, private sessions, searches, profiles, periods), `/debug` lists every sample insight as JSON.
- [x] **M3: Story player and the Spotify deck** — player (tap zones, hold, swipe down, keyboard, visible buttons, 7 s auto-advance, pause, live region, deck chaining, settings sheet), theme application, generated art, radial clock chart, all 12 Spotify cards with GSAP timelines, 1080 × 1920 PNG export, E2E (playthrough, gestures, auto-advance, export, settings, reload), axe on every card, visual snapshots (Windows baselines; Linux baselines pending, see known issues). Screenshots reviewed against the 1-second test.
- [x] **M4: YouTube and Netflix decks** — 11 watch-theme cards (player frame, scrubber chrome, 16:9 thumbnails, round avatars, transposed 7 × 24 heatmap, typing search bar, ≈ estimate with ⓘ) and 10 binge-theme cards (letterbox opener, red glows, film grain, vignette, posters with Top-pick badge, outlined rank numerals, binge tiles, device silhouettes, credits-style summary). Both decks reviewed against the 1-second test, play end-to-end in E2E, pass axe on every card, and have visual snapshots.
- [x] **M5: Life deck, sharing and the privacy proof** — 8 aurora cards, since restyled (ADR-036) (orb opener, ≈ total with days, donut split, stacked-area rhythm, busiest-day timeline, weekday/weekend bars, archetype badge with the three deciding metrics, three-palette summary); share whitelist + `POST/GET /api/share` + `DELETE /api/share/[id]` on Drizzle (Neon in production, PGlite in tests) with a salted-hash rate limit and hashed delete tokens; exact-JSON preview before upload; `/s/[id]` server-rendered still card with sample badge, Make your own and Delete; themed OG images drawn only with bundled fonts (no third-party font or emoji fetches); privacy E2E (no foreign requests, no request bodies, worker traffic included) and a CSP block test; share-flow E2E against PGlite.
- [x] **M6: PWA, performance, polish and launch**: built and verified in CI, except two items that need the owner (see below). Serwist offline support with real data, an offline E2E test, `/privacy`, the full landing page, the §15 budgets enforced in tests, Lighthouse 96 / 100 / 100 / 100, 404 and error pages, the README with a demo GIF, `docs/DEPLOY.md`, and Linux visual baselines.

## After launch

- [x] **Rebrand (ADR-036).** At the owner's request, the app's own look moved from the spec's `aurora` to a printed-receipt brand: paper, ink and one red, Archivo Extra Condensed with IBM Plex. The landing, start, privacy, error and share pages; the eight Life cards, now built like the platform decks' story cards; the Life share image and the site's preview image; the icons; and the demo GIF. Windows visual baselines regenerated.
- [x] **Share to social apps (ADR-037).** Every card has a Share button: it renders the card's PNG on the device, previews it and hands it to the device's share sheet (Instagram, Snapchat, WhatsApp and others post it from the person's own app; nothing is uploaded, no platform logins). Without file sharing, the sheet offers Save image. Summary cards keep the opt-in link in the same sheet; a created link can go to the share sheet, and `/s/[id]` has Share this card. Unit tests for the share helpers; E2E for the image share, the fallback, link sharing and the shared page's button; the privacy E2E now shares an image too. Linux visual baselines regenerated; the Windows ones are still the old ones (see Next session).
- [x] **One brand around every story (ADR-038).** The player, its loading and error screens and its dialogs wear the receipt brand from the landing page. On a computer, the page around the story shows the logo, the list of stories and receipt-style controls. Only the story frame takes the platform's look.
- [x] **3D motion (ADR-039).**
  - Decks turn into each other like a cube, and the next deck is fetched ahead so the turn never stops on a loading screen.
  - Eleven cards across the four decks have 3D entrances in their platform's style: hinges, flips, a record tilting up, a carousel, rolling credits, a curling receipt and a slamming stamp.
  - The landing preview is a turning, swaying cube, and the /start tiles tilt in 3D.
  - It's all CSS 3D with GSAP. Reduced motion and saved images are unaffected.
- [x] **A top song or video alongside the stories (ADR-040, owner-approved exception to §3).**
  - With your own data, the Spotify story offers your five most-played songs, and the YouTube story your five most-watched videos.
  - The pick plays in Spotify's or YouTube's own player, in a "Now playing" ticket that keeps playing between decks.
  - Nothing loads from them until a pick; ids are checked twice; `frame-src` allows exactly the two players; the sample offers nothing.
  - The landing page, /privacy and PRIVACY.md say all of this, and `tests/e2e/media.spec.ts` checks it with the players stubbed.

## Next session starts here

Everything in the spec is built, and the owner has deployed it to <https://life-wrapped-jgpl.vercel.app>. The share sheet, the consistent brand, the 3D motion and the soundtrack are merged into `main` (pull request #1) and deployed, with CI green. Next:

1. **Try the soundtrack with a real export on the live site**, since tests stub the players.
2. **Regenerate the Windows visual baselines** on Windows: run `pnpm build`, then `pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots=all`. CI doesn't use them.
3. **Finish the post-deploy checklist** in `docs/DEPLOY.md` (the share database and the checks after it).
4. **Decide on the LCP target.** Lighthouse's simulated LCP is 2.8 s against 2 s (ADR-035). Getting below it would mean dropping App Router's client runtime on the landing page, for example by serving it as plain static HTML.

## Definition of done (§19)

- [x] Live on Vercel (<https://life-wrapped-jgpl.vercel.app>), with the sample story reachable in at most two clicks and through a direct `?sample=1` link.
- [x] All four decks pass the 1-second theme test, with no logos or proprietary fonts anywhere.
- [x] Real exports from all three platforms work, including old and new Spotify formats.
- [x] The privacy and offline tests pass in CI, and the CSP is active.
- [x] Unit, E2E, axe and visual tests are green in CI, with the badge in the README.
- [x] Reduced motion and keyboard-only use are fully supported.
- [x] README, DECISIONS, ARCHITECTURE and PRIVACY are written in plain English.
- [x] The disclaimer is in the footer and the README.

## Known issues

- Lighthouse's simulated mobile LCP is 2.8 s against a 2 s target. The headline paints in the first frame; the simulation charges it for the React and Next.js runtime (ADR-035).
