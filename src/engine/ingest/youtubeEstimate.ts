import { YT_DEFAULT_WATCH_MIN, YT_MAX_GAP_MIN, YT_SESSION_GAP_MIN } from '../insights/constants';

const MIN = 60_000;

export interface WatchEstimate {
  /** Estimated seconds spent on each watch. */
  estSeconds: number[];
  /** Session ("rabbit hole") id for each watch; consecutive watches with gaps ≤ 20 min share one. */
  sessionIds: number[];
}

/**
 * YouTube exports record when a video was opened, not how long it played (§8.3):
 * - est = gap to the next watch when that gap is ≤ 30 min, else 8 min (also for the last watch);
 * - a session is a run of watches whose gaps are all ≤ 20 min.
 *
 * `sortedTs` must be ascending epoch ms.
 */
export function estimateWatches(sortedTs: readonly number[]): WatchEstimate {
  const n = sortedTs.length;
  const estSeconds = new Array<number>(n);
  const sessionIds = new Array<number>(n);
  let session = 0;
  for (let i = 0; i < n; i++) {
    const next = sortedTs[i + 1];
    const gapMin = next === undefined ? Infinity : (next - sortedTs[i]!) / MIN;
    estSeconds[i] = Math.round((gapMin <= YT_MAX_GAP_MIN ? gapMin : YT_DEFAULT_WATCH_MIN) * 60);
    if (i > 0) {
      const prevGapMin = (sortedTs[i]! - sortedTs[i - 1]!) / MIN;
      if (prevGapMin > YT_SESSION_GAP_MIN) session++;
    }
    sessionIds[i] = session;
  }
  return { estSeconds, sessionIds };
}
