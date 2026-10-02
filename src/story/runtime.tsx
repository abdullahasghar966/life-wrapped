'use client';
import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ThemeTokens } from './themes';

type Anim = gsap.core.Animation;

/**
 * Owns every animation on one card, so the player can pause them while the user
 * holds, and jump them to their final frame before a PNG export.
 */
export class CardController {
  private readonly anims = new Set<Anim>();
  private readonly loops = new Set<Anim>();
  private paused = false;

  add(a: Anim): void {
    this.anims.add(a);
    if (this.paused) a.pause();
  }

  /** Endless ambient motion (beat pulses, spinning records). */
  addLoop(a: Anim): void {
    this.loops.add(a);
    if (this.paused) a.pause();
  }

  remove(a: Anim): void {
    this.anims.delete(a);
    this.loops.delete(a);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    for (const a of [...this.anims, ...this.loops]) {
      if (paused) a.pause();
      else a.resume();
    }
  }

  /** Every entrance to its end state and loops back to rest (before exporting an image). */
  finish(): void {
    this.anims.forEach((a) => a.progress(1, false));
    this.loops.forEach((a) => a.pause(0));
  }
}

export interface CardRuntimeValue {
  controller: CardController;
  theme: ThemeTokens;
  reduced: boolean;
  /** Stable per-card seed, for picking copy variants. */
  seed: number;
}

const Ctx = createContext<CardRuntimeValue | null>(null);
export const CardRuntimeProvider = Ctx.Provider;

export function useCardRuntime(): CardRuntimeValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCardRuntime must be used inside a story card');
  return v;
}

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/**
 * Read synchronously on the first client render, so a card never starts an
 * animation that reduced motion would have to undo.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/** Picks a copy variant deterministically from the card's data hash. */
export function variant<T>(seed: number, options: readonly T[]): T {
  return options[seed % options.length]!;
}
