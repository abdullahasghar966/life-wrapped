# Architecture

Everything that touches personal data runs in one Web Worker in the user's tab. The page only ever receives small, pre-computed card objects.

```mermaid
flowchart LR
  subgraph Browser tab
    UI[Pages and story player] -- "File objects (Comlink)" --> W
    subgraph W[Engine worker]
      D[detect] --> Z[unzip, filtered] --> P[parse + minimise, Zod] --> T[local time]
      T --> DB[(DuckDB-WASM)]
      DB --> R[insight registry: parameterised SQL]
    end
    R -- "InsightResult[]" --> UI
  end
  UI -. "opt-in share: ≤ 4 KB whitelisted summary" .-> API[/api/share/] --> PG[(Postgres)]
```

## Data flow

1. **Input.** Files, folders (`webkitGetAsEntry`) or zips go to the worker as `File` handles (`src/lib/files.ts`).
2. **Unzip.** `src/engine/ingest/unzip.ts` streams the zip with fflate and inflates only entries that look like exports (`isInterestingZipEntry`).
3. **Detect.** `detect.ts` identifies each file by the shape of its rows (keys present), then by name. Localised names still work.
4. **Parse.** One Zod-validated parser per format (`spotify.ts`, `youtube.ts`, `netflix.ts`). Sensitive fields are deleted first (`minimise.ts`) and Zod strips anything unknown. Rows are de-duplicated by natural key; identical files by SHA-256.
5. **Time.** `time.ts` converts UTC to the user's time zone with an offset cached per UTC hour.
6. **Load.** `db/load.ts` builds Arrow columns and inserts them through staging tables. The YouTube estimator (`youtubeEstimate.ts`) adds `est_seconds` and `session_id` at this point.
7. **Insights.** `getDeck(deck)` runs every insight of that deck against DuckDB and returns `InsightResult[]`.

The parsed, minimised UTC rows stay in worker memory, so changing the time zone rebuilds the tables without re-reading files.

## Worker API

`src/engine/api.ts` exports `createEngine({ createDb, now })`. It doesn't know whether it runs in a worker or in Node:

| Method                                                                                      | What it does                                                           |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ingest(files, { timeZone }, onProgress)`                                                   | Adds files to the dataset, rebuilds tables, returns an `IngestSummary` |
| `cancelIngest()`                                                                            | Stops between files or zip chunks                                      |
| `loadSample(seed?, { timeZone })`                                                           | Generates Alex's exports in raw formats and ingests them normally      |
| `setOptions({ timeZone, period, includePrivateSessions, includeSearches, netflixProfile })` | Changes filters; only a time-zone change reloads tables                |
| `summary()` / `availableDecks()`                                                            | What was found and which decks have enough data                        |
| `getDeck(deck)`                                                                             | The deck's cards (cached until options change)                         |
| `clear()`                                                                                   | Drops everything                                                       |

`worker.ts` wraps it with Comlink; `src/lib/engineStore.ts` is the UI-side store (`useSyncExternalStore`). Tests call the same engine with DuckDB's Node build (`tests/helpers/engine.ts`).

## Insight registry

Each insight is one file under `src/engine/insights/<deck>/` exporting an `InsightDef`:

```ts
{ id, deck, order, title,
  requires(q, ctx) → boolean,   // minimum-data rule; false hides the card
  run(q, ctx) → props | null,   // parameterised SQL only
  a11yText(props) → string,     // one sentence for screen readers
  share?(props) → SharePayload } // summary cards only
```

- `DataCtx` carries the period, time zone, selected Netflix profile, the private-session and search switches, the first data date per platform and which platform decks are available.
- Shared SQL fragments (`filters.ts`) apply the period, profile and private-session rules in one place. Values always travel as parameters.
- Every threshold lives in `constants.ts` with a comment saying why.
- `registry.ts` runs a deck in order, skipping cards whose `requires` fails, and attaches a stable `seed` (hash of the props) that card components use to pick copy variants.
- Results leave SQL as `DOUBLE`/`VARCHAR` only, so they're plain JSON.

Tests: `tests/unit/insights.sample.test.ts` snapshots every insight against the seeded sample; `insights.rules.test.ts` checks the minimum-data, privacy and period rules on small hand-built datasets.

## Theme system

_Documented with the story player (M3)._
