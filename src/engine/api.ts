import type { Db } from './db/types';

export interface EngineDeps {
  createDb: () => Promise<Db>;
}

export interface EngineApi {
  /** Health check used by tests: runs `SELECT 42` in DuckDB. */
  ping(): Promise<number>;
}

export function createEngine(deps: EngineDeps): EngineApi {
  let dbPromise: Promise<Db> | null = null;
  const getDb = () => (dbPromise ??= deps.createDb());

  return {
    async ping() {
      const db = await getDb();
      const rows = await db.query<{ answer: number }>('SELECT 42 AS answer');
      return rows[0]?.answer ?? -1;
    },
  };
}
