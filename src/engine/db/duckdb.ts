import * as duckdb from '@duckdb/duckdb-wasm';
import { tableToIPC, type Table } from 'apache-arrow';
import { normaliseRow, type Db, type Row } from './types';

/**
 * Self-hosted single-threaded "EH" bundle (copied by scripts/copy-duckdb.mjs).
 * It needs no COOP/COEP headers, and nothing is fetched from a CDN.
 */
const BUNDLE = {
  mainModule: '/duckdb/duckdb-eh.wasm',
  mainWorker: '/duckdb/duckdb-browser-eh.worker.js',
};

export async function createBrowserDb(): Promise<Db> {
  const origin = self.location.origin;
  const worker = new Worker(new URL(BUNDLE.mainWorker, origin));
  const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  await db.instantiate(new URL(BUNDLE.mainModule, origin).toString());
  await db.open({ query: { castBigIntToDouble: true, castDecimalToDouble: true } });
  const conn = await db.connect();
  return {
    async exec(sql) {
      await conn.query(sql);
    },
    async query<T extends Row = Row>(sql: string, params: readonly unknown[] = []) {
      if (params.length === 0) {
        const res = await conn.query(sql);
        return res.toArray().map((r) => normaliseRow(r.toJSON()) as T);
      }
      const stmt = await conn.prepare(sql);
      try {
        const res = await stmt.query(...params);
        return res.toArray().map((r) => normaliseRow(r.toJSON()) as T);
      } finally {
        await stmt.close();
      }
    },
    async insertArrow(table: string, data: Table) {
      // IPC bytes rather than the Table object, so Arrow versions never need to match.
      await conn.insertArrowFromIPCStream(tableToIPC(data, 'stream'), {
        name: table,
        create: true,
      });
    },
    async close() {
      await conn.close();
      await db.terminate();
      worker.terminate();
    },
  };
}
