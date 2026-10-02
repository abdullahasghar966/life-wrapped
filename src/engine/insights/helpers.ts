import { addDays } from '../ingest/time';
import { DAYPARTS } from './constants';
import type { DataCtx, InsightDef, QueryFn } from './types';

export function define<P>(def: InsightDef<P>): InsightDef<P> {
  return def;
}

export async function one<T extends object>(
  q: QueryFn,
  sql: string,
  params: readonly unknown[] = [],
): Promise<T | undefined> {
  return (await q<T>(sql, params))[0];
}

/** Inclusive last day of the period, for display. */
export const periodLastDay = (ctx: DataCtx) => addDays(ctx.period.end, -1);

export type Daypart = keyof typeof DAYPARTS;

export function daypartOf(hour: number): Daypart {
  for (const [name, [from, to]] of Object.entries(DAYPARTS) as Array<
    [Daypart, readonly [number, number]]
  >) {
    if (hour >= from && hour < to) return name;
  }
  return 'evening';
}

/** Sums a 24-slot hourly array into the four dayparts. */
export function daypartTotals(hours: number[]): Record<Daypart, number> {
  const out: Record<Daypart, number> = { night: 0, morning: 0, afternoon: 0, evening: 0 };
  hours.forEach((v, h) => {
    out[daypartOf(h)] += v;
  });
  return out;
}

/** Fills a 24-slot array from rows of { h, v }. */
export function hourly(rows: Array<{ h: number; v: number }>): number[] {
  const out = new Array<number>(24).fill(0);
  for (const r of rows) out[r.h] = r.v;
  return out;
}

/** Index of the largest value (first one wins ties). */
export function argmax(values: number[]): number {
  let best = 0;
  values.forEach((v, i) => {
    if (v > values[best]!) best = i;
  });
  return best;
}

/** Number of Mon–Fri and Sat–Sun dates in [start, end). */
export function weekdayWeekendDays(
  start: string,
  end: string,
): { weekday: number; weekend: number } {
  let weekday = 0;
  let weekend = 0;
  for (let d = start; d < end; d = addDays(d, 1)) {
    const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (dow === 0 || dow === 6) weekend++;
    else weekday++;
  }
  return { weekday, weekend };
}

export const round1 = (n: number) => Math.round(n * 10) / 10;
export const round3 = (n: number) => Math.round(n * 1000) / 1000;
