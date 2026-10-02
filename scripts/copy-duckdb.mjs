// Copies the single-threaded DuckDB-WASM "EH" bundle into /public/duckdb so it is
// served from our own origin (no CDN at runtime, see MASTER_PROMPT §3).
import { copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm'));
const out = join(process.cwd(), 'public', 'duckdb');
mkdirSync(out, { recursive: true });

for (const file of ['duckdb-eh.wasm', 'duckdb-browser-eh.worker.js']) {
  const src = join(dist, file);
  const dest = join(out, file);
  if (existsSync(dest) && statSync(dest).size === statSync(src).size) continue;
  copyFileSync(src, dest);
  console.log(`[copy-duckdb] ${file}`);
}
