'use client';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { HOLD_MS, SWIPE_CLOSE_PX } from './constants';

interface Handlers {
  onPrev: () => void;
  onNext: () => void;
  onHold: (holding: boolean) => void;
  onSwipeDown: () => void;
}

/** Interactive elements inside the stage handle their own pointer events. */
const isInteractive = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest('button, a, input, select, label, [data-no-tap]');

/**
 * Story gestures on one element: tap the left third to go back, the right two
 * thirds to go forward, press and hold to pause, swipe down to close (touch).
 * Every gesture also has a visible button in the player.
 */
export function useStoryGestures(ref: RefObject<HTMLElement | null>, handlers: Handlers): void {
  // Listeners are attached once; they always call the latest handlers.
  const h = useRef(handlers);
  useLayoutEffect(() => {
    h.current = handlers;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number; t: number; id: number } | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let holding = false;

    const clear = () => {
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = null;
    };
    const release = () => {
      clear();
      if (holding) h.current.onHold(false);
      holding = false;
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || isInteractive(e.target)) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      clear();
      holdTimer = setTimeout(() => {
        holding = true;
        h.current.onHold(true);
      }, HOLD_MS);
    };
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      // Moving more than a few pixels is a drag, not a hold.
      if (!holding && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) clear();
    };
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const wasHold = holding;
      release();
      const s = start;
      start = null;
      if (wasHold) return;
      if (e.pointerType !== 'mouse' && dy > SWIPE_CLOSE_PX && Math.abs(dy) > Math.abs(dx) * 1.5) {
        h.current.onSwipeDown();
        return;
      }
      if (Math.hypot(dx, dy) > 24 || performance.now() - s.t > 600) return;
      const rect = el.getBoundingClientRect();
      if (e.clientX - rect.left < rect.width / 3) h.current.onPrev();
      else h.current.onNext();
    };
    const cancel = () => {
      start = null;
      release();
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('pointerleave', cancel);
    // A long press on touch shouldn't open the context menu.
    const menu = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', menu);
    return () => {
      clear();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('pointerleave', cancel);
      el.removeEventListener('contextmenu', menu);
    };
  }, [ref]);
}
