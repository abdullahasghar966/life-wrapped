import { Bool, makeData, makeVector, Table, Utf8, type Vector } from 'apache-arrow';

export type Column = Float64Array | Int32Array | string[] | boolean[];

const encoder = new TextEncoder();

/**
 * A UTF-8 column written straight into Arrow's buffers (offsets + bytes).
 * Appending through a builder costs a call per value; with hundreds of
 * thousands of rows and a dozen string columns that dominated ingestion.
 */
function utf8Vector(values: readonly string[]): Vector {
  const n = values.length;
  const offsets = new Int32Array(n + 1);
  let bytes = new Uint8Array(Math.max(64, n * 16));
  let pos = 0;
  for (let i = 0; i < n; i++) {
    const s = values[i]!;
    // Worst case is 3 bytes per UTF-16 code unit.
    if (pos + s.length * 3 > bytes.length) {
      const grown = new Uint8Array(Math.max(bytes.length * 2, pos + s.length * 3));
      grown.set(bytes.subarray(0, pos));
      bytes = grown;
    }
    let ascii = true;
    for (let j = 0; j < s.length; j++) {
      const c = s.charCodeAt(j);
      if (c >= 0x80) {
        ascii = false;
        break;
      }
      bytes[pos + j] = c;
    }
    pos += ascii ? s.length : encoder.encodeInto(s, bytes.subarray(pos)).written;
    offsets[i + 1] = pos;
  }
  return makeVector(
    makeData({
      type: new Utf8(),
      length: n,
      nullCount: 0,
      valueOffsets: offsets,
      data: bytes.subarray(0, pos),
    }),
  );
}

function boolVector(values: readonly boolean[]): Vector {
  const n = values.length;
  const bits = new Uint8Array((n + 7) >> 3);
  for (let i = 0; i < n; i++) if (values[i]) bits[i >> 3]! |= 1 << (i & 7);
  return makeVector(makeData({ type: new Bool(), length: n, nullCount: 0, data: bits }));
}

/**
 * Builds an Arrow table without `tableFromArrays`. Arrow's default builders
 * compile their null check with `new Function`, which our CSP forbids (no
 * 'unsafe-eval'). Columns here never contain nulls (they travel as '' and
 * become NULL in SQL), so buffers are written directly with no null bitmap.
 */
export function tableOf(columns: Record<string, Column>): Table {
  const vectors: Record<string, Vector> = {};
  for (const [name, col] of Object.entries(columns)) {
    if (col instanceof Float64Array || col instanceof Int32Array) {
      vectors[name] = makeVector(col);
    } else if (typeof col[0] === 'boolean') {
      vectors[name] = boolVector(col as boolean[]);
    } else {
      vectors[name] = utf8Vector(col as string[]);
    }
  }
  return new Table(vectors);
}
