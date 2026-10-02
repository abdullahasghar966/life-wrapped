import { tableFromArrays } from 'apache-arrow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '@/engine/db/types';
import { createNodeDb } from '../helpers/nodeDb';

describe('DuckDB-WASM', () => {
  let db: Db;
  beforeAll(async () => {
    db = await createNodeDb();
  });
  afterAll(() => db.close());

  it('runs SELECT 42', async () => {
    expect(await db.query('SELECT 42 AS answer')).toEqual([{ answer: 42 }]);
  });

  it('binds parameters instead of concatenating them', async () => {
    const hostile = "x'); DROP TABLE t; --";
    const rows = await db.query<{ v: string }>('SELECT ? AS v', [hostile]);
    expect(rows[0]?.v).toBe(hostile);
  });

  it('stages Arrow tables and returns numbers, not bigints', async () => {
    await db.insertArrow('stage', tableFromArrays({ n: new Int32Array([1, 2, 3]) }));
    const rows = await db.query('SELECT SUM(n) AS s, COUNT(*) AS c FROM stage');
    expect(rows).toEqual([{ s: 6, c: 3 }]);
  });
});
