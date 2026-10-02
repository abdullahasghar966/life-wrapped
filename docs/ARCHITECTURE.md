# Architecture

_Filled in as milestones land; see MASTER_PROMPT §5 for the target._

- `src/engine/api.ts` — the engine, environment-agnostic (`createEngine({ createDb })`).
- `src/engine/worker.ts` — exposes the engine with Comlink inside a Web Worker.
- `src/engine/db/duckdb.ts` — DuckDB-WASM (self-hosted EH bundle) behind a tiny `Db` interface.
- `src/story/themes/` — typed theme tokens applied as CSS variables.
