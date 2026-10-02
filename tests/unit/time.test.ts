import { describe, expect, it } from 'vitest';
import { addDays, addMonths, parseDuration, parseUtc, TimeConverter } from '@/engine/ingest/time';

describe('TimeConverter', () => {
  it('converts to local wall-clock parts', () => {
    const tc = new TimeConverter('Asia/Karachi'); // UTC+5, no DST
    const p = tc.toLocal(Date.parse('2025-03-14T23:41:07Z'));
    expect(p).toMatchObject({ date: '2025-03-15', hour: 4, dow: 6 });
  });

  it('handles the spring-forward DST gap (Europe/London, 30 Mar 2025)', () => {
    const tc = new TimeConverter('Europe/London');
    // 00:59 UTC is 00:59 GMT; 01:00 UTC is 02:00 BST.
    expect(tc.toLocal(Date.parse('2025-03-30T00:59:00Z')).hour).toBe(0);
    expect(tc.toLocal(Date.parse('2025-03-30T01:00:00Z')).hour).toBe(2);
    expect(tc.offsetAt(Date.parse('2025-03-30T00:30:00Z'))).toBe(0);
    expect(tc.offsetAt(Date.parse('2025-03-30T01:30:00Z'))).toBe(3600_000);
  });

  it('handles the fall-back DST repeat (America/New_York, 2 Nov 2025)', () => {
    const tc = new TimeConverter('America/New_York');
    // 05:30 UTC = 01:30 EDT, 06:30 UTC = 01:30 EST: the same local hour twice.
    expect(tc.toLocal(Date.parse('2025-11-02T05:30:00Z')).hour).toBe(1);
    expect(tc.toLocal(Date.parse('2025-11-02T06:30:00Z')).hour).toBe(1);
    expect(tc.offsetAt(Date.parse('2025-11-02T05:30:00Z'))).toBe(-4 * 3600_000);
    expect(tc.offsetAt(Date.parse('2025-11-02T06:30:00Z'))).toBe(-5 * 3600_000);
  });

  it('handles half-hour zones and day boundaries', () => {
    const tc = new TimeConverter('Asia/Kolkata');
    expect(tc.toLocal(Date.parse('2025-01-01T18:29:00Z'))).toMatchObject({
      date: '2025-01-01',
      hour: 23,
    });
    expect(tc.toLocal(Date.parse('2025-01-01T18:30:00Z'))).toMatchObject({
      date: '2025-01-02',
      hour: 0,
    });
  });

  it('round-trips through fromLocal outside DST gaps', () => {
    const tc = new TimeConverter('Europe/Berlin');
    for (const iso of ['2025-01-10T12:00:00Z', '2025-07-10T23:30:00Z', '2025-10-26T03:00:00Z']) {
      const utc = Date.parse(iso);
      expect(tc.fromLocal(tc.toLocal(utc).localMs)).toBe(utc);
    }
  });

  it('caches offsets per UTC hour', () => {
    const tc = new TimeConverter('Europe/London');
    const base = Date.parse('2025-06-01T00:00:00Z');
    for (let i = 0; i < 10_000; i++) tc.toLocal(base + i * 60_000);
    // 10,000 minutes ≈ 167 hours → at most 168 cached offsets.
    expect((tc as unknown as { cache: Map<number, number> }).cache.size).toBeLessThanOrEqual(168);
  });
});

describe('parsers for export timestamps', () => {
  it.each([
    ['2025-03-14 23:41', Date.UTC(2025, 2, 14, 23, 41)],
    ['2025-03-14 23:41:07', Date.UTC(2025, 2, 14, 23, 41, 7)],
    ['2025-03-14T23:41:07Z', Date.UTC(2025, 2, 14, 23, 41, 7)],
    ['2025-03-14T23:41:07.123Z', Date.UTC(2025, 2, 14, 23, 41, 7, 123)],
    ['2025-03-14T23:41:07+05:00', Date.UTC(2025, 2, 14, 18, 41, 7)],
  ])('parseUtc(%s)', (s, ms) => {
    expect(parseUtc(s)).toBe(ms);
  });

  it('rejects garbage', () => {
    expect(parseUtc('yesterday')).toBeNaN();
    expect(parseUtc(null)).toBeNaN();
    expect(parseDuration('1:2')).toBeNaN();
  });

  it('parses durations', () => {
    expect(parseDuration('01:02:03')).toBe(3723);
    expect(parseDuration('00:00:41')).toBe(41);
  });

  it('does date arithmetic', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-01-01', -1)).toBe('2024-12-31');
    expect(addMonths('2025-03-31', -1)).toBe('2025-02-28');
    expect(addMonths('2026-06-15', -12)).toBe('2025-06-15');
  });
});
