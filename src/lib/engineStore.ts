'use client';
import * as Comlink from 'comlink';
import { useSyncExternalStore } from 'react';
import type { OptionsPatch } from '@/engine/api';
import { getEngine } from '@/engine/client';
import type { InsightResult } from '@/engine/insights/types';
import type { DeckId, IngestProgress, IngestSummary, TopMedia } from '@/engine/types';

export type EngineStatus =
  'idle' | 'restoring' | 'loading-sample' | 'ingesting' | 'ready' | 'error';

export interface EngineState {
  status: EngineStatus;
  /** DuckDB has booted in the worker, so the first query won't wait for it. */
  warm: boolean;
  summary: IngestSummary | null;
  progress: IngestProgress | null;
  error: string | null;
}

const INITIAL: EngineState = {
  status: 'idle',
  warm: false,
  summary: null,
  progress: null,
  error: null,
};

let state: EngineState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<EngineState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useEngineState(): EngineState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}

export function getEngineState(): EngineState {
  return state;
}

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const friendly = (e: unknown) =>
  e instanceof Error && e.message ? e.message : 'Something went wrong while reading your data.';

let restorePromise: Promise<IngestSummary | null> | null = null;

/** The UI-side handle on the engine worker. All data stays inside the worker. */
export const engine = {
  /** Picks up whatever the worker already holds (it lives as long as the tab). */
  restore(): Promise<IngestSummary | null> {
    if (state.summary) return Promise.resolve(state.summary);
    restorePromise ??= (async () => {
      set({ status: 'restoring' });
      try {
        const summary = await getEngine().summary();
        set({ status: summary ? 'ready' : 'idle', summary });
        return summary;
      } catch (e) {
        set({ status: 'error', error: friendly(e) });
        return null;
      } finally {
        restorePromise = null;
      }
    })();
    return restorePromise;
  },

  /** Starts DuckDB in the worker ahead of the first real query. Sends nothing anywhere. */
  warmUp(): void {
    if (state.warm) return;
    void getEngine()
      .ping()
      .then(
        () => set({ warm: true }),
        () => {
          /* the first real call reports any problem */
        },
      );
  },

  /** `asOf` pins the sample's "today" (YYYY-MM-DD) so it looks the same on every run. */
  async loadSample(asOf?: string): Promise<IngestSummary | null> {
    set({ status: 'loading-sample', error: null, progress: null });
    try {
      const summary = await getEngine().loadSample(undefined, { timeZone: timeZone(), asOf });
      set({ status: 'ready', summary });
      return summary;
    } catch (e) {
      set({ status: 'error', error: friendly(e) });
      return null;
    }
  },

  async ingest(files: File[]): Promise<IngestSummary | null> {
    if (files.length === 0) return state.summary;
    set({
      status: 'ingesting',
      error: null,
      progress: { stage: 'reading', filesDone: 0, filesTotal: files.length, fraction: 0 },
    });
    try {
      const summary = await getEngine().ingest(
        files,
        { timeZone: timeZone() },
        Comlink.proxy((p: IngestProgress) => set({ progress: p })),
      );
      set({ status: 'ready', summary, progress: null });
      return summary;
    } catch (e) {
      set({ status: 'error', error: friendly(e), progress: null });
      return null;
    }
  },

  async cancel(): Promise<void> {
    await getEngine().cancelIngest();
  },

  async setOptions(patch: OptionsPatch): Promise<IngestSummary | null> {
    try {
      const summary = await getEngine().setOptions(patch);
      set({ summary, status: 'ready' });
      return summary;
    } catch (e) {
      set({ error: friendly(e) });
      return null;
    }
  },

  getDeck(deck: DeckId): Promise<InsightResult[]> {
    return getEngine().getDeck(deck);
  },

  /** Top songs and videos to play alongside the stories; empty for the sample. */
  topMedia(): Promise<TopMedia> {
    return getEngine().topMedia();
  },

  async clear(): Promise<void> {
    await getEngine().clear();
    set({ ...INITIAL, warm: state.warm });
  },
};
