'use client';
import * as Comlink from 'comlink';
import type { EngineApi } from './api';

let remote: Comlink.Remote<EngineApi> | null = null;

/** One engine worker per tab; its state lives as long as the tab does. */
export function getEngine(): Comlink.Remote<EngineApi> {
  if (!remote) {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module',
      name: 'life-wrapped-engine',
    });
    remote = Comlink.wrap<EngineApi>(worker);
  }
  return remote;
}
