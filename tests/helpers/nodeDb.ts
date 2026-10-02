import * as duckdb from '@duckdb/duckdb-wasm/blocking';
import { tableToIPC, type Table } from 'apache-arrow';
import { createRequire } from 'node:module';
import path from 'node:path';
import { normaliseRow, type Db, type Row } from '@/engine/db/types';

const require = createRequire(import.meta.url);

/** The same DuckDB-WASM build the browser uses, through its synchronous Node bindings. */
export async function createNodeDb(): Promise<Db> {
  const dist = path.dirname(require.resolve('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm'));
  const db = await duckdb.createDuckDB(
    {
      mvp: { mainModule: path.join(dist, 'duckdb-mvp.wasm'), mainWorker: '' },
      eh: { mainModule: path.join(dist, 'duckdb-eh.wasm'), mainWorker: '' },
    },
    new duckdb.VoidLogger(),
    duckdb.NODE_RUNTIME,
  );
  await db.instantiate();
  db.open({ query: { castBigIntToDouble: true, castDecimalToDouble: true } });
  const conn = db.connect();
  return {
    async exec(sql) {
      conn.query(sql);
    },
    async query<T extends Row = Row>(sql: string, params: readonly unknown[] = []) {
      if (params.length === 0)
        return conn
          .query(sql)
          .toArray()
          .map((r) => normaliseRow(r.toJSON()) as T);
      const stmt = conn.prepare(sql);
      try {
        return stmt
          .query(...params)
          .toArray()
          .map((r) => normaliseRow(r.toJSON()) as T);
      } finally {
        stmt.close();
      }
    },
    async insertArrow(table: string, data: Table) {
      conn.insertArrowFromIPCStream(tableToIPC(data, 'stream'), { name: table, create: true });
    },
    async close() {
      conn.close();
      db.reset();
    },
  };
}
