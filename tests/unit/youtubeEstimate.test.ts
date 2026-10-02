import { describe, expect, it } from 'vitest';
import { estimateWatches } from '@/engine/ingest/youtubeEstimate';

const MIN = 60_000;
const at = (...minutes: number[]) => minutes.map((m) => m * MIN);

describe('YouTube watch-time estimator (§8.3)', () => {
  it('returns nothing for no watches', () => {
    expect(estimateWatches([])).toEqual({ estSeconds: [], sessionIds: [] });
  });

  it('uses 8 minutes for a single watch', () => {
    expect(estimateWatches(at(0))).toEqual({ estSeconds: [480], sessionIds: [0] });
  });

  it('uses the gap when it is at most 30 minutes, else 8 minutes', () => {
    const { estSeconds } = estimateWatches(at(0, 10, 40, 71, 200));
    // gaps: 10, 30 (= limit), 31 (> limit), 129, last
    expect(estSeconds).toEqual([600, 1800, 480, 480, 480]);
  });

  it('starts a new session after a gap over 20 minutes', () => {
    const { sessionIds } = estimateWatches(at(0, 5, 25, 46, 50, 120));
    // gaps: 5, 20 (same session), 21 (new), 4, 70 (new)
    expect(sessionIds).toEqual([0, 0, 0, 1, 1, 2]);
  });

  it('treats identical timestamps as zero-length watches in one session', () => {
    expect(estimateWatches(at(0, 0, 3))).toEqual({
      estSeconds: [0, 180, 480],
      sessionIds: [0, 0, 0],
    });
  });

  it('a 41-video rabbit hole with 6-minute gaps is one 4-hour session', () => {
    const ts = Array.from({ length: 41 }, (_, i) => i * 6 * MIN);
    const { estSeconds, sessionIds } = estimateWatches(ts);
    expect(new Set(sessionIds).size).toBe(1);
    const length = (ts[40]! - ts[0]!) / 1000 + estSeconds[40]!;
    expect(length / 3600).toBeCloseTo(4 + 8 / 60, 5);
  });
});
