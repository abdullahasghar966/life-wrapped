import { Bool, makeBuilder, makeVector, Table, Utf8, type Vector } from 'apache-arrow';

export type Column = Float64Array | Int32Array | string[] | boolean[];

/**
 * Builds an Arrow table without `tableFromArrays`. Arrow's default builders
 * compile their null check with `new Function`, which our CSP forbids (no
 * 'unsafe-eval'). Columns here never contain nulls (they travel as '' and
 * become NULL in SQL), so builders get `nullValues: []` and skip the codegen.
 */
export function tableOf(columns: Record<string, Column>): Table {
  const vectors: Record<string, Vector> = {};
  for (const [name, col] of Object.entries(columns)) {
    if (col instanceof Float64Array || col instanceof Int32Array) {
      vectors[name] = makeVector(col);
      continue;
    }
    if (typeof col[0] === 'boolean') {
      const builder = makeBuilder({ type: new Bool(), nullValues: [] });
      for (const v of col as boolean[]) builder.append(v);
      vectors[name] = builder.finish().toVector();
    } else {
      const builder = makeBuilder({ type: new Utf8(), nullValues: [] });
      for (const v of col as string[]) builder.append(v);
      vectors[name] = builder.finish().toVector();
    }
  }
  return new Table(vectors);
}
