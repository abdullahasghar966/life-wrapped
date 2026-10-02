@AGENTS.md

# Life, Wrapped: working conventions

The full product spec is [MASTER_PROMPT.md](MASTER_PROMPT.md). It wins over anything here.
Progress lives in [docs/PROGRESS.md](docs/PROGRESS.md); read it first, update it last.

## Hard rules (summary of MASTER_PROMPT §3)

- Raw files and parsed rows never leave the browser. No analytics, telemetry, third-party scripts or runtime CDN loads.
- Nothing is persisted by default; "Clear my data" wipes the worker state.
- Sensitive fields are dropped at parse time (`src/engine/ingest/minimise.ts`, listed in docs/PRIVACY.md).
- Never invent data. Estimates are labelled with "≈" and an ⓘ. Cards without enough data are hidden, never shown empty.
- Themes are "inspired by" the platforms: no logos, screenshots, proprietary fonts or brand sounds.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript strict with `noUncheckedIndexedAccess` · pnpm · Tailwind v4 + CSS variables ·
shadcn/ui for non-story UI · GSAP + `@gsap/react` · DuckDB-WASM (self-hosted EH bundle) in a Comlink worker ·
Zod · hand-written SVG charts · Drizzle + Neon (sharing only) · Serwist (`@serwist/turbopack`) · Vitest + Playwright.

Next.js 16 differs from older versions: read `node_modules/next/dist/docs/` before using an unfamiliar API.

## Layout

- `src/engine/` worker-only code, no React. `api.ts` is the engine (environment-agnostic, takes a `createDb`), `worker.ts` exposes it with Comlink, `client.ts` is the UI-side handle.
- `src/engine/insights/` one file per insight (SQL next to it). Every threshold lives in `insights/constants.ts`.
- `src/story/` player, themes (`themes/*.ts` token objects), cards per theme, generated art, SVG charts.
- `tests/unit` Vitest (runs DuckDB-WASM in Node via `tests/helpers/nodeDb.ts`), `tests/e2e` Playwright against `pnpm build && pnpm start`.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), small and meaningful.
- Before committing: `pnpm typecheck && pnpm lint && pnpm test` (and `pnpm e2e` for UI work). Never commit failing tests.
- SQL is always parameterised (`db.query(sql, params)`); user data is never concatenated into SQL.
- Cards read colours only through theme CSS variables (`--t-*`, `--c-*`), never hard-coded hex.
- Animate only `transform` and `opacity`; honour `prefers-reduced-motion`.
- Comments only where the "why" isn't obvious.
- When the spec is ambiguous, decide sensibly and add a short ADR to docs/DECISIONS.md.
- Shell note (Windows): write files with the editor tools, not bash heredocs containing apostrophes.
