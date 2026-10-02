import type { Table } from 'apache-arrow';

export type Row = Record<string, unknown>;

/**
 * The small database surface the engine needs. The browser implementation wraps
 * DuckDB-WASM's async API; unit tests use the same WASM build in Node.
 */
export interface Db {
  /** Runs a statement with no parameters (DDL, internal maintenance). Never pass user data here. */
  exec(sql: string): Promise<void>;
  /** Runs a parameterised query. User data must only ever travel through `params`. */
  query<T extends object = Row>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  /** Creates `table` from an Arrow table (used for staging tables). */
  insertArrow(table: string, data: Table): Promise<void>;
  close(): Promise<void>;
}

/** Arrow → plain JS: BIGINT/HUGEINT come back as bigint; the UI only wants numbers. */
export function normaliseRow(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'bigint') out[k] = Number(v);
    else if (v && typeof v === 'object' && 'toArray' in v && typeof v.toArray === 'function') {
      out[k] = Array.from(v.toArray() as Iterable<unknown>, (x) =>
        typeof x === 'bigint' ? Number(x) : x && typeof x === 'object' ? normaliseRow(x as Row) : x,
      );
    } else if (v && typeof v === 'object' && 'toJSON' in v && typeof v.toJSON === 'function') {
      out[k] = normaliseRow(v.toJSON() as Row);
    } else out[k] = v;
  }
  return out;
}
