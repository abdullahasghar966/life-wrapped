'use client';
import type { RefObject } from 'react';
import { gsap, useGSAP } from '../../gsap';
import { useCardRuntime } from '../../runtime';

/**
 * Builds a card's GSAP timeline once, registers it with the card controller and
 * cleans it up on unmount (useGSAP reverts the context). Builders only use
 * `from()`/`fromTo()`, so with reduced motion we simply don't build anything and
 * the DOM already shows the final state.
 */
export function useCardAnim(
  scope: RefObject<HTMLElement | null>,
  build: (
    tl: gsap.core.Timeline,
    tools: { loop: (a: gsap.core.Animation) => void } & ReturnType<typeof useCardRuntime>,
  ) => void,
): void {
  const runtime = useCardRuntime();
  useGSAP(
    () => {
      // Reduced motion: no movement at all; the DOM already shows the final state.
      if (runtime.reduced) return;
      const tl = gsap.timeline({ defaults: { ease: runtime.theme.motion.ease } });
      const loops: gsap.core.Animation[] = [];
      build(tl, {
        ...runtime,
        loop: (a) => {
          loops.push(a);
          runtime.controller.addLoop(a);
        },
      });
      runtime.controller.add(tl);
      return () => {
        runtime.controller.remove(tl);
        loops.forEach((a) => runtime.controller.remove(a));
      };
    },
    { scope, dependencies: [runtime.reduced] },
  );
}
