import { createEngine, type EngineApi } from '@/engine/api';
import type { QueryFn } from '@/engine/insights/types';
import type { Db } from '@/engine/db/types';
import { createNodeDb } from './nodeDb';

/** Fixed "now" so the sample (which ends yesterday) is identical on every run. */
export const FIXED_NOW = Date.parse('2026-06-15T12:00:00Z');
export const TEST_TZ = 'Europe/London';

export interface TestEngine {
  engine: EngineApi;
  db: Db;
  q: QueryFn;
}

export async function createTestEngine(): Promise<TestEngine> {
  const db = await createNodeDb();
  const engine = createEngine({ createDb: async () => db, now: () => FIXED_NOW });
  return { engine, db, q: (sql, params) => db.query(sql, params) };
}
