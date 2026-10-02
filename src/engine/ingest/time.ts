const HOUR = 3_600_000;

export interface LocalParts {
  /** Local wall-clock time encoded as if it were UTC epoch ms (what DuckDB stores as local_ts). */
  localMs: number;
  /** YYYY-MM-DD in local time. */
  date: string;
  hour: number;
  /** 0 = Sunday … 6 = Saturday (same as DuckDB's dayofweek). */
  dow: number;
}

export function defaultTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts UTC instants to local wall-clock parts for one time zone.
 *
 * Calling Intl for every row is slow (hundreds of thousands of rows), so the UTC
 * offset is cached per UTC hour. Offsets only change on DST transitions, which
 * happen on hour boundaries in UTC for practically every zone, so this is DST-safe
 * and costs a few thousand Intl calls per year of data.
 */
export class TimeConverter {
  private readonly fmt: Intl.DateTimeFormat;
  private readonly cache = new Map<number, number>();

  constructor(readonly timeZone: string) {
    this.fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /** Offset in ms to add to a UTC instant to get local wall-clock time. */
  offsetAt(utcMs: number): number {
    const key = Math.floor(utcMs / HOUR);
    let off = this.cache.get(key);
    if (off === undefined) {
      off = this.computeOffset(key * HOUR);
      this.cache.set(key, off);
    }
    return off;
  }

  private computeOffset(utcMs: number): number {
    const p: Record<string, number> = {};
    for (const part of this.fmt.formatToParts(new Date(utcMs))) {
      if (part.type !== 'literal') p[part.type] = Number(part.value);
    }
    const asUtc = Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!);
    return asUtc - utcMs;
  }

  toLocal(utcMs: number): LocalParts {
    const localMs = utcMs + this.offsetAt(utcMs);
    const d = new Date(localMs);
    return {
      localMs,
      date: d.toISOString().slice(0, 10),
      hour: d.getUTCHours(),
      dow: d.getUTCDay(),
    };
  }

  /** Inverse: local wall-clock (encoded as UTC ms) → UTC instant. Used by the sample generator. */
  fromLocal(localMs: number): number {
    const guess = localMs - this.offsetAt(localMs);
    return localMs - this.offsetAt(guess);
  }
}

/** Parses "YYYY-MM-DD HH:mm[:ss]" or ISO strings as UTC. Returns NaN when invalid. */
export function parseUtc(value: string | null | undefined): number {
  if (!value) return NaN;
  const s = value.trim();
  const m =
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(
      s,
    );
  if (!m) return NaN;
  const [, y, mo, d, h, mi, sec, frac, zone] = m;
  let ms = Date.UTC(
    +y!,
    +mo! - 1,
    +d!,
    +h!,
    +mi!,
    sec ? +sec : 0,
    frac ? +frac.slice(0, 3).padEnd(3, '0') : 0,
  );
  if (zone && zone !== 'Z') {
    const sign = zone.startsWith('-') ? -1 : 1;
    const digits = zone.replace(/[^\d]/g, '');
    ms -= sign * (+digits.slice(0, 2) * 60 + +digits.slice(2, 4)) * 60_000;
  }
  return ms;
}

/** "HH:MM:SS" → seconds. */
export function parseDuration(value: string | null | undefined): number {
  if (!value) return NaN;
  const m = /^(\d+):(\d{1,2}):(\d{1,2})$/.exec(value.trim());
  if (!m) return NaN;
  return +m[1]! * 3600 + +m[2]! * 60 + +m[3]!;
}

/** Adds whole days to a YYYY-MM-DD date string. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Adds calendar months to a YYYY-MM-DD date string (clamped to month end). */
export function addMonths(date: string, months: number): string {
  const [y, m, day] = date.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}
