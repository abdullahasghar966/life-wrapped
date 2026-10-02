/** mulberry32: a tiny, fast, seedable PRNG. Same seed → same sequence, everywhere. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private readonly next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed);
  }

  float(): number {
    return this.next();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)]!;
  }

  /** Picks an index with probability proportional to `weights` (via a prefix-sum table). */
  weightedIndex(cumulative: Float64Array): number {
    const total = cumulative[cumulative.length - 1]!;
    const x = this.next() * total;
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid]! > x) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  id(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let s = '';
    for (let i = 0; i < length; i++) s += chars[Math.floor(this.next() * 64)];
    return s;
  }
}

export function cumulative(weights: readonly number[]): Float64Array {
  const out = new Float64Array(weights.length);
  let sum = 0;
  weights.forEach((w, i) => {
    sum += w;
    out[i] = sum;
  });
  return out;
}

/** Zipf-like weights: rank 1 is most popular. */
export function zipf(n: number, s: number): number[] {
  return Array.from({ length: n }, (_, i) => 1 / (i + 1) ** s);
}
